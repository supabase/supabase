use std::future::Future;
use std::sync::Arc;
use std::time::Duration;

use crate::runtime::DenoRuntime;
use crate::runtime::RunOptionsBuilder;
use crate::runtime::WillTerminateReason;
use crate::worker::supervisor::v8_handle_beforeunload;
use crate::worker::supervisor::{self};
use crate::worker::DuplexStreamEntry;
use crate::worker::WorkerCx;
use anyhow::Error;
use base_mem_check::MemCheckState;
use ext_event_worker::events::ShutdownEvent;
use ext_event_worker::events::ShutdownReason;
use ext_event_worker::events::UncaughtExceptionEvent;
use ext_event_worker::events::WorkerEvents;
use ext_event_worker::events::WorkerMemoryUsed;
use futures_util::FutureExt;
use log::error;
use tokio::sync::mpsc;
use tokio::sync::Mutex;
use tokio::task::JoinError;
use tokio::time::timeout;
use tracing::warn;

use super::BaseCx;
use super::WorkerDriver;

const SUPERVISE_DEADLINE_SEC: Duration = Duration::from_secs(15);

#[derive(Clone)]
pub(crate) struct Managed {
  inner: Arc<WorkerCx>,
  cx: Arc<Mutex<BaseCx>>,
}

impl Managed {
  pub fn new(inner: Arc<WorkerCx>) -> Self {
    Managed {
      inner,
      cx: Arc::default(),
    }
  }
}

impl WorkerDriver for Managed {
  fn on_created<'l>(
    &self,
    runtime: &'l mut DenoRuntime,
  ) -> impl Future<Output = Result<WorkerEvents, Error>> + 'l {
    let Managed { inner, cx } = self.clone();

    async move {
      let mut cx = cx.lock().await;
      let network_receiver = cx.take_network_receiver()?;
      let termination_event_receiver = cx.take_termination_event_receiver()?;
      let termination_token = inner.termination_token.clone();

      drop(cx);

      let result = runtime
        .run(
          RunOptionsBuilder::new()
            .stream_rx(network_receiver)
            .wait_termination_request_token(false)
            .build()
            .unwrap(),
        )
        .await;

      if let Some(token) = termination_token {
        token.cancel();
      }

      match result {
        // if the error is execution terminated, check termination event reason
        (Err(err), cpu_usage_ms) => {
          let err_string = err.to_string();

          if err_string.ends_with("execution terminated") {
            Ok(
              termination_event_receiver
                .await
                .unwrap()
                .with_cpu_time_used(cpu_usage_ms as usize),
            )
          } else {
            error!(
              "runtime has escaped from the event loop unexpectedly: {:#}",
              err
            );

            Ok(WorkerEvents::UncaughtException(UncaughtExceptionEvent {
              exception: err_string,
              cpu_time_used: cpu_usage_ms as usize,
            }))
          }
        }

        (Ok(()), cpu_usage_ms) => Ok(
          termination_event_receiver
            .await
            .unwrap()
            .with_cpu_time_used(cpu_usage_ms as usize),
        ),
      }
    }
  }

  fn supervise(
    &self,
    runtime: &mut DenoRuntime,
  ) -> Option<impl Future<Output = Result<(), JoinError>> + 'static> {
    let Managed { inner, cx } = self.clone();
    let mut cx = cx.try_lock().ok()?;
    let runtime_drop_token = runtime.drop_token.clone();
    let termination_token = inner.termination_token.clone()?;
    let termination_event_sender = match cx.take_termination_event_sender() {
      Ok(v) => v,
      Err(err) => {
        tracing::error!(?err);
        return None;
      }
    };

    let (waker, thread_safe_handle) = (
      runtime.waker.clone(),
      runtime.js_runtime.v8_isolate().thread_safe_handle(),
    );

    let wait_fut = async move {
      termination_token.inbound.cancelled().await;

      let _ =
        termination_event_sender.send(WorkerEvents::Shutdown(ShutdownEvent {
          reason: ShutdownReason::TerminationRequested,
          cpu_time_used: 0,
          memory_used: WorkerMemoryUsed {
            total: 0,
            heap: 0,
            external: 0,
            mem_check_captured: MemCheckState::default(),
          },
        }));

      let data_ptr_mut =
        Box::into_raw(Box::new(supervisor::V8HandleBeforeunloadData {
          reason: WillTerminateReason::Termination,
        }));

      if thread_safe_handle
        .request_interrupt(v8_handle_beforeunload, data_ptr_mut as *mut _)
      {
        waker.wake();
      } else {
        drop(unsafe { Box::from_raw(data_ptr_mut) });
      }

      if (timeout(SUPERVISE_DEADLINE_SEC, runtime_drop_token.cancelled()).await)
        .is_err()
      {
        warn!(
          concat!(
            "termination job is running for over {} seconds ",
            "(Press Control-C to terminate the job immediately)"
          ),
          SUPERVISE_DEADLINE_SEC.as_secs()
        );

        tokio::select! {
          _ = runtime_drop_token.cancelled() => {},
          Ok(_) = tokio::signal::ctrl_c() => {
            warn!("interrupt signal received");
          }
        }
      }

      termination_token.outbound.cancel();
    };

    base_rt::SUPERVISOR_RT.spawn(wait_fut).boxed().into()
  }

  fn runtime_handle(&self) -> &'static tokio_util::task::LocalPoolHandle {
    &base_rt::PRIMARY_WORKER_RT
  }

  async fn network_sender(&self) -> mpsc::UnboundedSender<DuplexStreamEntry> {
    self.cx.lock().await.get_network_sender()
  }
}
