use crate::events::EventMetadata;
use crate::events::LogEvent;
use crate::events::LogLevel;
use crate::events::WorkerEvents;
use crate::WorkerEventWithMetadata;
use deno_core::error::AnyError;
use deno_core::op2;
use deno_core::OpState;
use tokio::sync::mpsc;

#[op2(fast)]
fn op_user_worker_log(
  state: &mut OpState,
  #[string] msg: &str,
  #[smi] level: i32,
) -> Result<(), AnyError> {
  let maybe_tx =
    state.try_borrow::<mpsc::UnboundedSender<WorkerEventWithMetadata>>();
  let level = LogLevel::try_from(level as u8).unwrap_or_default();

  if let Some(tx) = maybe_tx {
    let event_metadata = state
      .try_borrow::<EventMetadata>()
      .unwrap_or(&EventMetadata::default())
      .clone();

    let metadata = WorkerEventWithMetadata {
      event: WorkerEvents::Log(LogEvent {
        msg: msg.to_string(),
        level,
      }),
      metadata: EventMetadata { ..event_metadata },
    };

    tracing::trace!(?metadata);
    tx.send(metadata)?;
  } else {
    #[cfg(feature = "tracing")]
    {
      match level {
        LogLevel::Debug => tracing::event!(tracing::Level::DEBUG, "{msg}"),
        LogLevel::Info => tracing::event!(tracing::Level::INFO, "{msg}"),
        LogLevel::Warning => tracing::event!(tracing::Level::WARN, "{msg}"),
        LogLevel::Error => tracing::event!(tracing::Level::ERROR, "{msg}"),
      }
    }

    #[cfg(not(feature = "tracing"))]
    {
      log::error!("[{:?}] {}", level, msg.to_string());
    }
  }

  Ok(())
}

deno_core::extension!(js_interceptors, ops = [op_user_worker_log],);
