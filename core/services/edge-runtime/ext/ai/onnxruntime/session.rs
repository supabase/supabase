use deno_core::error::AnyError;
use futures::io::AllowStdIo;
use once_cell::sync::Lazy;
use reqwest::Url;
use std::collections::HashMap;
use std::hash::Hasher;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio_util::compat::FuturesAsyncWriteCompatExt;
use tracing::debug;
use tracing::instrument;
use tracing::trace;
use xxhash_rust::xxh3::Xxh3;

use anyhow::anyhow;
use anyhow::Context;
use anyhow::Error;
use ort::execution_providers::CPUExecutionProvider;
use ort::execution_providers::CUDAExecutionProvider;
use ort::execution_providers::ExecutionProvider;
use ort::execution_providers::ExecutionProviderDispatch;
use ort::session::builder::GraphOptimizationLevel;
use ort::session::builder::SessionBuilder;
use ort::session::Session;

use crate::onnx::ensure_onnx_env_init;

static SESSIONS: Lazy<Mutex<HashMap<String, Arc<Session>>>> =
  Lazy::new(|| Mutex::new(HashMap::new()));

#[derive(Debug)]
pub struct SessionWithId {
  pub(crate) id: String,
  pub(crate) session: Arc<Session>,
}

impl From<(String, Arc<Session>)> for SessionWithId {
  fn from(value: (String, Arc<Session>)) -> Self {
    Self {
      id: value.0,
      session: value.1,
    }
  }
}

impl std::fmt::Display for SessionWithId {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    self.id.fmt(f)
  }
}

impl SessionWithId {
  pub fn into_split(self) -> (String, Arc<Session>) {
    (self.id, self.session)
  }
}

pub(crate) fn get_session_builder() -> Result<SessionBuilder, AnyError> {
  let orm_threads = std::env::var("OMP_NUM_THREADS")
    .map_or(None, |val| val.parse::<usize>().ok())
    .unwrap_or(1);

  let builder = Session::builder()?
    .with_optimization_level(GraphOptimizationLevel::Level3)?
    // NOTE(Nyannyacha): This is set to prevent memory leaks caused by different input
    // shapes.
    //
    // Backgrounds:
    // [1]: https://github.com/microsoft/onnxruntime/issues/11118
    // [2]: https://github.com/microsoft/onnxruntime/blob/main/onnxruntime/core/framework/session_options.h#L95-L110
    .with_memory_pattern(false)?
    .with_intra_threads(orm_threads)?;

  Ok(builder)
}

fn cpu_execution_provider(
) -> Box<dyn Iterator<Item = ExecutionProviderDispatch>> {
  Box::new(
    [
      // NOTE(Nyannacha): See the comment above. This makes `enable_cpu_mem_arena` set to
      // False.
      //
      // Backgrounds:
      // [1]: https://docs.rs/ort/2.0.0-rc.4/src/ort/execution_providers/cpu.rs.html#9-18
      // [2]: https://docs.rs/ort/2.0.0-rc.4/src/ort/execution_providers/cpu.rs.html#46-50
      CPUExecutionProvider::default().build(),
    ]
    .into_iter(),
  )
}

fn cuda_execution_provider(
) -> Box<dyn Iterator<Item = ExecutionProviderDispatch>> {
  let cuda = CUDAExecutionProvider::default();
  let providers = match cuda.is_available() {
    Ok(is_cuda_available) => {
      debug!(cuda_support = is_cuda_available);
      if is_cuda_available {
        vec![cuda.build()]
      } else {
        vec![]
      }
    }

    _ => vec![],
  };

  Box::new(providers.into_iter().chain(cpu_execution_provider()))
}

fn create_session(model_bytes: &[u8]) -> Result<Arc<Session>, Error> {
  let session = {
    if let Some(err) = ensure_onnx_env_init() {
      return Err(anyhow!("failed to create onnx environment: {err}"));
    }

    get_session_builder()?
      .with_execution_providers(cuda_execution_provider())?
      .commit_from_memory(model_bytes)?
  };

  Ok(Arc::new(session))
}

#[instrument(level = "debug", skip_all, fields(model_bytes = model_bytes.len()), err)]
pub(crate) async fn load_session_from_bytes(
  model_bytes: &[u8],
) -> Result<SessionWithId, Error> {
  let session_id = {
    let mut model_bytes = tokio::io::BufReader::new(model_bytes);
    let mut hasher = AllowStdIo::new(Xxh3::new()).compat_write();
    let _ = tokio::io::copy(&mut model_bytes, &mut hasher)
      .await
      .context("failed to calculate checksum")?;

    let hasher = hasher.into_inner().into_inner();
    faster_hex::hex_string(&hasher.finish().to_be_bytes())
  };

  let mut sessions = SESSIONS.lock().await;

  if let Some(session) = sessions.get(&session_id) {
    return Ok((session_id, session.clone()).into());
  }

  trace!(session_id, "new session");
  let session = create_session(model_bytes)?;

  sessions.insert(session_id.clone(), session.clone());

  Ok((session_id, session).into())
}

#[instrument(level = "debug", fields(%model_url), err)]
pub(crate) async fn load_session_from_url(
  model_url: Url,
) -> Result<SessionWithId, Error> {
  let session_id = fxhash::hash(model_url.as_str()).to_string();

  let mut sessions = SESSIONS.lock().await;

  if let Some(session) = sessions.get(&session_id) {
    debug!(session_id, "use existing session");
    return Ok((session_id, session.clone()).into());
  }

  let model_file_path = crate::utils::fetch_and_cache_from_url(
    "model",
    model_url,
    Some(session_id.to_string()),
  )
  .await?;

  let model_bytes = tokio::fs::read(model_file_path).await?;
  let session = create_session(model_bytes.as_slice())?;

  debug!(session_id, "new session");
  sessions.insert(session_id.clone(), session.clone());

  Ok((session_id, session).into())
}

pub(crate) async fn get_session(id: &str) -> Option<Arc<Session>> {
  SESSIONS.lock().await.get(id).cloned()
}

pub async fn cleanup() -> Result<usize, AnyError> {
  let mut remove_counter = 0;
  {
    let mut guard = SESSIONS.lock().await;
    let mut to_be_removed = vec![];

    for (key, session) in &mut *guard {
      // Since we're currently referencing the session at this point
      // It also will increments the counter, so we need to check: counter > 1
      if Arc::strong_count(session) > 1 {
        continue;
      }

      to_be_removed.push(key.clone());
    }

    for key in to_be_removed {
      let old_store = guard.remove(&key);
      debug_assert!(old_store.is_some());

      remove_counter += 1;
    }
  }

  Ok(remove_counter)
}
