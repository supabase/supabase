use std::sync::OnceLock;
use std::time::SystemTime;

use ext_event_worker::events::EventMetadata;
use opentelemetry::global;
use opentelemetry::trace::Span as _;
use opentelemetry::trace::SpanKind;
use opentelemetry::trace::TraceContextExt;
use opentelemetry::trace::Tracer;
use opentelemetry::trace::TracerProvider as _;
use opentelemetry::Context;
use opentelemetry::KeyValue;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::trace::BatchSpanProcessor;
use opentelemetry_sdk::trace::TracerProvider;

static PROVIDER: OnceLock<Option<TracerProvider>> = OnceLock::new();

pub fn init_if_needed() {
  PROVIDER.get_or_init(|| {
    if std::env::var("OTEL_EXPORTER_OTLP_ENDPOINT").is_err() {
      return None;
    }

    let exporter = opentelemetry_otlp::SpanExporter::builder()
      .with_http()
      .with_export_config(opentelemetry_otlp::ExportConfig::default())
      .build()
      .expect("failed to build OTLP span exporter");

    let processor =
      BatchSpanProcessor::builder(exporter, opentelemetry_sdk::runtime::Tokio)
        .build();

    let provider = TracerProvider::builder()
      .with_span_processor(processor)
      .build();

    global::set_tracer_provider(provider.clone());
    Some(provider)
  });
}

/// Worker identity and custom otel attributes collected once at `run()` entry.
#[derive(Clone)]
pub struct WorkerSpanAttrs(Vec<KeyValue>);

impl WorkerSpanAttrs {
  pub fn from_event_metadata(meta: &EventMetadata) -> Self {
    let mut attrs = Vec::new();

    if let Some(sp) = &meta.service_path {
      attrs.push(KeyValue::new("worker.service_path", sp.clone()));
    }
    if let Some(id) = meta.execution_id {
      attrs.push(KeyValue::new("worker.key", id.to_string()));
    }
    if let Some(extra) = &meta.otel_attributes {
      for (k, v) in extra {
        attrs.push(KeyValue::new(k.clone(), v.clone()));
      }
    }

    Self(attrs)
  }
}

/// Start a named span with worker attributes.
/// Returns `None` if OTLP is not configured or `attrs` is `None`.
pub fn start_span(
  name: &'static str,
  attrs: Option<&WorkerSpanAttrs>,
) -> Option<OtelSpanGuard> {
  let attrs = attrs?;
  let provider = PROVIDER.get()?.as_ref()?;
  let tracer = provider.tracer("edge-runtime");
  let mut span = tracer
    .span_builder(name)
    .with_kind(SpanKind::Internal)
    .with_start_time(SystemTime::now())
    .start(&tracer);

  for kv in &attrs.0 {
    span.set_attribute(kv.clone());
  }

  let cx = Context::current_with_span(span);
  Some(OtelSpanGuard { _cx: cx })
}

/// Ends the span on drop.
pub struct OtelSpanGuard {
  _cx: Context,
}

impl Drop for OtelSpanGuard {
  fn drop(&mut self) {
    self._cx.span().end();
  }
}
