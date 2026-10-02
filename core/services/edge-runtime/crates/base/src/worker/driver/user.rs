use std::future::Future;
use std::sync::Arc;

use crate::runtime::DenoRuntime;
use crate::runtime::RunOptionsBuilder;
use crate::worker::supervisor::create_supervisor;
use crate::worker::supervisor::CPUUsageMetrics;
use crate::worker::DuplexStreamEntry;
use crate::worker::WorkerCx;

use anyhow::Error;
use ext_event_worker::events::UncaughtExceptionEvent;
use ext_event_worker::events::WorkerEvents;
use ext_workers::context::Timing;
use ext_workers::context::WorkerContextInitOpts;
use tokio::sync::mpsc;
use tokio::sync::Mutex;
use tokio::task::JoinError;
use tracing::debug;
use uuid::Uuid;

use super::BaseCx;
use super::WorkerDriver;

#[derive(Clone)]
pub(crate) struct User {
  inner: Arc<WorkerCx>,
  cx: Arc<Mutex<UserCx>>,
}

struct UserCx {
  inner: BaseCx,
  timing: Option<Timing>,
  cpu_usage_metrics_tx: Option<mpsc::UnboundedSender<CPUUsageMetrics>>,
}

impl std::ops::Deref for UserCx {
  type Target = BaseCx;

  fn deref(&self) -> &Self::Target {
    &self.inner
  }
}

impl std::ops::DerefMut for UserCx {
  fn deref_mut(&mut self) -> &mut Self::Target {
    &mut self.inner
  }
}

impl User {
  pub fn new(
    init_opts: &mut WorkerContextInitOpts,
    inner: Arc<WorkerCx>,
  ) -> Self {
    Self {
      inner,
      cx: Arc::new(Mutex::new(UserCx {
        inner: BaseCx::default(),
        timing: init_opts.timing.take(),
        cpu_usage_metrics_tx: None,
      })),
    }
  }
}

impl WorkerDriver for User {
  fn on_created<'l>(
    &self,
    runtime: &'l mut DenoRuntime,
  ) -> impl Future<Output = Result<WorkerEvents, Error>> + 'l {
    let User { cx, .. } = self.clone();

    async move {
      let mut cx = cx.lock().await;
      let network_receiver = cx.take_network_receiver()?;
      let cpu_usage_metrics_receiver = cx.cpu_usage_metrics_tx.take();
      let termination_event_receiver = cx.take_termination_event_receiver()?;

      drop(cx);

      match runtime
        .run(
          RunOptionsBuilder::new()
            .stream_rx(network_receiver)
            .cpu_usage_metrics_tx(cpu_usage_metrics_receiver)
            .wait_termination_request_token(true)
            .build()
            .unwrap(),
        )
        .await
      {
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
            log::error!(
              "runtime has escaped from the event loop unexpectedly: {}",
              err_string.as_str()
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
    let User { inner, cx } = self.clone();
    let mut cx = cx.try_lock().ok()?;

    let UserCx {
      timing,
      cpu_usage_metrics_tx,
      inner: base,
    } = &mut *cx;

    let termination_event_sender = match base.take_termination_event_sender() {
      Ok(v) => v,
      Err(err) => {
        tracing::error!(?err);
        return None;
      }
    };

    let mut s3_fs = runtime.s3_fs.clone();
    debug!(use_s3_fs = s3_fs.is_some());

    let (cpu_tx, cpu_rx) = mpsc::unbounded_channel();
    let Ok(cancel_token) = create_supervisor(
      inner.worker_key.unwrap_or(Uuid::nil()),
      runtime,
      inner.supervisor_policy,
      termination_event_sender,
      inner.pool_msg_tx.clone(),
      Some(cpu_rx),
      inner.cancel.clone(),
      timing.take(),
      inner.termination_token.clone(),
      inner.flags.clone(),
    ) else {
      return None;
    };

    *cpu_usage_metrics_tx = Some(cpu_tx);

    async move {
      let _guard = cancel_token.drop_guard();

      if let Some(fs) = s3_fs.take() {
        fs.flush_background_tasks().await;
      }

      Ok(())
    }
    .into()
  }

  fn runtime_handle(&self) -> &'static tokio_util::task::LocalPoolHandle {
    &base_rt::USER_WORKER_RT
  }

  async fn network_sender(&self) -> mpsc::UnboundedSender<DuplexStreamEntry> {
    self.cx.lock().await.get_network_sender()
  }
}
