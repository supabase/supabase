#![allow(unexpected_cfgs)] // ctor's implementation checks an internal feature in the caller.

extern crate blas_src;

mod consts;
mod onnxruntime;
mod utils;

use anyhow::anyhow;
use anyhow::bail;
use anyhow::Context;
use anyhow::Error;
use base_rt::BlockingScopeCPUUsageMetricExt;
use deno_core::error::AnyError;
use deno_core::op2;
use deno_core::JsRuntime;
use deno_core::OpState;
use deno_core::V8CrossThreadTaskSpawner;
use futures::TryFutureExt;
use ndarray::Array1;
use ndarray::Array2;
use ndarray::ArrayView3;
use ndarray::Axis;
use ndarray::Ix3;
use ort::inputs;
use reqwest::Url;
use session::load_session_from_url;
use std::cell::RefCell;
use std::num::FpCategory;
use std::rc::Rc;
use std::sync::Arc;
use tokenizers::Tokenizer;
use tokio::runtime::Handle;
use tokio::sync::mpsc;
use tokio::sync::OnceCell;
use tokio::task;

use onnxruntime::*;
use tracing::debug_span;
use tracing::error;
use tracing::trace_span;
use tracing::Instrument;

deno_core::extension!(
  ai,
  ops = [
    op_ai_run_model,
    op_ai_init_model,
    op_ai_try_cleanup_unused_session,
    op_ai_ort_init_session,
    op_ai_ort_run_session,
  ],
  esm_entry_point = "ext:ai/ai.js",
  esm = [
    dir "js",
    "ai.js",
    "util/event_stream_parser.mjs",
    "util/event_source_stream.mjs",
    "onnxruntime/onnx.js",
    "onnxruntime/cache_adapter.js"
  ]
);

struct GteModelRequest {
  prompt: String,
  mean_pool: bool,
  normalize: bool,
  result_tx: mpsc::UnboundedSender<Result<Vec<f32>, Error>>,
}

fn mean_pool(
  last_hidden_states: ArrayView3<f32>,
  attention_mask: ArrayView3<i64>,
) -> Array2<f32> {
  let masked_hidden_states =
    last_hidden_states.into_owned() * &attention_mask.mapv(|x| x as f32);
  let sum_hidden_states = masked_hidden_states.sum_axis(Axis(1));
  let sum_attention_mask = attention_mask.mapv(|x| x as f32).sum_axis(Axis(1));

  sum_hidden_states / sum_attention_mask
}

fn normalize(mut tensor: Array2<f32>) -> Array2<f32> {
  let l2 = tensor.mapv(|value| value * value).sum().sqrt();

  // avoid zero division
  if l2.classify() != FpCategory::Zero {
    tensor.mapv_inplace(|value| value / l2);
  }

  tensor
}

async fn init_gte(state: Rc<RefCell<OpState>>) -> Result<(), Error> {
  let cross_thread_spawner =
    state.borrow().borrow::<V8CrossThreadTaskSpawner>().clone();
  let is_already_initialized = {
    type Sender = mpsc::UnboundedSender<GteModelRequest>;
    let state = state.borrow();
    state.has::<Sender>() && !state.borrow::<Sender>().is_closed()
  };

  if is_already_initialized {
    return Ok(());
  }

  let (req_tx, mut req_rx) = mpsc::unbounded_channel::<GteModelRequest>();
  let _ = state
    .borrow_mut()
    .try_take::<mpsc::UnboundedSender<GteModelRequest>>();

  state
    .borrow_mut()
    .put::<mpsc::UnboundedSender<GteModelRequest>>(req_tx);

  let handle = Handle::current();
  let (_, session) = match task::spawn_blocking({
    let handle = handle.clone();
    move || {
      handle.block_on(async move {
        load_session_from_url(Url::parse(consts::GTE_SMALL_MODEL_URL).unwrap())
          .await
      })
    }
  })
  .await
  .context("failed to initialize session")?
  {
    Ok(v) => v.into_split(),
    Err(err) => {
      error!(reason = ?err, "failed to create session");
      return Err(err);
    }
  };

  let mut tokenizer = match task::spawn_blocking({
    static ONCE: OnceCell<Tokenizer> = OnceCell::const_new();
    move || {
      handle.block_on(async move {
        ONCE
          .get_or_try_init(|| async {
            utils::fetch_and_cache_from_url(
              "tokenizer",
              Url::parse(consts::GTE_SMALL_TOKENIZER_URL).unwrap(),
              None,
            )
            .map_err(AnyError::from)
            .and_then(|it| {
              tokio::fs::read(it).into_future().map_err(AnyError::from)
            })
            .await
            .and_then(|it| Tokenizer::from_bytes(it).map_err(AnyError::msg))
          })
          .await
          .cloned()
      })
    }
  })
  .await
  .context("failed to initialize tokenizer")?
  {
    Ok(tokenizer) => tokenizer,
    Err(err) => {
      error!(reason = ?err, "failed to initialize tokenizer");
      return Err(err);
    }
  };

  // model's default max length is 128. Increase it to 512.
  let Some(truncation) = tokenizer.get_truncation_mut() else {
    let err = anyhow!("failed to get mutable truncation parameter");
    error!(reason = ?err);
    return Err(err);
  };

  truncation.max_length = 512;

  let run_inference = Arc::new(
    move |prompt: String,
          do_mean_pooling: bool,
          do_normalize: bool|
          -> Result<Vec<f32>, Error> {
      let encoded_prompt =
        tokenizer.encode(prompt, true).map_err(anyhow::Error::msg)?;
      let input_ids = encoded_prompt
        .get_ids()
        .iter()
        .map(|i| *i as i64)
        .collect::<Vec<_>>();

      let attention_mask = encoded_prompt
        .get_attention_mask()
        .iter()
        .map(|i| *i as i64)
        .collect::<Vec<_>>();

      let token_type_ids = encoded_prompt
        .get_type_ids()
        .iter()
        .map(|i| *i as i64)
        .collect::<Vec<_>>();

      let input_ids_array = Array1::from_iter(input_ids.iter().cloned());
      let input_ids_array = input_ids_array.view().insert_axis(Axis(0));

      let attention_mask_array =
        Array1::from_iter(attention_mask.iter().cloned());
      let attention_mask_array =
        attention_mask_array.view().insert_axis(Axis(0));

      let token_type_ids_array =
        Array1::from_iter(token_type_ids.iter().cloned());
      let token_type_ids_array =
        token_type_ids_array.view().insert_axis(Axis(0));

      let outputs = trace_span!("infer_gte").in_scope(|| {
        session.run(inputs! {
            "input_ids" => input_ids_array,
            "token_type_ids" => token_type_ids_array,
            "attention_mask" => attention_mask_array,
        }?)
      })?;

      let embeddings = outputs["last_hidden_state"].try_extract_tensor()?;
      let embeddings = embeddings.into_dimensionality::<Ix3>()?;

      let result = if do_mean_pooling {
        mean_pool(embeddings, attention_mask_array.insert_axis(Axis(2)))
      } else {
        embeddings.into_owned().remove_axis(Axis(0))
      };

      let result = if do_normalize {
        normalize(result)
      } else {
        result
      };

      Ok(result.view().to_slice().unwrap().to_vec())
    },
  );

  drop(task::spawn(
    async move {
      loop {
        let run_inference_fn = run_inference.clone();
        let req = req_rx.recv().await;

        if req.is_none() {
          break;
        }

        let req = req.unwrap();

        cross_thread_spawner.spawn(move |state| {
          JsRuntime::op_state_from(state)
            .borrow_mut()
            .spawn_cpu_accumul_blocking_scope(move || {
              let result =
                run_inference_fn(req.prompt, req.mean_pool, req.normalize);

              if let Err(err) = req.result_tx.send(result) {
                error!(reason = ?err, "failed to send inference results");
              };
            });
        });
      }
    }
    .instrument(debug_span!("infer_req_loop")),
  ));

  Ok(())
}

async fn run_gte(
  state: Rc<RefCell<OpState>>,
  prompt: String,
  mean_pool: bool,
  normalize: bool,
) -> Result<Vec<f32>, Error> {
  let req_tx;
  {
    let op_state = state.borrow();
    let maybe_req_tx =
      op_state.try_borrow::<mpsc::UnboundedSender<GteModelRequest>>();
    if maybe_req_tx.is_none() {
      bail!("run init model first")
    }
    req_tx = maybe_req_tx.unwrap().clone();
  }

  let (result_tx, mut result_rx) =
    mpsc::unbounded_channel::<Result<Vec<f32>, Error>>();

  req_tx.send(GteModelRequest {
    prompt,
    mean_pool,
    normalize,
    result_tx: result_tx.clone(),
  })?;

  result_rx
    .recv()
    .await
    .context("failed to get inference results")?
}

#[op2(async)]
#[serde]
pub async fn op_ai_init_model(
  state: Rc<RefCell<OpState>>,
  #[string] name: String,
) -> Result<(), AnyError> {
  if name == "gte-small" {
    init_gte(state).await
  } else {
    bail!("model not supported")
  }
}

#[op2(async)]
#[serde]
pub async fn op_ai_run_model(
  state: Rc<RefCell<OpState>>,
  #[string] name: String,
  #[string] prompt: String,
  mean_pool: bool,
  normalize: bool,
) -> Result<Vec<f32>, AnyError> {
  if name == "gte-small" {
    run_gte(state, prompt, mean_pool, normalize).await
  } else {
    bail!("model not supported")
  }
}

#[op2(async)]
#[bigint]
pub async fn op_ai_try_cleanup_unused_session() -> Result<usize, anyhow::Error>
{
  session::cleanup().await
}
