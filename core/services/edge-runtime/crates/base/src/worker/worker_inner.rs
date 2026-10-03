use std::future::ready;
use std::sync::Arc;
use std::sync::RwLock;

use anyhow::Error;
use base_mem_check::MemCheckState;
use base_rt::error::CloneableError;
use deno_core::unsync::MaskFutureAsSend;
use ext_event_worker::events::EventMetadata;
use ext_event_worker::events::ShutdownEvent;
use ext_event_worker::events::UncaughtExceptionEvent;
use ext_event_worker::events::WorkerEventWithMetadata;
use ext_event_worker::events::WorkerEvents;
use ext_runtime::MetricSource;
use ext_runtime::RateLimiterOpts;
use ext_runtime::RuntimeMetricSource;
use ext_runtime::TraceRateLimiter;
use ext_runtime::WorkerMetricSource;
use ext_workers::context::UserWorkerMsgs;
use ext_workers::context::WorkerContextInitOpts;
use ext_workers::context::WorkerExit;
use ext_workers::context::WorkerExitStatus;
use ext_workers::context::WorkerKind;
use ext_workers::context::WorkerRequestMsg;
use futures_util::FutureExt;
use log::debug;
use log::error;
use tokio::io;
use tokio::sync::mpsc;
use tokio::sync::oneshot;
use tokio::time::Instant;
use tokio_util::sync::CancellationToken;
use tracing::debug_span;
use tracing::Instrument;
use uuid::Uuid;

use crate::inspector_server::Inspector;
use crate::runtime::DenoRuntime;
use crate::server::ServerFlags;
use crate::worker::utils::get_event_metadata;
use crate::worker::utils::send_event_if_event_worker_available;

use super::driver::WorkerDriver;
use super::driver::WorkerDriverImpl;
use super::pool::SupervisorPolicy;
use super::termination_token::TerminationToken;

pub type DuplexStreamEntry = (io::DuplexStream, Option<CancellationToken>);

pub struct WorkerCx {
  pub flags: Arc<ServerFlags>,
  pub worker_boot_start_time: Instant,
  pub events_msg_tx: Option<mpsc::UnboundedSender<WorkerEventWithMetadata>>,
  pub pool_msg_tx: Option<mpsc::UnboundedSender<UserWorkerMsgs>>,
  pub cancel: Option<CancellationToken>,
  pub event_metadata: EventMetadata,
  pub worker_key: Option<Uuid>,
  pub inspector: Option<Inspector>,
  pub supervisor_policy: SupervisorPolicy,
  pub worker_name: String,
  pub worker_kind: WorkerKind,
  pub termination_token: Option<TerminationToken>,
}

pub struct WorkerBuilder {
  init_opts: WorkerContextInitOpts,
  flags: Arc<ServerFlags>,
  inspector: Option<Inspector>,
  supervisor_policy: Option<SupervisorPolicy>,
  termination_token: Option<TerminationToken>,
  worker_naming_fn: Option<Box<dyn Fn(Option<Uuid>) -> String + Send>>,
}

impl WorkerBuilder {
  pub fn new(
    init_opts: WorkerContextInitOpts,
    flags: Arc<ServerFlags>,
  ) -> Self {
    Self {
      init_opts,
      flags,
      inspector: None,
      supervisor_policy: None,
      termination_token: None,
      worker_naming_fn: None,
    }
  }

  pub fn inspector(mut self, value: Inspector) -> Self {
    self.inspector = Some(value);
    self
  }

  pub fn supervisor_policy(mut self, value: SupervisorPolicy) -> Self {
    self.supervisor_policy = Some(value);
    self
  }

  pub fn termination_token(mut self, value: TerminationToken) -> Self {
    self.termination_token = Some(value);
    self
  }

  pub fn worker_naming_fn<F>(mut self, value: F) -> Self
  where
    F: Fn(Option<Uuid>) -> String + Send + 'static,
  {
    self.worker_naming_fn = Some(Box::new(value) as _);
    self
  }

  pub fn set_inspector(&mut self, value: Option<Inspector>) -> &mut Self {
    self.inspector = value;
    self
  }

  pub fn set_supervisor_policy(
    &mut self,
    value: Option<SupervisorPolicy>,
  ) -> &mut Self {
    self.supervisor_policy = value;
    self
  }

  pub fn set_termination_token(
    &mut self,
    value: Option<TerminationToken>,
  ) -> &mut Self {
    self.termination_token = value;
    self
  }

  pub fn set_worker_naming_fn<F>(&mut self, value: Option<F>) -> &mut Self
  where
    F: Fn(Option<Uuid>) -> String + Send + 'static,
  {
    self.worker_naming_fn = value.map(|it| Box::new(it) as _);
    self
  }

  pub(crate) fn build(self) -> Result<Worker, Error> {
    let Self {
      mut init_opts,
      flags,
      inspector,
      supervisor_policy,
      termination_token,
      worker_naming_fn,
    } = self;

    let conf = &init_opts.conf;
    let worker_kind = conf.to_worker_kind();
    let worker_naming_fn =
      worker_naming_fn.unwrap_or(Box::new(|uuid| match worker_kind {
        WorkerKind::MainWorker => "main-worker".to_string(),
        WorkerKind::EventsWorker => "events-workers".to_string(),
        WorkerKind::UserWorker => uuid
          .map(|it| format!("sb-iso-{:?}", it))
          .unwrap_or("isolate-worker-unknown".to_string()),
      }));

    let worker_key = conf.as_user_worker().and_then(|it| it.key);
    let worker_name = worker_naming_fn(worker_key);
    let worker_cancel_token =
      conf.as_user_worker().and_then(|it| it.cancel.clone());
    let worker_pool_msg_tx =
      conf.as_user_worker().and_then(|it| it.pool_msg_tx.clone());
    let worker_events_msg_tx = conf
      .as_user_worker()
      .and_then(|it| it.events_msg_tx.clone());

    let cx = Arc::new(WorkerCx {
      flags,
      worker_boot_start_time: Instant::now(),
      events_msg_tx: worker_events_msg_tx,
      pool_msg_tx: worker_pool_msg_tx,
      cancel: worker_cancel_token,
      event_metadata: get_event_metadata(conf),
      worker_key,
      supervisor_policy: supervisor_policy.unwrap_or_default(),
      inspector,
      worker_name,
      worker_kind,
      termination_token,
    });

    let imp = WorkerDriverImpl::new(&mut init_opts, cx.clone());

    Ok(Worker {
      imp,
      cx,
      init_opts: Some(init_opts),
    })
  }
}

pub(crate) struct Worker {
  pub(crate) imp: WorkerDriverImpl,
  pub(crate) cx: Arc<WorkerCx>,
  pub(crate) init_opts: Option<WorkerContextInitOpts>,
}

impl std::ops::Deref for Worker {
  type Target = WorkerCx;

  fn deref(&self) -> &Self::Target {
    &self.cx
  }
}

pub type BooterSignalArgs =
  (MetricSource, Arc<RwLock<MemCheckState>>, CancellationToken);

impl Worker {
  pub fn start(
    self,
    eager_module_init: bool,
    booter_signal: oneshot::Sender<Result<BooterSignalArgs, Error>>,
    exit: WorkerExit,
  ) {
    let worker_name = self.worker_name.clone();
    let worker_key = self.worker_key;
    let event_metadata = self.event_metadata.clone();

    let events_msg_tx = self.events_msg_tx.clone();
    let pool_msg_tx = self.pool_msg_tx.clone();

    let imp = self.imp.clone();
    let cx = self.cx.clone();
    let worker_kind = cx.worker_kind;

    let rt = imp.runtime_handle();
    let worker_fut = async move {
      let new_runtime = 'scope: {
        match DenoRuntime::new(self).await {
          Ok(mut v) => {
            if eager_module_init {
              if let Err(err) = v.init_main_module().await {
                break 'scope Err(err);
              }
            }
            Ok(v)
          }
          Err(err) => Err(err),
        }
      };
      let mut new_runtime = match new_runtime {
        Ok(v) => v,
        Err(err) => {
          let err = CloneableError::from(err.context("worker boot error"));
          let _ = booter_signal.send(Err(err.clone().into()));

          return Some(imp.on_boot_error(err.into()).await);
        }
      };

      let metric_src = {
        let metric_src =
          WorkerMetricSource::from_js_runtime(&mut new_runtime.js_runtime);

        if let Some(opts) = new_runtime.conf.as_main_worker().cloned() {
          let state = new_runtime.js_runtime.op_state();
          let mut state_mut = state.borrow_mut();
          let metric_src = RuntimeMetricSource::new(
            metric_src.clone(),
            opts
              .event_worker_metric_src
              .and_then(|it| it.into_worker().ok()),
            opts.shared_metric_src,
          );

          state_mut.put(metric_src.clone());
          MetricSource::Runtime(metric_src)
        } else {
          if let Some(opts) = new_runtime.conf.as_user_worker().cloned() {
            if let RateLimiterOpts::Configured(config) = opts.rate_limiter {
              match TraceRateLimiter::new(config) {
                Ok(limiter) => {
                  let state = new_runtime.js_runtime.op_state();
                  let mut state_mut = state.borrow_mut();
                  state_mut.put(limiter);
                }
                Err(err) => {
                  error!("failed to compile rate limit rules: {err}");
                }
              }
            }
          }
          MetricSource::Worker(metric_src)
        }
      };

      let _ = booter_signal.send(Ok((
        metric_src,
        new_runtime.mem_check_state(),
        new_runtime.drop_token.clone(),
      )));

      let span = debug_span!(
        "poll",
        thread = ?std::thread::current().id(),
      );

      let supervise_fut = match imp.clone().supervise(&mut new_runtime) {
        Some(v) => v.boxed(),
        None if worker_kind.is_user_worker() => return None,
        None => ready(Ok(())).boxed(),
      };

      let _guard = scopeguard::guard((), |_| {
        if let Some((key, tx)) = worker_key.zip(pool_msg_tx) {
          if let Err(err) = tx.send(UserWorkerMsgs::Shutdown(key)) {
            error!(
              "failed to send the shutdown signal to user worker pool: {:?}",
              err
            );
          }
        }
      });

      let worker_poll_fut = async move {
        let result = imp.on_created(&mut new_runtime).await;
        let maybe_uncaught_exception_event = match result.as_ref() {
          Ok(WorkerEvents::UncaughtException(ev)) => Some(ev.clone()),
          Err(err) => Some(UncaughtExceptionEvent {
            cpu_time_used: 0,
            exception: err.to_string(),
          }),

          _ => None,
        };

        if let Some(ev) = maybe_uncaught_exception_event {
          exit.set(WorkerExitStatus::WithUncaughtException(ev)).await;
        }

        drop(new_runtime);
        let _ = supervise_fut.await;

        result
      }
      .instrument(span);

      Some(
        rt.spawn_pinned({
          let fut = unsafe { MaskFutureAsSend::new(worker_poll_fut) };
          move || tokio::task::spawn_local(fut)
        })
        .await
        .map_err(anyhow::Error::from)
        .and_then(|it| it.map_err(anyhow::Error::from))
        .and_then(|it| it.into_inner()),
      )
    };
    let worker_result_fut = {
      let event_metadata = event_metadata.clone();
      async move {
        let Some(result) = worker_fut.await else {
          return;
        };

        match result {
          Ok(event) => {
            match event {
              WorkerEvents::Shutdown(ShutdownEvent {
                cpu_time_used, ..
              })
              | WorkerEvents::UncaughtException(UncaughtExceptionEvent {
                cpu_time_used,
                ..
              }) => {
                debug!("CPU time used: {:?}ms", cpu_time_used);
              }

              _ => {}
            };

            send_event_if_event_worker_available(
              events_msg_tx.as_ref(),
              event,
              event_metadata,
            );
          }

          Err(err) => error!("unexpected worker error {}", err),
        };
      }
    }
    .instrument(debug_span!(
      "worker",
      id = worker_name.as_str(),
      kind = %worker_kind,
      metadata = ?event_metadata
    ));

    drop(tokio::spawn(unsafe {
      MaskFutureAsSend::new(worker_result_fut)
    }));
  }
}

#[derive(Debug, Clone)]
pub struct WorkerSurface {
  pub metric: MetricSource,
  pub msg_tx: mpsc::UnboundedSender<WorkerRequestMsg>,
  pub exit: WorkerExit,
  pub cancel: CancellationToken,
  pub mem_check: Arc<RwLock<MemCheckState>>,
}
