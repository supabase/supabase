mod model;
mod tensor;

pub(crate) mod onnx;
pub(crate) mod session;

use core::str;
use std::borrow::Cow;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::Arc;

use anyhow::anyhow;
use anyhow::Context;
use anyhow::Result;
use base_rt::BlockingScopeCPUUsageMetricExt;
use deno_core::error::AnyError;
use deno_core::op2;
use deno_core::JsBuffer;
use deno_core::JsRuntime;
use deno_core::OpState;
use deno_core::V8CrossThreadTaskSpawner;

use model::Model;
use model::ModelInfo;
use ort::session::Session;
use reqwest::Url;
use tensor::JsTensor;
use tensor::ToJsTensor;
use tokio::sync::oneshot;
use tracing::debug;
use tracing::trace;

#[op2(async)]
#[to_v8]
pub async fn op_ai_ort_init_session(
  state: Rc<RefCell<OpState>>,
  #[buffer] model_bytes: JsBuffer,
) -> Result<ModelInfo> {
  let model_bytes = model_bytes.into_parts().to_boxed_slice();
  let model_bytes_or_url = str::from_utf8(&model_bytes)
    .map_err(AnyError::from)
    .and_then(|utf8_str| Url::parse(utf8_str).map_err(AnyError::from));

  let model = match model_bytes_or_url {
    Ok(model_url) => {
      trace!(kind = "url", url = %model_url);
      Model::from_url(model_url).await?
    }
    Err(_) => {
      trace!(kind = "bytes", len = model_bytes.len());
      Model::from_bytes(&model_bytes).await?
    }
  };

  let mut state = state.borrow_mut();
  let mut sessions =
    { state.try_take::<Vec<Arc<Session>>>().unwrap_or_default() };

  sessions.push(model.get_session());
  state.put(sessions);

  Ok(model.get_info()).inspect(|it| {
    debug!(model_info = %it);
  })
}

#[op2(async)]
#[serde]
pub async fn op_ai_ort_run_session(
  state: Rc<RefCell<OpState>>,
  #[string] model_id: String,
  #[serde] input_values: HashMap<String, JsTensor>,
) -> Result<HashMap<String, ToJsTensor>> {
  let model = Model::from_id(&model_id)
    .await
    .ok_or(anyhow!("could not found session for id: {model_id:?}"))?;

  let model_session = model.get_session();
  let cross_thread_spawner =
    state.borrow().borrow::<V8CrossThreadTaskSpawner>().clone();
  let (tx, rx) = oneshot::channel();

  cross_thread_spawner.spawn(move |state| {
    let input_values = input_values
      .into_iter()
      .map(|(key, value)| {
        value
          .extract_ort_input()
          .map(|value| (Cow::from(key), value))
      })
      .collect::<Result<Vec<_>>>();

    let input_values = match input_values {
      Ok(v) => v,
      Err(err) => {
        let _ = tx.send(Err(err));
        return;
      }
    };

    JsRuntime::op_state_from(state)
      .borrow_mut()
      .spawn_cpu_accumul_blocking_scope(move || {
        let outputs = match model_session.run(input_values) {
          Ok(v) => v,
          Err(err) => {
            let _ = tx.send(Err(anyhow::Error::from(err)));
            return;
          }
        };

        let outputs = outputs
          .into_iter()
          .map(|(key, value)| {
            ToJsTensor::from_ort_tensor(value)
              .map(|value| (key.to_string(), value))
          })
          .collect::<Result<HashMap<_, _>>>();

        let outputs = match outputs {
          Ok(v) => v,
          Err(err) => {
            let _ = tx.send(Err(err));
            return;
          }
        };

        let _ = tx.send(Ok(outputs));
      });
  });

  rx.await.context("failed to get inference result")?
}
