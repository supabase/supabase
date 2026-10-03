use std::collections::HashMap;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::sync::Arc;

use anyhow::anyhow;
use anyhow::bail;
use deno_core::serde_json::Value;
use ext_event_worker::events::EventMetadata;
use ext_event_worker::events::WorkerEventWithMetadata;
use ext_event_worker::events::WorkerEvents;
use ext_workers::context::WorkerExit;
use ext_workers::context::WorkerRequestMsg;
use ext_workers::context::WorkerRuntimeOpts;
use ext_workers::errors::WorkerError;
use hyper_v014::Body;
use hyper_v014::Request;
use hyper_v014::Response;
use tokio::sync::mpsc;
use tokio::sync::oneshot;
use tokio_util::sync::CancellationToken;

pub fn get_event_metadata(conf: &WorkerRuntimeOpts) -> EventMetadata {
  let mut otel_attributes = HashMap::new();
  let mut event_metadata = EventMetadata {
    service_path: None,
    execution_id: None,
    otel_attributes: None,
  };

  otel_attributes.insert(
    "edge_runtime.worker.kind".to_string(),
    conf.to_worker_kind().to_string(),
  );

  if conf.is_user_worker() {
    let conf = conf.as_user_worker().unwrap();
    let context = conf.context.clone().unwrap_or_default();

    event_metadata.service_path = conf.service_path.clone();
    event_metadata.execution_id = conf.key;

    if let Some(Value::Object(attributes)) = context.get("otel") {
      for (k, v) in attributes {
        otel_attributes.insert(
          k.to_string(),
          match v {
            Value::String(str) => str.to_string(),
            others => others.to_string(),
          },
        );
      }
    }
  }

  event_metadata.otel_attributes = Some(otel_attributes);
  event_metadata
}

pub async fn send_user_worker_request(
  worker_request_msg_tx: mpsc::UnboundedSender<WorkerRequestMsg>,
  req: Request<Body>,
  cancel: CancellationToken,
  exit: WorkerExit,
  conn_token: Option<CancellationToken>,
) -> Result<Response<Body>, anyhow::Error> {
  let (res_tx, res_rx) =
    oneshot::channel::<Result<Response<Body>, hyper_v014::Error>>();
  let idle_timed_out = Arc::new(AtomicBool::new(false));
  let msg = WorkerRequestMsg {
    req,
    res_tx,
    conn_token,
    idle_timed_out: idle_timed_out.clone(),
  };

  // send the message to worker
  worker_request_msg_tx.send(msg)?;

  // wait for the response back from the worker
  let res = tokio::select! {
    () = cancel.cancelled() => {
      bail!(
        exit
          .error()
          .await
          .unwrap_or(anyhow!(WorkerError::RequestCancelledBySupervisor))
      )
    }

    res = res_rx => res,
  }?;

  match res {
    Ok(v) => {
      if idle_timed_out.load(Ordering::Relaxed) {
        bail!(WorkerError::RequestIdleTimeout)
      }
      Ok(v)
    }

    Err(err) => {
      if let Some(actual_error) = exit.error().await {
        return Err(actual_error);
      }

      Err(err.into())
    }
  }
}

pub fn send_event_if_event_worker_available(
  maybe_event_worker: Option<&mpsc::UnboundedSender<WorkerEventWithMetadata>>,
  event: WorkerEvents,
  metadata: EventMetadata,
) {
  if let Some(event_worker) = maybe_event_worker {
    let _ = event_worker.send(WorkerEventWithMetadata { event, metadata });
  }
}
