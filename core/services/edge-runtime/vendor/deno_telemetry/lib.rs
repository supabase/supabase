// Copyright 2018-2025 the Deno authors. MIT license.

#![allow(clippy::too_many_arguments)]
#![allow(unexpected_cfgs)] // OpenTelemetry macros inspect private features from their defining crate.

use std::borrow::Cow;
use std::cell::RefCell;
use std::collections::HashMap;
use std::env;
use std::fmt::Debug;
use std::pin::Pin;
use std::rc::Rc;
use std::sync::atomic::AtomicU64;
use std::sync::Arc;
use std::sync::Mutex;
use std::task::Context;
use std::task::Poll;
use std::thread;
use std::time::Duration;
use std::time::SystemTime;

use base_rt::RuntimeOtelExtraAttributes;
use deno_core::anyhow;
use deno_core::anyhow::anyhow;
use deno_core::anyhow::bail;
use deno_core::futures::channel::mpsc;
use deno_core::futures::channel::mpsc::UnboundedSender;
use deno_core::futures::future::BoxFuture;
use deno_core::futures::stream;
use deno_core::futures::FutureExt;
use deno_core::futures::Stream;
use deno_core::futures::StreamExt;
use deno_core::op2;
use deno_core::v8;
use deno_core::v8::DataError;
use deno_core::GarbageCollected;
use deno_core::OpState;
use once_cell::sync::Lazy;
use once_cell::sync::OnceCell;
use opentelemetry::logs::AnyValue;
use opentelemetry::logs::LogRecord as LogRecordTrait;
use opentelemetry::logs::Severity;
use opentelemetry::metrics::AsyncInstrumentBuilder;
pub use opentelemetry::metrics::Histogram;
use opentelemetry::metrics::InstrumentBuilder;
pub use opentelemetry::metrics::MeterProvider;
pub use opentelemetry::metrics::UpDownCounter;
use opentelemetry::otel_debug;
use opentelemetry::otel_error;
use opentelemetry::trace::Link;
use opentelemetry::trace::SpanContext;
use opentelemetry::trace::SpanId;
use opentelemetry::trace::SpanKind;
use opentelemetry::trace::Status as SpanStatus;
use opentelemetry::trace::TraceFlags;
use opentelemetry::trace::TraceId;
use opentelemetry::trace::TraceState;
use opentelemetry::InstrumentationScope;
pub use opentelemetry::Key;
pub use opentelemetry::KeyValue;
pub use opentelemetry::StringValue;
pub use opentelemetry::Value;
use opentelemetry_otlp::HttpExporterBuilder;
use opentelemetry_otlp::Protocol;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_otlp::WithHttpConfig;
use opentelemetry_sdk::export::trace::SpanData;
use opentelemetry_sdk::logs::BatchLogProcessor;
use opentelemetry_sdk::logs::LogProcessor;
use opentelemetry_sdk::logs::LogRecord;
use opentelemetry_sdk::metrics::exporter::PushMetricExporter;
use opentelemetry_sdk::metrics::reader::MetricReader;
use opentelemetry_sdk::metrics::ManualReader;
use opentelemetry_sdk::metrics::MetricResult;
use opentelemetry_sdk::metrics::SdkMeterProvider;
use opentelemetry_sdk::metrics::Temporality;
use opentelemetry_sdk::trace::BatchSpanProcessor;
use opentelemetry_sdk::trace::IdGenerator;
use opentelemetry_sdk::trace::RandomIdGenerator;
use opentelemetry_sdk::trace::SpanEvents;
use opentelemetry_sdk::trace::SpanLinks;
use opentelemetry_sdk::trace::SpanProcessor as _;
use opentelemetry_sdk::Resource;
use opentelemetry_semantic_conventions::resource::PROCESS_RUNTIME_NAME;
use opentelemetry_semantic_conventions::resource::PROCESS_RUNTIME_VERSION;
use opentelemetry_semantic_conventions::resource::TELEMETRY_SDK_LANGUAGE;
use opentelemetry_semantic_conventions::resource::TELEMETRY_SDK_NAME;
use opentelemetry_semantic_conventions::resource::TELEMETRY_SDK_VERSION;
use serde::Deserialize;
use serde::Serialize;
use tokio::sync::oneshot;
use tokio::task::JoinSet;

deno_core::extension!(
  deno_telemetry,
  ops = [
    op_otel_log,
    op_otel_log_foreign,
    op_otel_span_attribute1,
    op_otel_span_attribute2,
    op_otel_span_attribute3,
    op_otel_span_add_link,
    op_otel_span_update_name,
    op_otel_metric_attribute3,
    op_otel_metric_record0,
    op_otel_metric_record1,
    op_otel_metric_record2,
    op_otel_metric_record3,
    op_otel_metric_observable_record0,
    op_otel_metric_observable_record1,
    op_otel_metric_observable_record2,
    op_otel_metric_observable_record3,
    op_otel_metric_wait_to_observe,
    op_otel_metric_observation_done,
  ],
  objects = [OtelTracer, OtelMeter, OtelSpan],
  esm = ["telemetry.ts", "util.ts"],
);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OtelRuntimeConfig {
  pub runtime_name: Cow<'static, str>,
  pub runtime_version: Cow<'static, str>,
}

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct OtelConfig {
  pub tracing_enabled: bool,
  pub metrics_enabled: bool,
  pub console: OtelConsoleConfig,
  pub deterministic_prefix: Option<u8>,
  pub propagators: std::collections::HashSet<OtelPropagators>,
}

impl OtelConfig {
  pub fn as_v8(&self) -> Box<[u8]> {
    let mut data = vec![
      self.tracing_enabled as u8,
      self.metrics_enabled as u8,
      self.console as u8,
    ];

    data.extend(self.propagators.iter().map(|propagator| *propagator as u8));

    data.into_boxed_slice()
  }
}

#[derive(
  Default, Debug, Clone, Copy, Serialize, Deserialize, Eq, PartialEq, Hash,
)]
#[repr(u8)]
pub enum OtelPropagators {
  TraceContext = 0,
  Baggage = 1,
  #[default]
  None = 2,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[repr(u8)]
pub enum OtelConsoleConfig {
  Ignore = 0,
  Capture = 1,
  Replace = 2,
}

impl Default for OtelConsoleConfig {
  fn default() -> Self {
    Self::Ignore
  }
}

static OTEL_SHARED_RUNTIME_SPAWN_TASK_TX: Lazy<
  UnboundedSender<BoxFuture<'static, ()>>,
> = Lazy::new(otel_create_shared_runtime);

static OTEL_PRE_COLLECT_CALLBACKS: Lazy<
  Mutex<Vec<oneshot::Sender<oneshot::Sender<()>>>>,
> = Lazy::new(Default::default);

fn otel_create_shared_runtime() -> UnboundedSender<BoxFuture<'static, ()>> {
  let (spawn_task_tx, mut spawn_task_rx) =
    mpsc::unbounded::<BoxFuture<'static, ()>>();

  thread::spawn(move || {
    let rt = tokio::runtime::Builder::new_current_thread()
      .enable_io()
      .enable_time()
      // This limits the number of threads for blocking operations (like for
      // synchronous fs ops) or CPU bound tasks like when we run dprint in
      // parallel for deno fmt.
      // The default value is 512, which is an unhelpfully large thread pool. We
      // don't ever want to have more than a couple dozen threads.
      .max_blocking_threads(if cfg!(windows) {
        // on windows, tokio uses blocking tasks for child process IO, make sure
        // we have enough available threads for other tasks to run
        4 * std::thread::available_parallelism()
          .map(|n| n.get())
          .unwrap_or(8)
      } else {
        32
      })
      .build()
      .unwrap();

    rt.block_on(async move {
      while let Some(task) = spawn_task_rx.next().await {
        tokio::spawn(task);
      }
    });
  });

  spawn_task_tx
}

#[derive(Clone, Copy)]
pub struct OtelSharedRuntime;

impl hyper::rt::Executor<BoxFuture<'static, ()>> for OtelSharedRuntime {
  fn execute(&self, fut: BoxFuture<'static, ()>) {
    (*OTEL_SHARED_RUNTIME_SPAWN_TASK_TX)
      .unbounded_send(fut)
      .expect("failed to send task to shared OpenTelemetry runtime");
  }
}

impl opentelemetry_sdk::runtime::Runtime for OtelSharedRuntime {
  type Interval = Pin<Box<dyn Stream<Item = ()> + Send + 'static>>;
  type Delay = Pin<Box<tokio::time::Sleep>>;

  fn interval(&self, period: Duration) -> Self::Interval {
    stream::repeat(())
      .then(move |_| tokio::time::sleep(period))
      .boxed()
  }

  fn spawn(&self, future: BoxFuture<'static, ()>) {
    (*OTEL_SHARED_RUNTIME_SPAWN_TASK_TX)
      .unbounded_send(future)
      .expect("failed to send task to shared OpenTelemetry runtime");
  }

  fn delay(&self, duration: Duration) -> Self::Delay {
    Box::pin(tokio::time::sleep(duration))
  }
}

impl opentelemetry_sdk::runtime::RuntimeChannel for OtelSharedRuntime {
  type Receiver<T: Debug + Send> = BatchMessageChannelReceiver<T>;
  type Sender<T: Debug + Send> = BatchMessageChannelSender<T>;

  fn batch_message_channel<T: Debug + Send>(
    &self,
    capacity: usize,
  ) -> (Self::Sender<T>, Self::Receiver<T>) {
    let (batch_tx, batch_rx) = tokio::sync::mpsc::channel::<T>(capacity);
    (batch_tx.into(), batch_rx.into())
  }
}

#[derive(Debug)]
pub struct BatchMessageChannelSender<T: Send> {
  sender: tokio::sync::mpsc::Sender<T>,
}

impl<T: Send> From<tokio::sync::mpsc::Sender<T>>
  for BatchMessageChannelSender<T>
{
  fn from(sender: tokio::sync::mpsc::Sender<T>) -> Self {
    Self { sender }
  }
}

impl<T: Send> opentelemetry_sdk::runtime::TrySend
  for BatchMessageChannelSender<T>
{
  type Message = T;

  fn try_send(
    &self,
    item: Self::Message,
  ) -> Result<(), opentelemetry_sdk::runtime::TrySendError> {
    self.sender.try_send(item).map_err(|err| match err {
      tokio::sync::mpsc::error::TrySendError::Full(_) => {
        opentelemetry_sdk::runtime::TrySendError::ChannelFull
      }
      tokio::sync::mpsc::error::TrySendError::Closed(_) => {
        opentelemetry_sdk::runtime::TrySendError::ChannelClosed
      }
    })
  }
}

pub struct BatchMessageChannelReceiver<T> {
  receiver: tokio::sync::mpsc::Receiver<T>,
}

impl<T> From<tokio::sync::mpsc::Receiver<T>>
  for BatchMessageChannelReceiver<T>
{
  fn from(receiver: tokio::sync::mpsc::Receiver<T>) -> Self {
    Self { receiver }
  }
}

impl<T> Stream for BatchMessageChannelReceiver<T> {
  type Item = T;

  fn poll_next(
    mut self: Pin<&mut Self>,
    cx: &mut Context<'_>,
  ) -> Poll<Option<Self::Item>> {
    self.receiver.poll_recv(cx)
  }
}

enum DenoPeriodicReaderMessage {
  Register(std::sync::Weak<opentelemetry_sdk::metrics::Pipeline>),
  Export,
  ForceFlush(oneshot::Sender<MetricResult<()>>),
  Shutdown(oneshot::Sender<MetricResult<()>>),
}

#[derive(Debug)]
struct DenoPeriodicReader {
  tx: tokio::sync::mpsc::Sender<DenoPeriodicReaderMessage>,
  temporality: Temporality,
}

impl MetricReader for DenoPeriodicReader {
  fn register_pipeline(
    &self,
    pipeline: std::sync::Weak<opentelemetry_sdk::metrics::Pipeline>,
  ) {
    let _ = self
      .tx
      .try_send(DenoPeriodicReaderMessage::Register(pipeline));
  }

  fn collect(
    &self,
    _rm: &mut opentelemetry_sdk::metrics::data::ResourceMetrics,
  ) -> opentelemetry_sdk::metrics::MetricResult<()> {
    unreachable!("collect should not be called on DenoPeriodicReader");
  }

  fn force_flush(&self) -> opentelemetry_sdk::metrics::MetricResult<()> {
    let (tx, rx) = oneshot::channel();
    let _ = self.tx.try_send(DenoPeriodicReaderMessage::ForceFlush(tx));
    deno_core::futures::executor::block_on(rx).unwrap()?;
    Ok(())
  }

  fn shutdown(&self) -> opentelemetry_sdk::metrics::MetricResult<()> {
    let (tx, rx) = oneshot::channel();
    let _ = self.tx.try_send(DenoPeriodicReaderMessage::Shutdown(tx));
    deno_core::futures::executor::block_on(rx).unwrap()?;
    Ok(())
  }

  fn temporality(
    &self,
    _kind: opentelemetry_sdk::metrics::InstrumentKind,
  ) -> Temporality {
    self.temporality
  }
}

const METRIC_EXPORT_INTERVAL_NAME: &str = "OTEL_METRIC_EXPORT_INTERVAL";
const DEFAULT_INTERVAL: Duration = Duration::from_secs(60);

impl DenoPeriodicReader {
  fn new(exporter: opentelemetry_otlp::MetricExporter) -> Self {
    let interval = env::var(METRIC_EXPORT_INTERVAL_NAME)
      .ok()
      .and_then(|v| v.parse().map(Duration::from_millis).ok())
      .unwrap_or(DEFAULT_INTERVAL);

    let (tx, mut rx) = tokio::sync::mpsc::channel(256);

    let temporality = PushMetricExporter::temporality(&exporter);

    let worker = async move {
      let inner = ManualReader::builder()
        .with_temporality(PushMetricExporter::temporality(&exporter))
        .build();

      let collect_and_export = |collect_observed: bool| {
        let inner = &inner;
        let exporter = &exporter;
        async move {
          let mut resource_metrics =
            opentelemetry_sdk::metrics::data::ResourceMetrics {
              resource: Default::default(),
              scope_metrics: Default::default(),
            };
          if collect_observed {
            let callbacks = {
              let mut callbacks = OTEL_PRE_COLLECT_CALLBACKS.lock().unwrap();
              std::mem::take(&mut *callbacks)
            };
            let mut futures = JoinSet::new();
            for callback in callbacks {
              let (tx, rx) = oneshot::channel();
              if let Ok(()) = callback.send(tx) {
                futures.spawn(rx);
              }
            }
            while futures.join_next().await.is_some() {}
          }
          inner.collect(&mut resource_metrics)?;
          if resource_metrics.scope_metrics.is_empty() {
            return Ok(());
          }
          exporter.export(&mut resource_metrics).await?;
          Ok(())
        }
      };

      let mut ticker = tokio::time::interval(interval);
      ticker.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);
      ticker.tick().await;

      loop {
        let message = tokio::select! {
          _ = ticker.tick() => DenoPeriodicReaderMessage::Export,
          message = rx.recv() => if let Some(message) = message {
            message
          } else {
            break;
          },
        };

        match message {
          DenoPeriodicReaderMessage::Register(new_pipeline) => {
            inner.register_pipeline(new_pipeline);
          }
          DenoPeriodicReaderMessage::Export => {
            otel_debug!(
              name: "DenoPeriodicReader.ExportTriggered",
              message = "Export message received.",
            );
            if let Err(err) = collect_and_export(true).await {
              otel_error!(
                name: "DenoPeriodicReader.ExportFailed",
                message = "Failed to export metrics",
                reason = format!("{}", err));
            }
          }
          DenoPeriodicReaderMessage::ForceFlush(sender) => {
            otel_debug!(
              name: "DenoPeriodicReader.ForceFlushCalled",
              message = "Flush message received.",
            );
            let res = collect_and_export(false).await;
            if let Err(send_error) = sender.send(res) {
              otel_debug!(
                  name: "DenoPeriodicReader.Flush.SendResultError",
                  message = "Failed to send flush result.",
                  reason = format!("{:?}", send_error),
              );
            }
          }
          DenoPeriodicReaderMessage::Shutdown(sender) => {
            otel_debug!(
              name: "DenoPeriodicReader.ShutdownCalled",
              message = "Shutdown message received",
            );
            let res = collect_and_export(false).await;
            let _ = exporter.shutdown();
            if let Err(send_error) = sender.send(res) {
              otel_debug!(
                name: "DenoPeriodicReader.Shutdown.SendResultError",
                message = "Failed to send shutdown result",
                reason = format!("{:?}", send_error),
              );
            }
            break;
          }
        }
      }
    };

    (*OTEL_SHARED_RUNTIME_SPAWN_TASK_TX)
      .unbounded_send(worker.boxed())
      .expect("failed to send task to shared OpenTelemetry runtime");

    DenoPeriodicReader { tx, temporality }
  }
}

mod hyper_client {
  use std::fmt::Debug;
  use std::pin::Pin;
  use std::task::Poll;
  use std::task::{self};

  use deno_tls::create_client_config;
  use deno_tls::load_certs;
  use deno_tls::load_private_keys;
  use deno_tls::SocketUse;
  use deno_tls::TlsKey;
  use deno_tls::TlsKeys;
  use http_body_util::BodyExt;
  use http_body_util::Full;
  use hyper::body::Body as HttpBody;
  use hyper::body::Frame;
  use hyper_rustls::HttpsConnector;
  use hyper_util::client::legacy::connect::HttpConnector;
  use hyper_util::client::legacy::Client;
  use opentelemetry_http::Bytes;
  use opentelemetry_http::HttpError;
  use opentelemetry_http::Request;
  use opentelemetry_http::Response;
  use opentelemetry_http::ResponseExt;

  use super::OtelSharedRuntime;

  // same as opentelemetry_http::HyperClient except it uses OtelSharedRuntime
  #[derive(Debug, Clone)]
  pub struct HyperClient {
    inner: Client<HttpsConnector<HttpConnector>, Body>,
  }

  impl HyperClient {
    pub fn new() -> deno_core::anyhow::Result<Self> {
      let ca_certs = match std::env::var("OTEL_EXPORTER_OTLP_CERTIFICATE") {
        Ok(path) => vec![std::fs::read(path)?],
        _ => vec![],
      };

      let keys = match (
        std::env::var("OTEL_EXPORTER_OTLP_CLIENT_KEY"),
        std::env::var("OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE"),
      ) {
        (Ok(key_path), Ok(cert_path)) => {
          let key = std::fs::read(key_path)?;
          let cert = std::fs::read(cert_path)?;

          let certs = load_certs(&mut std::io::Cursor::new(cert))?;
          let key = load_private_keys(&key)?.into_iter().next().unwrap();

          TlsKeys::Static(TlsKey(certs, key))
        }
        _ => TlsKeys::Null,
      };

      let tls_config =
        create_client_config(None, ca_certs, None, keys, SocketUse::Http)?;
      let mut http_connector = HttpConnector::new();
      http_connector.enforce_http(false);
      let connector = HttpsConnector::from((http_connector, tls_config));

      Ok(Self {
        inner: Client::builder(OtelSharedRuntime).build(connector),
      })
    }
  }

  #[async_trait::async_trait]
  impl opentelemetry_http::HttpClient for HyperClient {
    async fn send(
      &self,
      request: Request<Vec<u8>>,
    ) -> Result<Response<Bytes>, HttpError> {
      let (parts, body) = request.into_parts();
      let request = Request::from_parts(parts, Body(Full::from(body)));
      let mut response = self.inner.request(request).await?;
      let headers = std::mem::take(response.headers_mut());

      let mut http_response = Response::builder()
        .status(response.status())
        .body(response.into_body().collect().await?.to_bytes())?;
      *http_response.headers_mut() = headers;

      Ok(http_response.error_for_status()?)
    }
  }

  #[pin_project::pin_project]
  pub struct Body(#[pin] Full<Bytes>);

  impl HttpBody for Body {
    type Data = Bytes;
    type Error = Box<dyn std::error::Error + Send + Sync + 'static>;

    #[inline]
    fn poll_frame(
      self: Pin<&mut Self>,
      cx: &mut task::Context<'_>,
    ) -> Poll<Option<Result<Frame<Self::Data>, Self::Error>>> {
      self.project().0.poll_frame(cx).map_err(Into::into)
    }

    #[inline]
    fn is_end_stream(&self) -> bool {
      self.0.is_end_stream()
    }

    #[inline]
    fn size_hint(&self) -> hyper::body::SizeHint {
      self.0.size_hint()
    }
  }
}

#[derive(Debug)]
pub struct OtelGlobals {
  pub span_processor: BatchSpanProcessor<OtelSharedRuntime>,
  pub log_processor: BatchLogProcessor<OtelSharedRuntime>,
  pub id_generator: DenoIdGenerator,
  pub meter_provider: SdkMeterProvider,
  pub builtin_instrumentation_scope: InstrumentationScope,
  pub config: OtelConfig,
}

pub static OTEL_GLOBALS: OnceCell<OtelGlobals> = OnceCell::new();

pub fn init(
  rt_config: OtelRuntimeConfig,
  config: OtelConfig,
) -> deno_core::anyhow::Result<()> {
  // Parse the `OTEL_EXPORTER_OTLP_PROTOCOL` variable. The opentelemetry_*
  // crates don't do this automatically.
  // TODO(piscisaureus): enable GRPC support.
  let protocol = match env::var("OTEL_EXPORTER_OTLP_PROTOCOL").as_deref() {
    Ok("http/protobuf") => Protocol::HttpBinary,
    Ok("http/json") => Protocol::HttpJson,
    Ok("") | Err(env::VarError::NotPresent) => Protocol::HttpBinary,
    Ok(protocol) => {
      return Err(deno_core::anyhow::anyhow!(
        "Env var OTEL_EXPORTER_OTLP_PROTOCOL specifies an unsupported protocol: {}",
        protocol
      ));
    }
    Err(err) => {
      return Err(deno_core::anyhow::anyhow!(
        "Failed to read env var OTEL_EXPORTER_OTLP_PROTOCOL: {}",
        err
      ));
    }
  };

  // Define the resource attributes that will be attached to all log records.
  // These attributes are sourced as follows (in order of precedence):
  //   * The `service.name` attribute from the `OTEL_SERVICE_NAME` env var.
  //   * Additional attributes from the `OTEL_RESOURCE_ATTRIBUTES` env var.
  //   * Default attribute values defined here.
  // TODO(piscisaureus): add more default attributes (e.g. script path).
  let mut resource = Resource::default();

  // Add the runtime name and version to the resource attributes. Also override
  // the `telemetry.sdk` attributes to include the Deno runtime.
  resource = resource.merge(&Resource::new(vec![
    KeyValue::new(PROCESS_RUNTIME_NAME, rt_config.runtime_name),
    KeyValue::new(PROCESS_RUNTIME_VERSION, rt_config.runtime_version.clone()),
    KeyValue::new(
      TELEMETRY_SDK_LANGUAGE,
      format!(
        "deno-{}",
        resource.get(Key::new(TELEMETRY_SDK_LANGUAGE)).unwrap()
      ),
    ),
    KeyValue::new(
      TELEMETRY_SDK_NAME,
      format!(
        "deno-{}",
        resource.get(Key::new(TELEMETRY_SDK_NAME)).unwrap()
      ),
    ),
    KeyValue::new(
      TELEMETRY_SDK_VERSION,
      format!(
        "{}-{}",
        rt_config.runtime_version,
        resource.get(Key::new(TELEMETRY_SDK_VERSION)).unwrap()
      ),
    ),
  ]));

  // The OTLP endpoint is automatically picked up from the
  // `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable. Additional headers can
  // be specified using `OTEL_EXPORTER_OTLP_HEADERS`.

  let client = hyper_client::HyperClient::new()?;

  let span_exporter = HttpExporterBuilder::default()
    .with_http_client(client.clone())
    .with_protocol(protocol)
    .build_span_exporter()?;
  let mut span_processor =
    BatchSpanProcessor::builder(span_exporter, OtelSharedRuntime).build();
  span_processor.set_resource(&resource);

  let temporality_preference =
    env::var("OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE")
      .ok()
      .map(|s| s.to_lowercase());
  let temporality = match temporality_preference.as_deref() {
    None | Some("cumulative") => Temporality::Cumulative,
    Some("delta") => Temporality::Delta,
    Some("lowmemory") => Temporality::LowMemory,
    Some(other) => {
      return Err(deno_core::anyhow::anyhow!(
        "Invalid value for OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: {}",
        other
      ));
    }
  };
  let metric_exporter = HttpExporterBuilder::default()
    .with_http_client(client.clone())
    .with_protocol(protocol)
    .build_metrics_exporter(temporality)?;
  let metric_reader = DenoPeriodicReader::new(metric_exporter);
  let meter_provider = SdkMeterProvider::builder()
    .with_reader(metric_reader)
    .with_resource(resource.clone())
    .build();

  let log_exporter = HttpExporterBuilder::default()
    .with_http_client(client)
    .with_protocol(protocol)
    .build_log_exporter()?;
  let log_processor =
    BatchLogProcessor::builder(log_exporter, OtelSharedRuntime).build();
  log_processor.set_resource(&resource);

  let builtin_instrumentation_scope =
    opentelemetry::InstrumentationScope::builder("deno")
      .with_version(rt_config.runtime_version.clone())
      .build();

  let id_generator = if let Some(prefix) = config.deterministic_prefix {
    DenoIdGenerator::deterministic(prefix)
  } else {
    DenoIdGenerator::random()
  };

  OTEL_GLOBALS
    .set(OtelGlobals {
      log_processor,
      span_processor,
      id_generator,
      meter_provider,
      builtin_instrumentation_scope,
      config,
    })
    .map_err(|_| deno_core::anyhow::anyhow!("failed to set otel globals"))?;

  Ok(())
}

/// This function is called by the runtime whenever it is about to call
/// `process::exit()`, to ensure that all OpenTelemetry logs are properly
/// flushed before the process terminates.
pub fn flush() {
  if let Some(OtelGlobals {
    span_processor: spans,
    log_processor: logs,
    meter_provider,
    ..
  }) = OTEL_GLOBALS.get()
  {
    let _ = spans.force_flush();
    let _ = logs.force_flush();
    let _ = meter_provider.force_flush();
  }
}

pub fn handle_log(record: &log::Record) {
  use log::Level;

  let Some(OtelGlobals {
    log_processor: logs,
    builtin_instrumentation_scope,
    ..
  }) = OTEL_GLOBALS.get()
  else {
    return;
  };

  let mut log_record = LogRecord::default();

  log_record.set_observed_timestamp(SystemTime::now());
  log_record.set_severity_number(match record.level() {
    Level::Error => Severity::Error,
    Level::Warn => Severity::Warn,
    Level::Info => Severity::Info,
    Level::Debug => Severity::Debug,
    Level::Trace => Severity::Trace,
  });
  log_record.set_severity_text(record.level().as_str());
  log_record.set_body(record.args().to_string().into());
  log_record.set_target(record.metadata().target().to_string());

  struct Visitor<'s>(&'s mut LogRecord);

  impl<'kvs> log::kv::VisitSource<'kvs> for Visitor<'_> {
    fn visit_pair(
      &mut self,
      key: log::kv::Key<'kvs>,
      value: log::kv::Value<'kvs>,
    ) -> Result<(), log::kv::Error> {
      #[allow(clippy::manual_map)]
      let value = if let Some(v) = value.to_bool() {
        Some(AnyValue::Boolean(v))
      } else if let Some(v) = value.to_borrowed_str() {
        Some(AnyValue::String(v.to_owned().into()))
      } else if let Some(v) = value.to_f64() {
        Some(AnyValue::Double(v))
      } else if let Some(v) = value.to_i64() {
        Some(AnyValue::Int(v))
      } else {
        None
      };

      if let Some(value) = value {
        let key = Key::from(key.as_str().to_owned());
        self.0.add_attribute(key, value);
      }

      Ok(())
    }
  }

  let _ = record.key_values().visit(&mut Visitor(&mut log_record));

  logs.emit(&mut log_record, builtin_instrumentation_scope);
}

#[derive(Debug)]
pub enum DenoIdGenerator {
  Random(RandomIdGenerator),
  Deterministic {
    next_trace_id: AtomicU64,
    next_span_id: AtomicU64,
  },
}

impl IdGenerator for DenoIdGenerator {
  fn new_trace_id(&self) -> TraceId {
    match self {
      Self::Random(generator) => generator.new_trace_id(),
      Self::Deterministic { next_trace_id, .. } => {
        let id =
          next_trace_id.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let bytes = id.to_be_bytes();
        let bytes = [
          0, 0, 0, 0, 0, 0, 0, 0, bytes[0], bytes[1], bytes[2], bytes[3],
          bytes[4], bytes[5], bytes[6], bytes[7],
        ];
        TraceId::from_bytes(bytes)
      }
    }
  }

  fn new_span_id(&self) -> SpanId {
    match self {
      Self::Random(generator) => generator.new_span_id(),
      Self::Deterministic { next_span_id, .. } => {
        let id =
          next_span_id.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        SpanId::from_bytes(id.to_be_bytes())
      }
    }
  }
}

impl DenoIdGenerator {
  fn random() -> Self {
    Self::Random(RandomIdGenerator::default())
  }

  fn deterministic(prefix: u8) -> Self {
    let prefix = u64::from(prefix) << 56;
    Self::Deterministic {
      next_trace_id: AtomicU64::new(prefix + 1),
      next_span_id: AtomicU64::new(prefix + 1),
    }
  }
}

fn parse_trace_id(
  scope: &mut v8::HandleScope<'_>,
  trace_id: v8::Local<'_, v8::Value>,
) -> TraceId {
  if let Ok(string) = trace_id.try_cast() {
    let value_view = v8::ValueView::new(scope, string);
    match value_view.data() {
      v8::ValueViewData::OneByte(bytes) => {
        TraceId::from_hex(&String::from_utf8_lossy(bytes))
          .unwrap_or(TraceId::INVALID)
      }

      _ => TraceId::INVALID,
    }
  } else if let Ok(uint8array) = trace_id.try_cast::<v8::Uint8Array>() {
    let data = uint8array.data();
    let byte_length = uint8array.byte_length();
    if byte_length != 16 {
      return TraceId::INVALID;
    }
    // SAFETY: We have ensured that the byte length is 16, so it is safe to
    // cast the data to an array of 16 bytes.
    let bytes = unsafe { &*(data as *const u8 as *const [u8; 16]) };
    TraceId::from_bytes(*bytes)
  } else {
    TraceId::INVALID
  }
}

fn parse_span_id(
  scope: &mut v8::HandleScope<'_>,
  span_id: v8::Local<'_, v8::Value>,
) -> SpanId {
  if let Ok(string) = span_id.try_cast() {
    let value_view = v8::ValueView::new(scope, string);
    match value_view.data() {
      v8::ValueViewData::OneByte(bytes) => {
        SpanId::from_hex(&String::from_utf8_lossy(bytes))
          .unwrap_or(SpanId::INVALID)
      }
      _ => SpanId::INVALID,
    }
  } else if let Ok(uint8array) = span_id.try_cast::<v8::Uint8Array>() {
    let data = uint8array.data();
    let byte_length = uint8array.byte_length();
    if byte_length != 8 {
      return SpanId::INVALID;
    }
    // SAFETY: We have ensured that the byte length is 8, so it is safe to
    // cast the data to an array of 8 bytes.
    let bytes = unsafe { &*(data as *const u8 as *const [u8; 8]) };
    SpanId::from_bytes(*bytes)
  } else {
    SpanId::INVALID
  }
}

macro_rules! attr_raw {
  ($scope:ident, $name:expr, $value:expr) => {{
    let name = if let Ok(name) = $name.try_cast() {
      let view = v8::ValueView::new($scope, name);
      match view.data() {
        v8::ValueViewData::OneByte(bytes) => {
          Some(String::from_utf8_lossy(bytes).into_owned())
        }
        v8::ValueViewData::TwoByte(bytes) => {
          Some(String::from_utf16_lossy(bytes))
        }
      }
    } else {
      None
    };
    let value = if let Ok(string) = $value.try_cast::<v8::String>() {
      Some(Value::String(StringValue::from({
        let x = v8::ValueView::new($scope, string);
        match x.data() {
          v8::ValueViewData::OneByte(bytes) => {
            String::from_utf8_lossy(bytes).into_owned()
          }
          v8::ValueViewData::TwoByte(bytes) => String::from_utf16_lossy(bytes),
        }
      })))
    } else if let Ok(number) = $value.try_cast::<v8::Number>() {
      Some(Value::F64(number.value()))
    } else if let Ok(boolean) = $value.try_cast::<v8::Boolean>() {
      Some(Value::Bool(boolean.is_true()))
    } else if let Ok(bigint) = $value.try_cast::<v8::BigInt>() {
      let (i64_value, _lossless) = bigint.i64_value();
      Some(Value::I64(i64_value))
    } else if let Ok(_array) = $value.try_cast::<v8::Array>() {
      // TODO: implement array attributes
      None
    } else {
      None
    };
    if let (Some(name), Some(value)) = (name, value) {
      Some(KeyValue::new(name, value))
    } else {
      None
    }
  }};
}

macro_rules! attr {
  ($scope:ident, $attributes:expr $(=> $dropped_attributes_count:expr)?, $name:expr, $value:expr) => {
    let attr = attr_raw!($scope, $name, $value);
    if let Some(kv) = attr {
      $attributes.push(kv);
    }
    $(
      else {
        $dropped_attributes_count += 1;
      }
    )?
  };
}

#[op2(fast)]
fn op_otel_log<'s>(
  scope: &mut v8::HandleScope<'s>,
  state: &mut OpState,
  message: v8::Local<'s, v8::Value>,
  #[smi] level: i32,
  span: v8::Local<'s, v8::Value>,
) {
  let Some(OtelGlobals {
    log_processor,
    builtin_instrumentation_scope,
    ..
  }) = OTEL_GLOBALS.get()
  else {
    return;
  };

  // Convert the integer log level that ext/console uses to the corresponding
  // OpenTelemetry log severity.
  let severity = match level {
    ..=0 => Severity::Debug,
    1 => Severity::Info,
    2 => Severity::Warn,
    3.. => Severity::Error,
  };

  let mut log_record = LogRecord::default();
  log_record.set_observed_timestamp(SystemTime::now());
  let Ok(message) = message.try_cast() else {
    return;
  };
  log_record.set_body(owned_string(scope, message).into());
  log_record.set_severity_number(severity);
  log_record.set_severity_text(severity.name());
  if let Some(runtime_attributes) =
    state.try_borrow::<RuntimeOtelExtraAttributes>()
  {
    for (k, v) in runtime_attributes.0.clone() {
      log_record.add_attribute(k, v.to_string());
    }
  }
  if let Some(span) =
    deno_core::_ops::try_unwrap_cppgc_object::<OtelSpan>(scope, span)
  {
    let state = span.0.borrow();
    match &**state {
      OtelSpanState::Recording(span) => {
        log_record.set_trace_context(
          span.span_context.trace_id(),
          span.span_context.span_id(),
          Some(span.span_context.trace_flags()),
        );
      }
      OtelSpanState::Done(span_context) => {
        log_record.set_trace_context(
          span_context.trace_id(),
          span_context.span_id(),
          Some(span_context.trace_flags()),
        );
      }
    }
  }

  log_processor.emit(&mut log_record, builtin_instrumentation_scope);
}

#[op2(fast)]
fn op_otel_log_foreign(
  scope: &mut v8::HandleScope<'_>,
  state: &mut OpState,
  #[string] message: String,
  #[smi] level: i32,
  trace_id: v8::Local<'_, v8::Value>,
  span_id: v8::Local<'_, v8::Value>,
  #[smi] trace_flags: u8,
) {
  let Some(OtelGlobals {
    log_processor,
    builtin_instrumentation_scope,
    ..
  }) = OTEL_GLOBALS.get()
  else {
    return;
  };

  // Convert the integer log level that ext/console uses to the corresponding
  // OpenTelemetry log severity.
  let severity = match level {
    ..=0 => Severity::Debug,
    1 => Severity::Info,
    2 => Severity::Warn,
    3.. => Severity::Error,
  };

  let trace_id = parse_trace_id(scope, trace_id);
  let span_id = parse_span_id(scope, span_id);

  let mut log_record = LogRecord::default();

  log_record.set_observed_timestamp(SystemTime::now());
  log_record.set_body(message.into());
  log_record.set_severity_number(severity);
  log_record.set_severity_text(severity.name());
  if let Some(runtime_attributes) =
    state.try_borrow::<RuntimeOtelExtraAttributes>()
  {
    for (k, v) in runtime_attributes.0.clone() {
      log_record.add_attribute(k, v.to_string());
    }
  }
  if trace_id != TraceId::INVALID && span_id != SpanId::INVALID {
    log_record.set_trace_context(
      trace_id,
      span_id,
      Some(TraceFlags::new(trace_flags)),
    );
  }

  log_processor.emit(&mut log_record, builtin_instrumentation_scope);
}

fn owned_string<'s>(
  scope: &mut v8::HandleScope<'s>,
  string: v8::Local<'s, v8::String>,
) -> String {
  let x = v8::ValueView::new(scope, string);
  match x.data() {
    v8::ValueViewData::OneByte(bytes) => {
      String::from_utf8_lossy(bytes).into_owned()
    }
    v8::ValueViewData::TwoByte(bytes) => String::from_utf16_lossy(bytes),
  }
}

struct OtelTracer(InstrumentationScope);

impl deno_core::GarbageCollected for OtelTracer {}

#[op2]
impl OtelTracer {
  #[constructor]
  #[cppgc]
  fn new(
    #[string] name: String,
    #[string] version: Option<String>,
    #[string] schema_url: Option<String>,
  ) -> OtelTracer {
    let mut builder = opentelemetry::InstrumentationScope::builder(name);
    if let Some(version) = version {
      builder = builder.with_version(version);
    }
    if let Some(schema_url) = schema_url {
      builder = builder.with_schema_url(schema_url);
    }
    let scope = builder.build();
    OtelTracer(scope)
  }

  #[static_method]
  #[cppgc]
  fn builtin() -> OtelTracer {
    let OtelGlobals {
      builtin_instrumentation_scope,
      ..
    } = OTEL_GLOBALS.get().unwrap();
    OtelTracer(builtin_instrumentation_scope.clone())
  }

  #[cppgc]
  fn start_span<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    #[cppgc] parent: Option<&OtelSpan>,
    name: v8::Local<'s, v8::Value>,
    #[smi] span_kind: u8,
    start_time: Option<f64>,
    #[smi] attribute_count: usize,
  ) -> Result<OtelSpan, anyhow::Error> {
    let OtelGlobals { id_generator, .. } = OTEL_GLOBALS.get().unwrap();
    let span_context;
    let parent_span_id;
    match parent {
      Some(parent) => {
        let parent = parent.0.borrow();
        let parent_span_context = match &**parent {
          OtelSpanState::Recording(span) => &span.span_context,
          OtelSpanState::Done(span_context) => span_context,
        };
        span_context = SpanContext::new(
          parent_span_context.trace_id(),
          id_generator.new_span_id(),
          TraceFlags::SAMPLED,
          false,
          parent_span_context.trace_state().clone(),
        );
        parent_span_id = parent_span_context.span_id();
      }
      None => {
        span_context = SpanContext::new(
          id_generator.new_trace_id(),
          id_generator.new_span_id(),
          TraceFlags::SAMPLED,
          false,
          TraceState::NONE,
        );
        parent_span_id = SpanId::INVALID;
      }
    }
    let name = owned_string(
      scope,
      name
        .try_cast()
        .map_err(|e: DataError| anyhow!(e.to_string()))?,
    );
    let span_kind = match span_kind {
      0 => SpanKind::Internal,
      1 => SpanKind::Server,
      2 => SpanKind::Client,
      3 => SpanKind::Producer,
      4 => SpanKind::Consumer,
      _ => return Err(anyhow!("invalid span kind")),
    };
    let start_time = start_time
      .map(|start_time| {
        SystemTime::UNIX_EPOCH
          .checked_add(std::time::Duration::from_secs_f64(start_time / 1000.0))
          .ok_or_else(|| anyhow!("invalid start time"))
      })
      .unwrap_or_else(|| Ok(SystemTime::now()))?;
    let span_data = SpanData {
      span_context,
      parent_span_id,
      span_kind,
      name: Cow::Owned(name),
      start_time,
      end_time: SystemTime::UNIX_EPOCH,
      attributes: Vec::with_capacity(attribute_count),
      dropped_attributes_count: 0,
      status: SpanStatus::Unset,
      events: SpanEvents::default(),
      links: SpanLinks::default(),
      instrumentation_scope: self.0.clone(),
    };
    Ok(OtelSpan(RefCell::new(Box::new(OtelSpanState::Recording(
      span_data,
    )))))
  }

  #[cppgc]
  fn start_span_foreign<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    parent_trace_id: v8::Local<'s, v8::Value>,
    parent_span_id: v8::Local<'s, v8::Value>,
    name: v8::Local<'s, v8::Value>,
    #[smi] span_kind: u8,
    start_time: Option<f64>,
    #[smi] attribute_count: usize,
  ) -> Result<OtelSpan, anyhow::Error> {
    let parent_trace_id = parse_trace_id(scope, parent_trace_id);
    if parent_trace_id == TraceId::INVALID {
      return Err(anyhow!("invalid trace id"));
    };
    let parent_span_id = parse_span_id(scope, parent_span_id);
    if parent_span_id == SpanId::INVALID {
      return Err(anyhow!("invalid span id"));
    };
    let OtelGlobals { id_generator, .. } = OTEL_GLOBALS.get().unwrap();
    let span_context = SpanContext::new(
      parent_trace_id,
      id_generator.new_span_id(),
      TraceFlags::SAMPLED,
      false,
      TraceState::NONE,
    );
    let name = owned_string(
      scope,
      name
        .try_cast()
        .map_err(|e: DataError| anyhow!(e.to_string()))?,
    );
    let span_kind = match span_kind {
      0 => SpanKind::Internal,
      1 => SpanKind::Server,
      2 => SpanKind::Client,
      3 => SpanKind::Producer,
      4 => SpanKind::Consumer,
      _ => return Err(anyhow!("invalid span kind")),
    };
    let start_time = start_time
      .map(|start_time| {
        SystemTime::UNIX_EPOCH
          .checked_add(std::time::Duration::from_secs_f64(start_time / 1000.0))
          .ok_or_else(|| anyhow!("invalid start time"))
      })
      .unwrap_or_else(|| Ok(SystemTime::now()))?;
    let span_data = SpanData {
      span_context,
      parent_span_id,
      span_kind,
      name: Cow::Owned(name),
      start_time,
      end_time: SystemTime::UNIX_EPOCH,
      attributes: Vec::with_capacity(attribute_count),
      dropped_attributes_count: 0,
      status: SpanStatus::Unset,
      events: SpanEvents::default(),
      links: SpanLinks::default(),
      instrumentation_scope: self.0.clone(),
    };
    Ok(OtelSpan(RefCell::new(Box::new(OtelSpanState::Recording(
      span_data,
    )))))
  }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct JsSpanContext {
  trace_id: Box<str>,
  span_id: Box<str>,
  trace_flags: u8,
}

// boxed because of https://github.com/denoland/rusty_v8/issues/1676
#[derive(Debug)]
struct OtelSpan(RefCell<Box<OtelSpanState>>);

#[derive(Debug)]
#[allow(clippy::large_enum_variant)]
enum OtelSpanState {
  Recording(SpanData),
  Done(SpanContext),
}

impl deno_core::GarbageCollected for OtelSpan {}

#[op2]
impl OtelSpan {
  #[constructor]
  #[cppgc]
  fn new() -> Result<OtelSpan, anyhow::Error> {
    bail!("OtelSpan cannot be constructed.")
  }

  #[serde]
  fn span_context(&self) -> JsSpanContext {
    let state = self.0.borrow();
    let span_context = match &**state {
      OtelSpanState::Recording(span) => &span.span_context,
      OtelSpanState::Done(span_context) => span_context,
    };
    JsSpanContext {
      trace_id: format!("{:?}", span_context.trace_id()).into(),
      span_id: format!("{:?}", span_context.span_id()).into(),
      trace_flags: span_context.trace_flags().to_u8(),
    }
  }

  #[fast]
  fn set_status<'s>(
    &self,
    #[smi] status: u8,
    #[string] error_description: String,
  ) -> Result<(), anyhow::Error> {
    let mut state = self.0.borrow_mut();
    let OtelSpanState::Recording(span) = &mut **state else {
      return Ok(());
    };
    span.status = match status {
      0 => SpanStatus::Unset,
      1 => SpanStatus::Ok,
      2 => SpanStatus::Error {
        description: Cow::Owned(error_description),
      },
      _ => bail!("invalid span status code"),
    };
    Ok(())
  }

  #[fast]
  fn drop_event(&self) {
    let mut state = self.0.borrow_mut();
    match &mut **state {
      OtelSpanState::Recording(span) => {
        span.events.dropped_count += 1;
      }
      OtelSpanState::Done(_) => {}
    }
  }

  #[fast]
  fn end(&self, state: &mut OpState, end_time: f64) {
    let end_time = if end_time.is_nan() {
      SystemTime::now()
    } else {
      SystemTime::UNIX_EPOCH
        .checked_add(Duration::from_secs_f64(end_time / 1000.0))
        .unwrap()
    };
    let runtime_attributes =
      state.try_borrow::<RuntimeOtelExtraAttributes>().clone();

    let mut state = self.0.borrow_mut();
    if let OtelSpanState::Recording(span) = &mut **state {
      let span_context = span.span_context.clone();
      if let OtelSpanState::Recording(mut span) = *std::mem::replace(
        &mut *state,
        Box::new(OtelSpanState::Done(span_context)),
      ) {
        span.end_time = end_time;
        if let Some(attributes) = runtime_attributes {
          for (k, v) in attributes.0.clone() {
            span.attributes.push(KeyValue::new(k, v));
          }
        }
        let Some(OtelGlobals { span_processor, .. }) = OTEL_GLOBALS.get()
        else {
          return;
        };
        span_processor.on_end(span);
      }
    }
  }
}

#[op2(fast)]
fn op_otel_span_attribute1<'s>(
  scope: &mut v8::HandleScope<'s>,
  span: v8::Local<'_, v8::Value>,
  key: v8::Local<'s, v8::Value>,
  value: v8::Local<'s, v8::Value>,
) {
  let Some(span) =
    deno_core::_ops::try_unwrap_cppgc_object::<OtelSpan>(scope, span)
  else {
    return;
  };
  let mut state = span.0.borrow_mut();
  if let OtelSpanState::Recording(span) = &mut **state {
    attr!(scope, span.attributes => span.dropped_attributes_count, key, value);
  }
}

#[op2(fast)]
fn op_otel_span_attribute2<'s>(
  scope: &mut v8::HandleScope<'s>,
  span: v8::Local<'_, v8::Value>,
  key1: v8::Local<'s, v8::Value>,
  value1: v8::Local<'s, v8::Value>,
  key2: v8::Local<'s, v8::Value>,
  value2: v8::Local<'s, v8::Value>,
) {
  let Some(span) =
    deno_core::_ops::try_unwrap_cppgc_object::<OtelSpan>(scope, span)
  else {
    return;
  };
  let mut state = span.0.borrow_mut();
  if let OtelSpanState::Recording(span) = &mut **state {
    attr!(scope, span.attributes => span.dropped_attributes_count, key1, value1);
    attr!(scope, span.attributes => span.dropped_attributes_count, key2, value2);
  }
}

#[allow(clippy::too_many_arguments)]
#[op2(fast)]
fn op_otel_span_attribute3<'s>(
  scope: &mut v8::HandleScope<'s>,
  span: v8::Local<'_, v8::Value>,
  key1: v8::Local<'s, v8::Value>,
  value1: v8::Local<'s, v8::Value>,
  key2: v8::Local<'s, v8::Value>,
  value2: v8::Local<'s, v8::Value>,
  key3: v8::Local<'s, v8::Value>,
  value3: v8::Local<'s, v8::Value>,
) {
  let Some(span) =
    deno_core::_ops::try_unwrap_cppgc_object::<OtelSpan>(scope, span)
  else {
    return;
  };
  let mut state = span.0.borrow_mut();
  if let OtelSpanState::Recording(span) = &mut **state {
    attr!(scope, span.attributes => span.dropped_attributes_count, key1, value1);
    attr!(scope, span.attributes => span.dropped_attributes_count, key2, value2);
    attr!(scope, span.attributes => span.dropped_attributes_count, key3, value3);
  }
}

#[op2(fast)]
fn op_otel_span_update_name<'s>(
  scope: &mut v8::HandleScope<'s>,
  span: v8::Local<'s, v8::Value>,
  name: v8::Local<'s, v8::Value>,
) {
  let Ok(name) = name.try_cast() else {
    return;
  };
  let name = owned_string(scope, name);
  let Some(span) =
    deno_core::_ops::try_unwrap_cppgc_object::<OtelSpan>(scope, span)
  else {
    return;
  };
  let mut state = span.0.borrow_mut();
  if let OtelSpanState::Recording(span) = &mut **state {
    span.name = Cow::Owned(name)
  }
}

#[op2(fast)]
fn op_otel_span_add_link<'s>(
  scope: &mut v8::HandleScope<'s>,
  span: v8::Local<'s, v8::Value>,
  trace_id: v8::Local<'s, v8::Value>,
  span_id: v8::Local<'s, v8::Value>,
  #[smi] trace_flags: u8,
  is_remote: bool,
  #[smi] dropped_attributes_count: u32,
) -> bool {
  let trace_id = parse_trace_id(scope, trace_id);
  if trace_id == TraceId::INVALID {
    return false;
  };
  let span_id = parse_span_id(scope, span_id);
  if span_id == SpanId::INVALID {
    return false;
  };
  let span_context = SpanContext::new(
    trace_id,
    span_id,
    TraceFlags::new(trace_flags),
    is_remote,
    TraceState::NONE,
  );

  let Some(span) =
    deno_core::_ops::try_unwrap_cppgc_object::<OtelSpan>(scope, span)
  else {
    return true;
  };
  let mut state = span.0.borrow_mut();
  if let OtelSpanState::Recording(span) = &mut **state {
    span.links.links.push(Link::new(
      span_context,
      vec![],
      dropped_attributes_count,
    ));
  }
  true
}

struct OtelMeter(opentelemetry::metrics::Meter);

impl deno_core::GarbageCollected for OtelMeter {}

#[op2]
impl OtelMeter {
  #[constructor]
  #[cppgc]
  fn new(
    #[string] name: String,
    #[string] version: Option<String>,
    #[string] schema_url: Option<String>,
  ) -> OtelMeter {
    let mut builder = opentelemetry::InstrumentationScope::builder(name);
    if let Some(version) = version {
      builder = builder.with_version(version);
    }
    if let Some(schema_url) = schema_url {
      builder = builder.with_schema_url(schema_url);
    }
    let scope = builder.build();
    let meter = OTEL_GLOBALS
      .get()
      .unwrap()
      .meter_provider
      .meter_with_scope(scope);
    OtelMeter(meter)
  }

  #[cppgc]
  fn create_counter<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    name: v8::Local<'s, v8::Value>,
    description: v8::Local<'s, v8::Value>,
    unit: v8::Local<'s, v8::Value>,
  ) -> Result<Instrument, anyhow::Error> {
    create_instrument(
      |name| self.0.f64_counter(name),
      |i| Instrument::Counter(i.build()),
      scope,
      name,
      description,
      unit,
    )
    .map_err(|e| anyhow!(e.to_string()))
  }

  #[cppgc]
  fn create_up_down_counter<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    name: v8::Local<'s, v8::Value>,
    description: v8::Local<'s, v8::Value>,
    unit: v8::Local<'s, v8::Value>,
  ) -> Result<Instrument, anyhow::Error> {
    create_instrument(
      |name| self.0.f64_up_down_counter(name),
      |i| Instrument::UpDownCounter(i.build()),
      scope,
      name,
      description,
      unit,
    )
    .map_err(|e| anyhow!(e.to_string()))
  }

  #[cppgc]
  fn create_gauge<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    name: v8::Local<'s, v8::Value>,
    description: v8::Local<'s, v8::Value>,
    unit: v8::Local<'s, v8::Value>,
  ) -> Result<Instrument, anyhow::Error> {
    create_instrument(
      |name| self.0.f64_gauge(name),
      |i| Instrument::Gauge(i.build()),
      scope,
      name,
      description,
      unit,
    )
    .map_err(|e| anyhow!(e.to_string()))
  }

  #[cppgc]
  fn create_histogram<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    name: v8::Local<'s, v8::Value>,
    description: v8::Local<'s, v8::Value>,
    unit: v8::Local<'s, v8::Value>,
    #[serde] boundaries: Option<Vec<f64>>,
  ) -> Result<Instrument, anyhow::Error> {
    let name = owned_string(
      scope,
      name
        .try_cast()
        .map_err(|e: DataError| anyhow!(e.to_string()))?,
    );
    let mut builder = self.0.f64_histogram(name);
    if !description.is_null_or_undefined() {
      let description = owned_string(
        scope,
        description
          .try_cast()
          .map_err(|e: DataError| anyhow!(e.to_string()))?,
      );
      builder = builder.with_description(description);
    };
    if !unit.is_null_or_undefined() {
      let unit = owned_string(
        scope,
        unit
          .try_cast()
          .map_err(|e: DataError| anyhow!(e.to_string()))?,
      );
      builder = builder.with_unit(unit);
    };
    if let Some(boundaries) = boundaries {
      builder = builder.with_boundaries(boundaries);
    }

    Ok(Instrument::Histogram(builder.build()))
  }

  #[cppgc]
  fn create_observable_counter<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    name: v8::Local<'s, v8::Value>,
    description: v8::Local<'s, v8::Value>,
    unit: v8::Local<'s, v8::Value>,
  ) -> Result<Instrument, anyhow::Error> {
    create_async_instrument(
      |name| self.0.f64_observable_counter(name),
      |i| {
        i.build();
      },
      scope,
      name,
      description,
      unit,
    )
    .map_err(|e| anyhow!(e.to_string()))
  }

  #[cppgc]
  fn create_observable_up_down_counter<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    name: v8::Local<'s, v8::Value>,
    description: v8::Local<'s, v8::Value>,
    unit: v8::Local<'s, v8::Value>,
  ) -> Result<Instrument, anyhow::Error> {
    create_async_instrument(
      |name| self.0.f64_observable_up_down_counter(name),
      |i| {
        i.build();
      },
      scope,
      name,
      description,
      unit,
    )
    .map_err(|e| anyhow!(e.to_string()))
  }

  #[cppgc]
  fn create_observable_gauge<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    name: v8::Local<'s, v8::Value>,
    description: v8::Local<'s, v8::Value>,
    unit: v8::Local<'s, v8::Value>,
  ) -> Result<Instrument, anyhow::Error> {
    create_async_instrument(
      |name| self.0.f64_observable_gauge(name),
      |i| {
        i.build();
      },
      scope,
      name,
      description,
      unit,
    )
    .map_err(|e| anyhow!(e.to_string()))
  }
}

enum Instrument {
  Counter(opentelemetry::metrics::Counter<f64>),
  UpDownCounter(UpDownCounter<f64>),
  Gauge(opentelemetry::metrics::Gauge<f64>),
  Histogram(Histogram<f64>),
  Observable(Arc<Mutex<HashMap<Vec<KeyValue>, f64>>>),
}

impl GarbageCollected for Instrument {}

fn create_instrument<'a, 'b, T>(
  cb: impl FnOnce(String) -> InstrumentBuilder<'b, T>,
  cb2: impl FnOnce(InstrumentBuilder<'b, T>) -> Instrument,
  scope: &mut v8::HandleScope<'a>,
  name: v8::Local<'a, v8::Value>,
  description: v8::Local<'a, v8::Value>,
  unit: v8::Local<'a, v8::Value>,
) -> Result<Instrument, v8::DataError> {
  let name = owned_string(scope, name.try_cast()?);
  let mut builder = cb(name);
  if !description.is_null_or_undefined() {
    let description = owned_string(scope, description.try_cast()?);
    builder = builder.with_description(description);
  };
  if !unit.is_null_or_undefined() {
    let unit = owned_string(scope, unit.try_cast()?);
    builder = builder.with_unit(unit);
  };

  Ok(cb2(builder))
}

fn create_async_instrument<'a, 'b, T>(
  cb: impl FnOnce(String) -> AsyncInstrumentBuilder<'b, T, f64>,
  cb2: impl FnOnce(AsyncInstrumentBuilder<'b, T, f64>),
  scope: &mut v8::HandleScope<'a>,
  name: v8::Local<'a, v8::Value>,
  description: v8::Local<'a, v8::Value>,
  unit: v8::Local<'a, v8::Value>,
) -> Result<Instrument, DataError> {
  let name = owned_string(scope, name.try_cast()?);
  let mut builder = cb(name);
  if !description.is_null_or_undefined() {
    let description = owned_string(scope, description.try_cast()?);
    builder = builder.with_description(description);
  };
  if !unit.is_null_or_undefined() {
    let unit = owned_string(scope, unit.try_cast()?);
    builder = builder.with_unit(unit);
  };

  let data_share = Arc::new(Mutex::new(HashMap::new()));
  let data_share_: Arc<Mutex<HashMap<Vec<KeyValue>, f64>>> = data_share.clone();
  builder = builder.with_callback(move |i| {
    let data = {
      let mut data = data_share_.lock().unwrap();
      std::mem::take(&mut *data)
    };
    for (attributes, value) in data {
      i.observe(value, &attributes);
    }
  });
  cb2(builder);

  Ok(Instrument::Observable(data_share))
}

struct MetricAttributes {
  attributes: Vec<KeyValue>,
}

#[op2(fast)]
fn op_otel_metric_record0(
  state: &mut OpState,
  #[cppgc] instrument: &Instrument,
  value: f64,
) {
  let values = state.try_take::<MetricAttributes>();
  let attributes = match &values {
    Some(values) => &*values.attributes,
    None => &[],
  };
  match instrument {
    Instrument::Counter(counter) => counter.add(value, attributes),
    Instrument::UpDownCounter(counter) => counter.add(value, attributes),
    Instrument::Gauge(gauge) => gauge.record(value, attributes),
    Instrument::Histogram(histogram) => histogram.record(value, attributes),
    _ => {}
  }
}

#[op2(fast)]
fn op_otel_metric_record1(
  state: &mut OpState,
  scope: &mut v8::HandleScope<'_>,
  instrument: v8::Local<'_, v8::Value>,
  value: f64,
  key1: v8::Local<'_, v8::Value>,
  value1: v8::Local<'_, v8::Value>,
) {
  let Some(instrument) = deno_core::_ops::try_unwrap_cppgc_object::<Instrument>(
    &mut *scope,
    instrument,
  ) else {
    return;
  };
  let mut values = state.try_take::<MetricAttributes>();
  let attr1 = attr_raw!(scope, key1, value1);
  let attributes = match &mut values {
    Some(values) => {
      if let Some(kv) = attr1 {
        values.attributes.reserve_exact(1);
        values.attributes.push(kv);
      }
      &*values.attributes
    }
    None => match attr1 {
      Some(kv1) => &[kv1] as &[KeyValue],
      None => &[],
    },
  };
  match &*instrument {
    Instrument::Counter(counter) => counter.add(value, attributes),
    Instrument::UpDownCounter(counter) => counter.add(value, attributes),
    Instrument::Gauge(gauge) => gauge.record(value, attributes),
    Instrument::Histogram(histogram) => histogram.record(value, attributes),
    _ => {}
  }
}

#[allow(clippy::too_many_arguments)]
#[op2(fast)]
fn op_otel_metric_record2(
  state: &mut OpState,
  scope: &mut v8::HandleScope<'_>,
  instrument: v8::Local<'_, v8::Value>,
  value: f64,
  key1: v8::Local<'_, v8::Value>,
  value1: v8::Local<'_, v8::Value>,
  key2: v8::Local<'_, v8::Value>,
  value2: v8::Local<'_, v8::Value>,
) {
  let Some(instrument) = deno_core::_ops::try_unwrap_cppgc_object::<Instrument>(
    &mut *scope,
    instrument,
  ) else {
    return;
  };
  let mut values = state.try_take::<MetricAttributes>();
  let attr1 = attr_raw!(scope, key1, value1);
  let attr2 = attr_raw!(scope, key2, value2);
  let attributes = match &mut values {
    Some(values) => {
      values.attributes.reserve_exact(2);
      if let Some(kv1) = attr1 {
        values.attributes.push(kv1);
      }
      if let Some(kv2) = attr2 {
        values.attributes.push(kv2);
      }
      &*values.attributes
    }
    None => match (attr1, attr2) {
      (Some(kv1), Some(kv2)) => &[kv1, kv2] as &[KeyValue],
      (Some(kv1), None) => &[kv1],
      (None, Some(kv2)) => &[kv2],
      (None, None) => &[],
    },
  };
  match &*instrument {
    Instrument::Counter(counter) => counter.add(value, attributes),
    Instrument::UpDownCounter(counter) => counter.add(value, attributes),
    Instrument::Gauge(gauge) => gauge.record(value, attributes),
    Instrument::Histogram(histogram) => histogram.record(value, attributes),
    _ => {}
  }
}

#[allow(clippy::too_many_arguments)]
#[op2(fast)]
fn op_otel_metric_record3(
  state: &mut OpState,
  scope: &mut v8::HandleScope<'_>,
  instrument: v8::Local<'_, v8::Value>,
  value: f64,
  key1: v8::Local<'_, v8::Value>,
  value1: v8::Local<'_, v8::Value>,
  key2: v8::Local<'_, v8::Value>,
  value2: v8::Local<'_, v8::Value>,
  key3: v8::Local<'_, v8::Value>,
  value3: v8::Local<'_, v8::Value>,
) {
  let Some(instrument) = deno_core::_ops::try_unwrap_cppgc_object::<Instrument>(
    &mut *scope,
    instrument,
  ) else {
    return;
  };
  let mut values = state.try_take::<MetricAttributes>();
  let attr1 = attr_raw!(scope, key1, value1);
  let attr2 = attr_raw!(scope, key2, value2);
  let attr3 = attr_raw!(scope, key3, value3);
  let attributes = match &mut values {
    Some(values) => {
      values.attributes.reserve_exact(3);
      if let Some(kv1) = attr1 {
        values.attributes.push(kv1);
      }
      if let Some(kv2) = attr2 {
        values.attributes.push(kv2);
      }
      if let Some(kv3) = attr3 {
        values.attributes.push(kv3);
      }
      &*values.attributes
    }
    None => match (attr1, attr2, attr3) {
      (Some(kv1), Some(kv2), Some(kv3)) => &[kv1, kv2, kv3] as &[KeyValue],
      (Some(kv1), Some(kv2), None) => &[kv1, kv2],
      (Some(kv1), None, Some(kv3)) => &[kv1, kv3],
      (None, Some(kv2), Some(kv3)) => &[kv2, kv3],
      (Some(kv1), None, None) => &[kv1],
      (None, Some(kv2), None) => &[kv2],
      (None, None, Some(kv3)) => &[kv3],
      (None, None, None) => &[],
    },
  };
  match &*instrument {
    Instrument::Counter(counter) => counter.add(value, attributes),
    Instrument::UpDownCounter(counter) => counter.add(value, attributes),
    Instrument::Gauge(gauge) => gauge.record(value, attributes),
    Instrument::Histogram(histogram) => histogram.record(value, attributes),
    _ => {}
  }
}

#[op2(fast)]
fn op_otel_metric_observable_record0(
  state: &mut OpState,
  #[cppgc] instrument: &Instrument,
  value: f64,
) {
  let values = state.try_take::<MetricAttributes>();
  let attributes = values.map(|attr| attr.attributes).unwrap_or_default();
  if let Instrument::Observable(data_share) = instrument {
    let mut data = data_share.lock().unwrap();
    data.insert(attributes, value);
  }
}

#[op2(fast)]
fn op_otel_metric_observable_record1(
  state: &mut OpState,
  scope: &mut v8::HandleScope<'_>,
  instrument: v8::Local<'_, v8::Value>,
  value: f64,
  key1: v8::Local<'_, v8::Value>,
  value1: v8::Local<'_, v8::Value>,
) {
  let Some(instrument) = deno_core::_ops::try_unwrap_cppgc_object::<Instrument>(
    &mut *scope,
    instrument,
  ) else {
    return;
  };
  let values = state.try_take::<MetricAttributes>();
  let attr1 = attr_raw!(scope, key1, value1);
  let mut attributes = values
    .map(|mut attr| {
      attr.attributes.reserve_exact(1);
      attr.attributes
    })
    .unwrap_or_else(|| Vec::with_capacity(1));
  if let Some(kv1) = attr1 {
    attributes.push(kv1);
  }
  if let Instrument::Observable(data_share) = &*instrument {
    let mut data = data_share.lock().unwrap();
    data.insert(attributes, value);
  }
}

#[allow(clippy::too_many_arguments)]
#[op2(fast)]
fn op_otel_metric_observable_record2(
  state: &mut OpState,
  scope: &mut v8::HandleScope<'_>,
  instrument: v8::Local<'_, v8::Value>,
  value: f64,
  key1: v8::Local<'_, v8::Value>,
  value1: v8::Local<'_, v8::Value>,
  key2: v8::Local<'_, v8::Value>,
  value2: v8::Local<'_, v8::Value>,
) {
  let Some(instrument) = deno_core::_ops::try_unwrap_cppgc_object::<Instrument>(
    &mut *scope,
    instrument,
  ) else {
    return;
  };
  let values = state.try_take::<MetricAttributes>();
  let mut attributes = values
    .map(|mut attr| {
      attr.attributes.reserve_exact(2);
      attr.attributes
    })
    .unwrap_or_else(|| Vec::with_capacity(2));
  let attr1 = attr_raw!(scope, key1, value1);
  let attr2 = attr_raw!(scope, key2, value2);
  if let Some(kv1) = attr1 {
    attributes.push(kv1);
  }
  if let Some(kv2) = attr2 {
    attributes.push(kv2);
  }
  if let Instrument::Observable(data_share) = &*instrument {
    let mut data = data_share.lock().unwrap();
    data.insert(attributes, value);
  }
}

#[allow(clippy::too_many_arguments)]
#[op2(fast)]
fn op_otel_metric_observable_record3(
  state: &mut OpState,
  scope: &mut v8::HandleScope<'_>,
  instrument: v8::Local<'_, v8::Value>,
  value: f64,
  key1: v8::Local<'_, v8::Value>,
  value1: v8::Local<'_, v8::Value>,
  key2: v8::Local<'_, v8::Value>,
  value2: v8::Local<'_, v8::Value>,
  key3: v8::Local<'_, v8::Value>,
  value3: v8::Local<'_, v8::Value>,
) {
  let Some(instrument) = deno_core::_ops::try_unwrap_cppgc_object::<Instrument>(
    &mut *scope,
    instrument,
  ) else {
    return;
  };
  let values = state.try_take::<MetricAttributes>();
  let mut attributes = values
    .map(|mut attr| {
      attr.attributes.reserve_exact(3);
      attr.attributes
    })
    .unwrap_or_else(|| Vec::with_capacity(3));
  let attr1 = attr_raw!(scope, key1, value1);
  let attr2 = attr_raw!(scope, key2, value2);
  let attr3 = attr_raw!(scope, key3, value3);
  if let Some(kv1) = attr1 {
    attributes.push(kv1);
  }
  if let Some(kv2) = attr2 {
    attributes.push(kv2);
  }
  if let Some(kv3) = attr3 {
    attributes.push(kv3);
  }
  if let Instrument::Observable(data_share) = &*instrument {
    let mut data = data_share.lock().unwrap();
    data.insert(attributes, value);
  }
}

#[allow(clippy::too_many_arguments)]
#[op2(fast)]
fn op_otel_metric_attribute3<'s>(
  scope: &mut v8::HandleScope<'s>,
  state: &mut OpState,
  #[smi] capacity: u32,
  key1: v8::Local<'s, v8::Value>,
  value1: v8::Local<'s, v8::Value>,
  key2: v8::Local<'s, v8::Value>,
  value2: v8::Local<'s, v8::Value>,
  key3: v8::Local<'s, v8::Value>,
  value3: v8::Local<'s, v8::Value>,
) {
  let mut values = state.try_borrow_mut::<MetricAttributes>();
  let attr1 = attr_raw!(scope, key1, value1);
  let attr2 = attr_raw!(scope, key2, value2);
  let attr3 = attr_raw!(scope, key3, value3);
  if let Some(values) = &mut values {
    values.attributes.reserve_exact(
      (capacity as usize).saturating_sub(values.attributes.capacity()),
    );
    if let Some(kv1) = attr1 {
      values.attributes.push(kv1);
    }
    if let Some(kv2) = attr2 {
      values.attributes.push(kv2);
    }
    if let Some(kv3) = attr3 {
      values.attributes.push(kv3);
    }
  } else {
    let mut attributes = Vec::with_capacity(capacity as usize);
    if let Some(kv1) = attr1 {
      attributes.push(kv1);
    }
    if let Some(kv2) = attr2 {
      attributes.push(kv2);
    }
    if let Some(kv3) = attr3 {
      attributes.push(kv3);
    }
    state.put(MetricAttributes { attributes });
  }
}

struct ObservationDone(oneshot::Sender<()>);

#[op2(async)]
async fn op_otel_metric_wait_to_observe(state: Rc<RefCell<OpState>>) -> bool {
  let (tx, rx) = oneshot::channel();
  {
    OTEL_PRE_COLLECT_CALLBACKS
      .lock()
      .expect("mutex poisoned")
      .push(tx);
  }
  if let Ok(done) = rx.await {
    state.borrow_mut().put(ObservationDone(done));
    true
  } else {
    false
  }
}

#[op2(fast)]
fn op_otel_metric_observation_done(state: &mut OpState) {
  if let Some(ObservationDone(done)) = state.try_take::<ObservationDone>() {
    let _ = done.send(());
  }
}
