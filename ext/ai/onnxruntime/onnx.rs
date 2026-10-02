use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::sync::Mutex;

use ctor::ctor;
use deno_core::error::StdAnyError;
use scopeguard::guard;
use tracing::error;
use tracing::instrument;

static ONNX_INIT_ONNX_ENV_DONE: AtomicBool = AtomicBool::new(false);
static ONNX_INIT_RESULT: Mutex<Option<Arc<ort::Error>>> = Mutex::new(None);

#[ctor]
#[instrument]
fn init_onnx_env() {
  let mut guard1 = ONNX_INIT_RESULT.lock().unwrap();
  let mut _guard2 = guard(&ONNX_INIT_ONNX_ENV_DONE, |v| {
    let _ = v.swap(true, Ordering::SeqCst);
  });

  let _guard3 = guard(std::panic::take_hook(), |v| {
    std::panic::set_hook(v);
  });

  std::panic::set_hook(Box::new(|_| {
    // no op
  }));

  let result = std::panic::catch_unwind(|| {
    // Create the ONNX Runtime environment, for all sessions created in this process.
    // TODO: Add CUDA execution provider
    ort::init().with_name("EXT_AI_ONNX").commit()
  });

  match result {
    Err(err) => {
      // the most common reason that reaches to this arm is a library loading failure.
      let err = match err.downcast_ref::<&'static str>() {
        Some(s) => s,
        None => match err.downcast_ref::<String>() {
          Some(s) => &s[..],
          None => "unknown error",
        },
      };
      let _ = guard1.insert(Arc::new(ort::Error::wrap(StdAnyError::from(
        anyhow::Error::msg(err.to_owned()),
      ))));
    }

    Ok(Err(err)) => {
      error!(reason = ?err, "failed to create environment");
      let _ = guard1.insert(Arc::new(err));
    }

    _ => {}
  }
}

pub(crate) fn ensure_onnx_env_init() -> Option<Arc<ort::Error>> {
  assert!(ONNX_INIT_ONNX_ENV_DONE.load(Ordering::SeqCst));
  ONNX_INIT_RESULT.lock().unwrap().clone()
}
