use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;

use anyhow::Context;
use deno::deno_telemetry::OtelConfig;
use deno_facade::EszipPayloadKind;
use either::Either;
use ext_event_worker::events::BootEvent;
use ext_event_worker::events::WorkerEventWithMetadata;
use ext_event_worker::events::WorkerEvents;
use ext_runtime::MetricSource;
use ext_runtime::SharedMetricSource;
use ext_workers::context::EventWorkerRuntimeOpts;
use ext_workers::context::MainWorkerRuntimeOpts;
use ext_workers::context::UserWorkerMsgs;
use ext_workers::context::WorkerContextInitOpts;
use ext_workers::context::WorkerExit;
use ext_workers::context::WorkerRequestMsg;
use ext_workers::context::WorkerRuntimeOpts;
use tokio::sync::mpsc;
use tokio::sync::oneshot;

use crate::inspector_server::Inspector;
use crate::server::ServerFlags;
use crate::worker::worker_inner::BooterSignalArgs;

use super::driver::WorkerDriver;
use super::pool::SupervisorPolicy;
use super::termination_token::TerminationToken;
use super::utils::send_event_if_event_worker_available;
use super::WorkerBuilder;
use super::WorkerSurface;

mod request {
  use std::future::pending;
  use std::io::ErrorKind;
  use std::sync::atomic::Ordering;
  use std::sync::Arc;
  use std::time::Duration;

  use deno_core::unsync::sync::AtomicFlag;
  use ext_workers::context::WorkerKind;
  use ext_workers::context::WorkerRequestMsg;
  use http_utils::io::Upgraded2;
  use http_utils::utils::emit_status_code;
  use http_utils::utils::get_upgrade_type;
  use http_v02::StatusCode;
  use hyper_v014::client::conn::http1;
  use hyper_v014::upgrade::OnUpgrade;
  use hyper_v014::Body;
  use hyper_v014::Response;
  use once_cell::sync::Lazy;
  use tokio::io;
  use tokio::net::TcpStream;
  use tokio::sync::mpsc;
  use tokio::sync::oneshot;
  use tokio::time::sleep;
  use tokio_rustls::server::TlsStream;
  use tracing::warn;

  use crate::server::ServerFlags;
  use crate::timeout::CancelOnWriteTimeout;
  use crate::timeout::ReadTimeoutStream;
  use crate::timeout::{self};
  use crate::worker::DuplexStreamEntry;

  pub(super) async fn handle_request(
    flags: Arc<ServerFlags>,
    worker_kind: WorkerKind,
    duplex_stream_tx: mpsc::UnboundedSender<DuplexStreamEntry>,
    msg: WorkerRequestMsg,
  ) -> Result<(), anyhow::Error> {
    let request_idle_timeout_dur = flags.request_idle_timeout.get(worker_kind);
    let request_buf_size = flags.request_buffer_size.unwrap_or_else(|| {
      const KIB: usize = 1024;
      static CHECK: Lazy<AtomicFlag> = Lazy::new(AtomicFlag::default);

      if !CHECK.is_raised() {
        CHECK.raise();
        warn!(
          "request buffer size is not specified, so it will be set to 1 KiB"
        );
      }

      KIB as u64
    });

    let (ours, theirs) = io::duplex(request_buf_size as usize);
    let WorkerRequestMsg {
      mut req,
      res_tx,
      conn_token,
      idle_timed_out,
    } = msg;

    let _ = duplex_stream_tx.send((theirs, conn_token.clone()));
    let req_upgrade_type = get_upgrade_type(req.headers());
    let req_upgrade = req_upgrade_type
      .clone()
      .and_then(|it| Some(it).zip(req.extensions_mut().remove::<OnUpgrade>()));

    // send the HTTP request to the worker over duplex stream
    let (mut request_sender, connection) =
      http1::Builder::new().writev(true).handshake(ours).await?;

    let (upgrade_tx, upgrade_rx) = oneshot::channel();

    // spawn a task to poll the connection and drive the HTTP state
    tokio::task::spawn({
      async move {
        match connection.without_shutdown().await {
          Err(e) => {
            log::error!(
              "error in {} worker connection: {}",
              worker_kind,
              e.message()
            );
          }

          Ok(parts) => {
            if let Some((requested, req_upgrade)) = req_upgrade {
              if let Ok((Some(accepted), status)) = upgrade_rx.await {
                if status == StatusCode::SWITCHING_PROTOCOLS
                  && accepted == requested
                {
                  tokio::spawn(relay_upgraded_request_and_response(
                    req_upgrade,
                    parts,
                    request_idle_timeout_dur,
                  ));

                  return;
                }
              };
            }

            if let Some(token) = conn_token {
              token.cancelled_owned().await;
            }
          }
        }
      }
    });

    tokio::task::yield_now().await;

    let maybe_cancel_fut = async move {
      if let Some(dur) = request_idle_timeout_dur {
        sleep(dur).await;
      } else {
        pending::<()>().await;
        unreachable!()
      }
    };

    let res = tokio::select! {
      resp = request_sender.send_request(req) => resp,
      _ = maybe_cancel_fut => {
        idle_timed_out.store(true, Ordering::Relaxed);
        Ok(emit_status_code(
          http_v02::StatusCode::GATEWAY_TIMEOUT,
          None,
          false
        ))
      }
    };

    let Ok(res) = res else {
      drop(res_tx.send(res));
      return Ok(());
    };

    if let Some(requested) = req_upgrade_type {
      let res_upgrade_type = get_upgrade_type(res.headers());
      let _ = upgrade_tx.send((res_upgrade_type.clone(), res.status()));

      match res_upgrade_type {
        Some(accepted) if accepted == requested => {}
        _ => {
          drop(res_tx.send(Ok(emit_status_code(
            StatusCode::BAD_GATEWAY,
            None,
            true,
          ))));
          return Ok(());
        }
      }
    }

    if let Some(dur) = request_idle_timeout_dur {
      let headers = res.headers();
      let is_streamed_response =
        !headers.contains_key(http_v02::header::CONTENT_LENGTH);

      if is_streamed_response {
        let (parts, body) = res.into_parts();

        drop(res_tx.send(Ok(Response::from_parts(
          parts,
          Body::wrap_stream(CancelOnWriteTimeout::new(body, dur)),
        ))));

        return Ok(());
      }
    }

    drop(res_tx.send(Ok(res)));
    Ok(())
  }

  async fn relay_upgraded_request_and_response(
    downstream: OnUpgrade,
    parts: http1::Parts<io::DuplexStream>,
    maybe_idle_timeout: Option<Duration>,
  ) {
    let upstream = Upgraded2::new(parts.io, parts.read_buf);
    let mut upstream = if let Some(dur) = maybe_idle_timeout {
      ReadTimeoutStream::with_timeout(upstream, dur)
    } else {
      ReadTimeoutStream::with_bypass(upstream)
    };

    let mut downstream = downstream.await.expect("failed to upgrade request");

    match io::copy_bidirectional(&mut upstream, &mut downstream).await {
      Ok(_) => {}
      Err(err)
        if matches!(
          err.kind(),
          ErrorKind::TimedOut | ErrorKind::BrokenPipe
        ) => {}
      Err(err) if matches!(err.kind(), ErrorKind::UnexpectedEof) => {
        let Ok(_) =
          downstream.downcast::<timeout::Stream<TlsStream<TcpStream>>>()
        else {
          // TODO(Nyannyacha): It would be better if we send
          // `close_notify` before shutdown an upstream if downstream is a
          // TLS stream.

          // INVARIANT: `UnexpectedEof` due to shutdown `DuplexStream` is
          // only expected to occur in the context of `TlsStream`.
          panic!("unhandleable unexpected eof");
        };
      }

      value => {
        unreachable!("coping between upgraded connections failed: {:?}", value);
      }
    }

    // XXX(Nyannyacha): Here you might want to emit the event metadata.
  }
}

pub type WorkerBuilderHook =
  Box<dyn FnOnce(&mut WorkerBuilder) -> Result<(), anyhow::Error> + Send>;

pub struct WorkerSurfaceBuilder {
  init_opts: Option<WorkerContextInitOpts>,
  flags: Option<Arc<ServerFlags>>,
  policy: Option<SupervisorPolicy>,
  termination_token: Option<TerminationToken>,
  inspector: Option<Inspector>,
  worker_builder_hook: Option<WorkerBuilderHook>,
  eager_module_init: bool,
}

impl Default for WorkerSurfaceBuilder {
  fn default() -> Self {
    Self::new()
  }
}

impl WorkerSurfaceBuilder {
  pub fn new() -> Self {
    Self {
      init_opts: None,
      flags: None,
      policy: None,
      termination_token: None,
      inspector: None,
      worker_builder_hook: None,
      eager_module_init: false,
    }
  }

  pub fn init_opts(mut self, value: WorkerContextInitOpts) -> Self {
    self.init_opts = Some(value);
    self
  }

  pub fn sever_flags(
    mut self,
    value: Either<Arc<ServerFlags>, ServerFlags>,
  ) -> Self {
    self.flags = Some(value.map_right(Arc::new).into_inner());
    self
  }

  pub fn policy(mut self, value: SupervisorPolicy) -> Self {
    self.policy = Some(value);
    self
  }

  pub fn termination_token(mut self, value: TerminationToken) -> Self {
    self.termination_token = Some(value);
    self
  }

  pub fn inspector(mut self, value: Inspector) -> Self {
    self.inspector = Some(value);
    self
  }

  pub fn worker_builder_hook<F>(mut self, value: F) -> Self
  where
    F: FnOnce(&mut WorkerBuilder) -> Result<(), anyhow::Error> + Send + 'static,
  {
    self.worker_builder_hook = Some(Box::new(value) as _);
    self
  }

  pub fn eager_module_init(mut self, value: bool) -> Self {
    self.eager_module_init = value;
    self
  }

  pub fn set_init_opts(
    &mut self,
    value: Option<WorkerContextInitOpts>,
  ) -> &mut Self {
    self.init_opts = value;
    self
  }

  pub fn set_server_flags(
    &mut self,
    value: Option<Either<Arc<ServerFlags>, ServerFlags>>,
  ) -> &mut Self {
    self.flags = value.map(|it| it.map_right(Arc::new).into_inner());
    self
  }

  pub fn set_policy(&mut self, value: Option<SupervisorPolicy>) -> &mut Self {
    self.policy = value;
    self
  }

  pub fn set_termination_token(
    &mut self,
    value: Option<TerminationToken>,
  ) -> &mut Self {
    self.termination_token = value;
    self
  }

  pub fn set_inspector(&mut self, value: Option<Inspector>) -> &mut Self {
    self.inspector = value;
    self
  }

  pub fn set_worker_builder_hook<F>(&mut self, value: Option<F>) -> &mut Self
  where
    F: FnOnce(&mut WorkerBuilder) -> Result<(), anyhow::Error> + Send + 'static,
  {
    self.worker_builder_hook = value.map(|it| Box::new(it) as _);
    self
  }

  pub fn set_eager_module_init(&mut self, value: bool) -> &mut Self {
    self.eager_module_init = value;
    self
  }

  pub async fn build(self) -> Result<WorkerSurface, anyhow::Error> {
    let Self {
      init_opts,
      flags,
      policy,
      termination_token,
      inspector,
      worker_builder_hook,
      eager_module_init,
    } = self;

    let (worker_boot_result_tx, worker_boot_result_rx) =
      oneshot::channel::<Result<BooterSignalArgs, anyhow::Error>>();

    let flags = flags.unwrap_or_default();
    let init_opts = init_opts.context("init_opts must be specified")?;
    let worker_kind = init_opts.conf.to_worker_kind();
    let exit = WorkerExit::default();
    let mut worker_builder = WorkerBuilder::new(init_opts, flags.clone());

    worker_builder
      .set_inspector(inspector)
      .set_supervisor_policy(
        worker_kind.is_user_worker().then_some(policy).flatten(),
      )
      .set_termination_token(termination_token.clone());

    if let Some(hook) = worker_builder_hook {
      hook(&mut worker_builder)?;
    }

    let worker = worker_builder.build()?;
    let cx = worker.cx.clone();
    let network_sender = worker.imp.network_sender().await;

    worker.start(eager_module_init, worker_boot_result_tx, exit.clone());

    // create an async task waiting for requests for worker
    let (worker_req_tx, mut worker_req_rx) =
      mpsc::unbounded_channel::<WorkerRequestMsg>();
    let worker_req_handle = tokio::task::spawn({
      async move {
        while let Some(msg) = worker_req_rx.recv().await {
          tokio::task::spawn({
            let flags = flags.clone();
            let network_sender = network_sender.clone();

            async move {
              if let Err(err) =
                request::handle_request(flags, worker_kind, network_sender, msg)
                  .await
              {
                log::error!("worker failed to handle request: {:?}", err);
              }
            }
          });
        }
      }
    });

    // wait for worker to be successfully booted
    match worker_boot_result_rx.await? {
      Ok((metric, mem_check_state, cancel)) => {
        let elapsed = cx.worker_boot_start_time.elapsed().as_millis();

        send_event_if_event_worker_available(
          cx.events_msg_tx.as_ref(),
          WorkerEvents::Boot(BootEvent {
            boot_time: elapsed as usize,
          }),
          cx.event_metadata.clone(),
        );

        Ok(WorkerSurface {
          metric,
          msg_tx: worker_req_tx,
          exit,
          cancel,
          mem_check: mem_check_state,
        })
      }

      Err(err) => {
        worker_req_handle.abort();

        if let Some(token) = termination_token.as_ref() {
          token.outbound.cancel();
        }

        Err(err)
      }
    }
  }
}

pub struct MainWorkerSurface(WorkerSurface);

impl std::ops::Deref for MainWorkerSurface {
  type Target = WorkerSurface;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl std::ops::DerefMut for MainWorkerSurface {
  fn deref_mut(&mut self) -> &mut Self::Target {
    &mut self.0
  }
}

pub struct MainWorkerSurfaceBuilder {
  inner: WorkerSurfaceBuilder,

  main_worker_path: PathBuf,
  no_module_cache: Option<bool>,
  entrypoint: Option<String>,
  worker_pool_tx: Option<mpsc::UnboundedSender<UserWorkerMsgs>>,
  shared_metric_src: Option<SharedMetricSource>,
  event_worker_metric_src: Option<MetricSource>,
  otel_config: Option<OtelConfig>,
}

impl std::ops::Deref for MainWorkerSurfaceBuilder {
  type Target = WorkerSurfaceBuilder;

  fn deref(&self) -> &Self::Target {
    &self.inner
  }
}

impl std::ops::DerefMut for MainWorkerSurfaceBuilder {
  fn deref_mut(&mut self) -> &mut Self::Target {
    &mut self.inner
  }
}

impl MainWorkerSurfaceBuilder {
  pub fn new<P>(main_worker_path: P) -> Self
  where
    P: AsRef<Path>,
  {
    Self {
      inner: WorkerSurfaceBuilder::new(),

      main_worker_path: main_worker_path.as_ref().to_path_buf(),
      no_module_cache: None,
      entrypoint: None,

      worker_pool_tx: None,
      shared_metric_src: None,
      event_worker_metric_src: None,
      otel_config: None,
    }
  }

  pub fn no_module_cache(mut self, value: bool) -> Self {
    self.no_module_cache = Some(value);
    self
  }

  pub fn entrypoint(mut self, value: &str) -> Self {
    self.entrypoint = Some(value.to_string());
    self
  }

  pub fn worker_pool_sender(
    mut self,
    value: mpsc::UnboundedSender<UserWorkerMsgs>,
  ) -> Self {
    self.worker_pool_tx = Some(value);
    self
  }

  pub fn shared_metric_source(mut self, value: SharedMetricSource) -> Self {
    self.shared_metric_src = Some(value);
    self
  }

  pub fn event_worker_metric_source(mut self, value: MetricSource) -> Self {
    self.event_worker_metric_src = Some(value);
    self
  }

  pub fn otel_config(mut self, value: OtelConfig) -> Self {
    self.otel_config = Some(value);
    self
  }

  pub fn set_no_module_cache(&mut self, value: Option<bool>) -> &mut Self {
    self.no_module_cache = value;
    self
  }

  pub fn set_entrypoint(&mut self, value: Option<&str>) -> &mut Self {
    self.entrypoint = value.map(str::to_string);
    self
  }

  pub fn set_worker_pool_sender(
    &mut self,
    value: Option<mpsc::UnboundedSender<UserWorkerMsgs>>,
  ) -> &mut Self {
    self.worker_pool_tx = value;
    self
  }

  pub fn set_shared_metric_source(
    &mut self,
    value: Option<SharedMetricSource>,
  ) -> &mut Self {
    self.shared_metric_src = value;
    self
  }

  pub fn set_event_worker_metric_source(
    &mut self,
    value: Option<MetricSource>,
  ) -> &mut Self {
    self.event_worker_metric_src = value;
    self
  }

  pub fn set_otel_config(&mut self, value: Option<OtelConfig>) -> &mut Self {
    self.otel_config = value;
    self
  }

  pub async fn build(self) -> Result<MainWorkerSurface, anyhow::Error> {
    let Self {
      mut inner,
      main_worker_path,
      no_module_cache,
      entrypoint,
      worker_pool_tx,
      shared_metric_src,
      event_worker_metric_src,
      otel_config,
    } = self;

    let flags = inner.flags.as_ref().cloned().unwrap_or_default();

    let mut service_path = main_worker_path.clone();
    let mut maybe_eszip = None;

    if let Some(ext) = main_worker_path.extension() {
      if ext == "eszip" {
        service_path = main_worker_path.parent().unwrap().to_path_buf();
        maybe_eszip =
          Some(EszipPayloadKind::VecKind(std::fs::read(main_worker_path)?));
      }
    }

    inner.set_init_opts(Some(WorkerContextInitOpts {
      pool_key: None,
      service_path,
      no_module_cache: no_module_cache.unwrap_or(flags.no_module_cache),
      no_npm: None,

      timing: None,
      maybe_eszip,
      maybe_entrypoint: entrypoint,
      maybe_module_code: None,
      conf: WorkerRuntimeOpts::MainWorker(MainWorkerRuntimeOpts {
        worker_pool_tx: worker_pool_tx
          .context("worker_pool_sender must be specified")?,
        shared_metric_src,
        event_worker_metric_src,
        context: None,
      }),
      env_vars: std::env::vars().collect(),
      static_patterns: vec![],

      maybe_s3_fs_config: None,
      maybe_tmp_fs_config: None,
      maybe_otel_config: otel_config,
    }));

    Ok(MainWorkerSurface(
      inner
        .build()
        .await
        .map_err(|err| err.context("main worker boot error"))?,
    ))
  }
}

pub struct EventWorkerSurface {
  inner: WorkerSurface,
  event_msg_tx: mpsc::UnboundedSender<WorkerEventWithMetadata>,
}

impl std::ops::Deref for EventWorkerSurface {
  type Target = WorkerSurface;

  fn deref(&self) -> &Self::Target {
    &self.inner
  }
}

impl std::ops::DerefMut for EventWorkerSurface {
  fn deref_mut(&mut self) -> &mut Self::Target {
    &mut self.inner
  }
}

impl EventWorkerSurface {
  pub fn event_message_sender(
    &self,
  ) -> mpsc::UnboundedSender<WorkerEventWithMetadata> {
    self.event_msg_tx.clone()
  }
}

pub struct EventWorkerSurfaceBuilder {
  inner: WorkerSurfaceBuilder,

  event_worker_path: PathBuf,
  no_module_cache: Option<bool>,
  entrypoint: Option<String>,
  otel_config: Option<OtelConfig>,
}

impl std::ops::Deref for EventWorkerSurfaceBuilder {
  type Target = WorkerSurfaceBuilder;

  fn deref(&self) -> &Self::Target {
    &self.inner
  }
}

impl std::ops::DerefMut for EventWorkerSurfaceBuilder {
  fn deref_mut(&mut self) -> &mut Self::Target {
    &mut self.inner
  }
}

impl EventWorkerSurfaceBuilder {
  pub fn new<P>(event_worker_path: P) -> Self
  where
    P: AsRef<Path>,
  {
    Self {
      inner: WorkerSurfaceBuilder::new(),

      event_worker_path: event_worker_path.as_ref().to_path_buf(),
      no_module_cache: None,
      entrypoint: None,
      otel_config: None,
    }
  }

  pub fn no_module_cache(mut self, value: bool) -> Self {
    self.no_module_cache = Some(value);
    self
  }

  pub fn entrypoint(mut self, value: &str) -> Self {
    self.entrypoint = Some(value.to_string());
    self
  }

  pub fn otel_config(mut self, value: OtelConfig) -> Self {
    self.otel_config = Some(value);
    self
  }

  pub fn set_no_module_cache(&mut self, value: Option<bool>) -> &mut Self {
    self.no_module_cache = value;
    self
  }

  pub fn set_entrypoint(&mut self, value: Option<&str>) -> &mut Self {
    self.entrypoint = value.map(str::to_string);
    self
  }

  pub fn set_otel_config(&mut self, value: Option<OtelConfig>) -> &mut Self {
    self.otel_config = value;
    self
  }

  pub async fn build(self) -> Result<EventWorkerSurface, anyhow::Error> {
    let Self {
      mut inner,
      event_worker_path,
      no_module_cache,
      entrypoint,
      otel_config,
    } = self;

    let (event_msg_tx, event_msg_rx) =
      mpsc::unbounded_channel::<WorkerEventWithMetadata>();

    let flags = inner.flags.as_ref().cloned().unwrap_or_default();
    let event_worker_exit_deadline_sec = flags.event_worker_exit_deadline_sec;

    let mut service_path = event_worker_path.clone();
    let mut maybe_eszip = None;

    if let Some(ext) = event_worker_path.extension() {
      if ext == "eszip" {
        service_path = event_worker_path.parent().unwrap().to_path_buf();
        maybe_eszip =
          Some(EszipPayloadKind::VecKind(std::fs::read(event_worker_path)?));
      }
    }

    inner.set_init_opts(Some(WorkerContextInitOpts {
      pool_key: None,
      service_path,
      no_module_cache: no_module_cache.unwrap_or(flags.no_module_cache),
      no_npm: None,

      env_vars: std::env::vars().collect(),
      timing: None,
      maybe_eszip,
      maybe_entrypoint: entrypoint,
      maybe_module_code: None,
      conf: WorkerRuntimeOpts::EventsWorker(EventWorkerRuntimeOpts {
        events_msg_rx: Some(event_msg_rx),
        event_worker_exit_deadline_sec: Some(event_worker_exit_deadline_sec),
        context: None,
      }),
      static_patterns: vec![],

      maybe_s3_fs_config: None,
      maybe_tmp_fs_config: None,
      maybe_otel_config: otel_config,
    }));

    Ok(EventWorkerSurface {
      inner: inner
        .build()
        .await
        .map_err(|err| err.context("event worker boot error"))?,

      event_msg_tx,
    })
  }
}
