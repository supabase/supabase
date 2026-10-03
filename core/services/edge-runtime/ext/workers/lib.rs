use crate::context::CreateUserWorkerResult;
use crate::context::UserWorkerMsgs;
use crate::context::UserWorkerRuntimeOpts;
use crate::context::WorkerContextInitOpts;
use crate::context::WorkerRuntimeOpts;

use anyhow::Error;
use base_mem_check::WorkerHeapStatisticsWithServicePath;
use context::SendRequestResult;
use deno::deno_http::HttpRequestReader;
use deno::deno_http::HttpStreamReadResource;
use deno::deno_permissions::PermissionsOptions;
use deno_core::error::custom_error;
use deno_core::error::type_error;
use deno_core::error::AnyError;
use deno_core::futures::stream::Peekable;
use deno_core::futures::FutureExt;
use deno_core::futures::Stream;
use deno_core::futures::StreamExt;
use deno_core::op2;
use deno_core::serde_json;
use deno_core::AsyncRefCell;
use deno_core::AsyncResult;
use deno_core::BufView;
use deno_core::ByteString;
use deno_core::CancelFuture;
use deno_core::CancelHandle;
use deno_core::CancelTryFuture;
use deno_core::JsBuffer;
use deno_core::OpState;
use deno_core::RcRef;
use deno_core::Resource;
use deno_core::ResourceId;
use deno_core::WriteOutcome;
use deno_facade::EszipPayloadKind;
use deno_telemetry::OtelConfig;
use deno_telemetry::OtelConsoleConfig;
use deno_telemetry::OtelPropagators;
use errors::WorkerError;
use ext_runtime::conn_sync::ConnWatcher;
use ext_runtime::TraceRateLimitRule;
use fs::s3_fs::S3FsConfig;
use fs::tmp_fs::TmpFsConfig;
use http_utils::utils::get_upgrade_type;
use hyper_v014::body::HttpBody;
use hyper_v014::header::HeaderName;
use hyper_v014::header::HeaderValue;
use hyper_v014::header::CONTENT_LENGTH;
use hyper_v014::upgrade::OnUpgrade;
use hyper_v014::Body;
use hyper_v014::Method;
use hyper_v014::Request;
use log::error;
use once_cell::sync::Lazy;
use serde::Deserialize;
use serde::Serialize;
use std::cell::RefCell;
use std::collections::HashMap;
use std::collections::HashSet;
use std::path::PathBuf;
use std::pin::Pin;
use std::rc::Rc;
use std::task::Context;
use std::task::Poll;
use tokio::sync::mpsc;
use tokio::sync::oneshot;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

pub mod context;
pub mod errors;

deno_core::extension!(
  user_workers,
  ops = [
    op_user_worker_create,
    op_user_worker_fetch_build,
    op_user_worker_fetch_send,
    op_user_worker_cleanup_idle_workers,
    op_user_worker_mem_stats,
  ],
  esm_entry_point = "ext:user_workers/user_workers.js",
  esm = ["user_workers.js",]
);

#[derive(Deserialize, Serialize, Default, Debug)]
#[serde(rename_all = "camelCase")]
pub struct JsxImportBaseConfig {
  default_specifier: Option<String>,
  module: String,
  base_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsOtelConfig {
  #[serde(default)]
  tracing_enabled: bool,
  #[serde(default)]
  metrics_enabled: bool,
  #[serde(default)]
  console: OtelConsoleConfig,
  #[serde(default)]
  propagators: HashSet<OtelPropagators>,
}

pub type JsonMap = serde_json::Map<String, serde_json::Value>;

#[derive(Deserialize, Serialize, Default, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UserWorkerCreateOptions {
  pool_key: Option<String>,
  service_path: String,
  env_vars: Vec<(String, String)>,
  no_module_cache: bool,
  no_npm: Option<bool>,

  force_create: bool,
  allow_remote_modules: bool,
  custom_module_root: Option<String>,
  permissions: Option<JsPermissionsOptions>,

  maybe_eszip: Option<JsBuffer>,
  maybe_entrypoint: Option<String>,
  maybe_module_code: Option<String>,

  memory_limit_mb: Option<u64>,
  low_memory_multiplier: Option<u64>,
  worker_timeout_ms: Option<u64>,
  cpu_time_soft_limit_ms: Option<u64>,
  cpu_time_hard_limit_ms: Option<u64>,

  s3_fs_config: Option<S3FsConfig>,
  tmp_fs_config: Option<TmpFsConfig>,
  otel_config: Option<JsOtelConfig>,

  context: Option<JsonMap>,
  #[serde(default)]
  static_patterns: Vec<String>,
  trace_rate_limit_options: Option<JsTraceRateLimitOptions>,
}

#[derive(Deserialize, Serialize, Default, Debug)]
#[serde(rename_all = "camelCase")]
pub struct JsTraceRateLimitOptions {
  pub key: String,
  #[serde(default)]
  pub rules: Vec<TraceRateLimitRule>,
}

/// It is identical to [`PermissionsOptions`], except for `prompt`.
#[derive(Clone, Debug, Eq, PartialEq, Default, Serialize, Deserialize)]
pub struct JsPermissionsOptions {
  pub allow_all: Option<bool>,
  pub allow_env: Option<Vec<String>>,
  pub deny_env: Option<Vec<String>>,
  pub allow_net: Option<Vec<String>>,
  pub deny_net: Option<Vec<String>>,
  pub allow_ffi: Option<Vec<String>>,
  pub deny_ffi: Option<Vec<String>>,
  pub allow_read: Option<Vec<String>>,
  pub deny_read: Option<Vec<String>>,
  pub allow_run: Option<Vec<String>>,
  pub deny_run: Option<Vec<String>>,
  pub allow_sys: Option<Vec<String>>,
  pub deny_sys: Option<Vec<String>>,
  pub allow_write: Option<Vec<String>>,
  pub deny_write: Option<Vec<String>>,
  pub allow_import: Option<Vec<String>>,
}

impl JsPermissionsOptions {
  fn into_permissions_options(self) -> PermissionsOptions {
    PermissionsOptions {
      prompt: false,
      allow_all: self.allow_all.unwrap_or_default(),
      allow_env: self.allow_env,
      deny_env: self.deny_env,
      allow_net: self.allow_net,
      deny_net: self.deny_net,
      allow_ffi: self.allow_ffi,
      deny_ffi: self.deny_ffi,
      allow_read: self.allow_read,
      deny_read: self.deny_read,
      allow_run: self.allow_run,
      deny_run: self.deny_run,
      allow_sys: self.allow_sys,
      deny_sys: self.deny_sys,
      allow_write: self.allow_write,
      deny_write: self.deny_write,
      allow_import: self.allow_import,
    }
  }
}

#[op2(async)]
#[serde]
pub async fn op_user_worker_create(
  state: Rc<RefCell<OpState>>,
  #[serde] opts: UserWorkerCreateOptions,
) -> Result<(String, bool), AnyError> {
  let result_rx = {
    let op_state = state.borrow();
    let tx = op_state.borrow::<mpsc::UnboundedSender<UserWorkerMsgs>>();
    let (result_tx, result_rx) =
      oneshot::channel::<Result<CreateUserWorkerResult, Error>>();

    let UserWorkerCreateOptions {
      pool_key,
      service_path,
      env_vars,
      no_module_cache,
      no_npm,

      force_create,
      allow_remote_modules,
      custom_module_root,
      permissions,

      maybe_eszip,
      maybe_entrypoint,
      maybe_module_code,

      memory_limit_mb,
      low_memory_multiplier,
      worker_timeout_ms,
      cpu_time_soft_limit_ms,
      cpu_time_hard_limit_ms,

      s3_fs_config: maybe_s3_fs_config,
      tmp_fs_config: maybe_tmp_fs_config,
      otel_config: maybe_otel_config,

      context,
      static_patterns,
      trace_rate_limit_options,
    } = opts;

    let maybe_otel_config = maybe_otel_config.map(|it| OtelConfig {
      tracing_enabled: it.tracing_enabled,
      metrics_enabled: it.metrics_enabled,
      console: it.console,
      propagators: it.propagators,
      ..Default::default()
    });
    let user_worker_options = WorkerContextInitOpts {
      pool_key,
      service_path: PathBuf::from(service_path),
      no_module_cache,
      no_npm,

      env_vars: env_vars.into_iter().collect(),
      conf: WorkerRuntimeOpts::UserWorker({
        static DEFAULT: Lazy<UserWorkerRuntimeOpts> =
          Lazy::new(Default::default);

        UserWorkerRuntimeOpts {
          memory_limit_mb: memory_limit_mb.unwrap_or(DEFAULT.memory_limit_mb),
          low_memory_multiplier: low_memory_multiplier
            .unwrap_or(DEFAULT.low_memory_multiplier),

          worker_timeout_ms: worker_timeout_ms
            .unwrap_or(DEFAULT.worker_timeout_ms),
          cpu_time_soft_limit_ms: cpu_time_soft_limit_ms
            .unwrap_or(DEFAULT.cpu_time_soft_limit_ms),

          cpu_time_hard_limit_ms: cpu_time_hard_limit_ms
            .unwrap_or(DEFAULT.cpu_time_hard_limit_ms),

          force_create,
          allow_remote_modules,
          custom_module_root,
          permissions: permissions
            .map(JsPermissionsOptions::into_permissions_options),

          context,
          rate_limiter: match trace_rate_limit_options {
            None => ext_runtime::RateLimiterOpts::Disabled,
            Some(opts) if opts.rules.is_empty() => {
              ext_runtime::RateLimiterOpts::Disabled
            }
            Some(opts) => ext_runtime::RateLimiterOpts::Rules {
              rules: opts.rules,
              global_key: opts.key,
            },
          },

          ..Default::default()
        }
      }),

      static_patterns,
      timing: None,

      maybe_eszip: maybe_eszip.map(EszipPayloadKind::JsBufferKind),
      maybe_module_code: maybe_module_code.map(String::into),
      maybe_entrypoint,

      maybe_s3_fs_config,
      maybe_tmp_fs_config,
      maybe_otel_config,
    };

    tx.send(UserWorkerMsgs::Create(user_worker_options, result_tx))?;
    result_rx
  };

  match result_rx.await {
    Err(err) => Err(custom_error(
      "InvalidWorkerCreation",
      format!(
        "{:#}",
        AnyError::from(err).context("failed to create worker")
      ),
    )),

    Ok(Err(err)) => {
      Err(custom_error("InvalidWorkerCreation", format!("{err:#}")))
    }
    Ok(Ok(v)) => Ok((v.key.to_string(), v.reused)),
  }
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UserWorkerRequest {
  method: ByteString,
  url: String,
  headers: Vec<(String, String)>,
  has_body: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserWorkerBuiltRequest {
  request_rid: ResourceId,
  request_body_rid: Option<ResourceId>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserWorkerResponse {
  status: u16,
  status_text: String,
  headers: Vec<(ByteString, ByteString)>,
  body_rid: ResourceId,
  size: Option<u64>,
}

struct UserWorkerRequestResource(Request<Body>);

impl Resource for UserWorkerRequestResource {
  fn name(&self) -> std::borrow::Cow<'_, str> {
    "userWorkerRequest".into()
  }
}

struct UserWorkerRequestBodyResource {
  body: AsyncRefCell<Option<mpsc::Sender<Result<bytes::Bytes, Error>>>>,
  cancel: CancelHandle,
}

impl Resource for UserWorkerRequestBodyResource {
  fn name(&self) -> std::borrow::Cow<'_, str> {
    "userWorkerRequestBody".into()
  }

  fn write(self: Rc<Self>, buf: BufView) -> AsyncResult<WriteOutcome> {
    Box::pin(async move {
      let bytes: bytes::Bytes = buf.to_vec().into();
      let nwritten = bytes.len();
      let body = RcRef::map(&self, |r| &r.body).borrow_mut().await;
      let body = (*body).as_ref();
      let cancel = RcRef::map(self, |r| &r.cancel);
      let body = body.ok_or(type_error(
        "request body receiver not connected (request closed)",
      ))?;

      body.send(Ok(bytes)).or_cancel(cancel).await?.map_err(|e| {
        type_error(format!("request body receiver not connected ({})", e))
      })?;

      Ok(WriteOutcome::Full { nwritten })
    })
  }

  fn write_error(self: Rc<Self>, error: Error) -> AsyncResult<()> {
    async move {
      let body = RcRef::map(&self, |r| &r.body).borrow_mut().await;
      let body = (*body).as_ref();
      let cancel = RcRef::map(self, |r| &r.cancel);
      let body = body.ok_or(type_error(
        "request body receiver not connected (request closed)",
      ))?;
      body.send(Err(error)).or_cancel(cancel).await??;
      Ok(())
    }
    .boxed_local()
  }

  fn shutdown(self: Rc<Self>) -> AsyncResult<()> {
    async move {
      let mut body = RcRef::map(&self, |r| &r.body).borrow_mut().await;
      body.take();
      Ok(())
    }
    .boxed_local()
  }

  fn close(self: Rc<Self>) {
    self.cancel.cancel();
  }
}

type BytesStream =
  Pin<Box<dyn Stream<Item = Result<bytes::Bytes, std::io::Error>> + Unpin>>;

struct UserWorkerResponseBodyResource {
  reader: AsyncRefCell<Peekable<BytesStream>>,
  size: Option<u64>,
  req_end_tx: mpsc::UnboundedSender<()>,
  cancel: CancelHandle,
  conn_token: Option<CancellationToken>,
}

impl Resource for UserWorkerResponseBodyResource {
  fn name(&self) -> std::borrow::Cow<'_, str> {
    "userWorkerResponseBody".into()
  }

  fn read(self: Rc<Self>, limit: usize) -> AsyncResult<BufView> {
    Box::pin(async move {
      let reader = RcRef::map(&self, |r| &r.reader).borrow_mut().await;

      let fut = async move {
        let mut reader = Pin::new(reader);
        loop {
          match reader.as_mut().peek_mut().await {
            Some(Ok(chunk)) if !chunk.is_empty() => {
              let len = std::cmp::min(limit, chunk.len());
              let chunk = chunk.split_to(len);
              break Ok(chunk.into());
            }
            // This unwrap is safe because `peek_mut()` returned `Some`, and thus
            // currently has a peeked value that can be synchronously returned
            // from `next()`.
            //
            // The future returned from `next()` is always ready, so we can
            // safely call `await` on it without creating a race condition.
            Some(_) => match reader.as_mut().next().await.unwrap() {
              Ok(chunk) => assert!(chunk.is_empty()),
              Err(err) => break Err(type_error(err.to_string())),
            },
            None => break Ok(BufView::empty()),
          }
        }
      };

      let cancel_handle = RcRef::map(self, |r| &r.cancel);
      fut.try_or_cancel(cancel_handle).await
    })
  }

  fn close(self: Rc<Self>) {
    self.cancel.cancel();

    let _ = self.req_end_tx.send(());
    let Ok(this) = Rc::try_unwrap(self) else {
      return;
    };

    tokio::spawn(async move {
      if let Some(token) = this.conn_token {
        token.cancelled_owned().await;
      }
    });
  }

  fn size_hint(&self) -> (u64, Option<u64>) {
    (self.size.unwrap_or(0), self.size)
  }
}

#[op2]
#[serde]
pub fn op_user_worker_fetch_build(
  state: &mut OpState,
  #[serde] req: UserWorkerRequest,
) -> Result<UserWorkerBuiltRequest, AnyError> {
  let method = Method::from_bytes(&req.method)?;

  let mut builder = Request::builder().uri(req.url).method(&method);
  let mut body = Body::empty();
  let mut request_body_rid = None;

  if req.has_body {
    let (tx, stream) = mpsc::channel(1);

    body = Body::wrap_stream(BodyStream(stream));
    request_body_rid =
      Some(state.resource_table.add(UserWorkerRequestBodyResource {
        body: AsyncRefCell::new(Some(tx)),
        cancel: CancelHandle::default(),
      }));
  }

  // set the request headers
  for (key, value) in req.headers {
    if !key.is_empty() {
      let header_name = HeaderName::try_from(key).unwrap();
      let mut header_value =
        HeaderValue::try_from(value).unwrap_or(HeaderValue::from_static(""));

      // if request has no body explicitly set the content-length to 0
      if !req.has_body
        && header_name == CONTENT_LENGTH
        && matches!(method, Method::POST | Method::PUT)
      {
        header_value = HeaderValue::from(0);
      }

      builder = builder.header(header_name, header_value);
    }
  }

  let req = builder.body(body)?;
  let request_rid = state.resource_table.add(UserWorkerRequestResource(req));

  Ok(UserWorkerBuiltRequest {
    request_rid,
    request_body_rid,
  })
}

#[op2(async)]
#[serde]
pub async fn op_user_worker_fetch_send(
  state: Rc<RefCell<OpState>>,
  #[string] key: String,
  #[smi] rid: ResourceId,
  #[smi] request_body_rid: Option<ResourceId>,
  #[smi] stream_rid: ResourceId,
  #[smi] watcher_rid: Option<ResourceId>,
) -> Result<UserWorkerResponse, AnyError> {
  let (tx, req) = {
    let (tx, mut req) = {
      let mut op_state = state.borrow_mut();
      let tx = op_state
        .borrow::<mpsc::UnboundedSender<UserWorkerMsgs>>()
        .clone();

      let req = Rc::try_unwrap(
        op_state
          .resource_table
          .take::<UserWorkerRequestResource>(rid)?,
      )
      .ok()
      .expect("multiple op_user_worker_fetch_send ongoing");

      (tx, req)
    };

    if get_upgrade_type(req.0.headers()).is_some() {
      let req_stream = state
        .borrow_mut()
        .resource_table
        .get::<HttpStreamReadResource>(stream_rid)?;

      let mut req_reader_mut =
        RcRef::map(&req_stream, |r| &r.rd).borrow_mut().await;

      if let HttpRequestReader::Headers(orig_req) = &mut *req_reader_mut {
        if let Some(upgrade) = orig_req.extensions_mut().remove::<OnUpgrade>() {
          let _ = req.0.extensions_mut().insert(upgrade);
        }
      }
    }

    (tx, req)
  };

  let (result_tx, result_rx) =
    oneshot::channel::<Result<SendRequestResult, Error>>();
  let key_parsed = Uuid::try_parse(key.as_str())?;

  let conn_token = watcher_rid
    .and_then(|it| {
      state
        .borrow_mut()
        .resource_table
        .take::<ConnWatcher>(it)
        .ok()
    })
    .map(Rc::try_unwrap);

  let conn_token = match conn_token {
    Some(Ok(it)) => it.into_inner(),
    Some(Err(_)) => {
      error!("failed to unwrap connection watcher");
      None
    }

    None => None,
  };

  tx.send(UserWorkerMsgs::SendRequest(
    key_parsed,
    req.0,
    result_tx,
    conn_token.clone(),
  ))?;

  let request_body_guard = scopeguard::guard(request_body_rid, |rid| {
    if let Some(rid) = rid {
      match state
        .borrow()
        .resource_table
        .get::<UserWorkerRequestBodyResource>(rid)
      {
        Err(_) => {}
        Ok(res) => {
          res.cancel.cancel();
        }
      }
    }
  });

  let res = result_rx.await?;
  let (res, req_end_tx) = match res {
    Ok((res, req_end_tx)) => (res, req_end_tx),
    Err(err) => {
      error!("user worker failed to respond: {}", err);

      match err.downcast_ref() {
        Some(err @ WorkerError::RequestCancelledBySupervisor) => {
          return Err(custom_error("WorkerRequestCancelled", err.to_string()));
        }
        Some(err @ WorkerError::WorkerAlreadyRetired) => {
          return Err(custom_error("WorkerAlreadyRetired", err.to_string()));
        }
        Some(err @ WorkerError::RequestIdleTimeout) => {
          return Err(custom_error(
            "WorkerRequestIdleTimeout",
            err.to_string(),
          ));
        }

        None => {
          return Err(custom_error("InvalidWorkerResponse", err.to_string()));
        }
      }
    }
  };

  drop(request_body_guard);

  let mut headers = vec![];
  for (key, value) in res.headers().iter() {
    headers.push((
      ByteString::from(key.as_str()),
      ByteString::from(value.to_str().unwrap_or_default()),
    ));
  }

  let status = res.status().as_u16();
  let status_text = res
    .status()
    .canonical_reason()
    .unwrap_or("<unknown status code>")
    .to_string();

  let size = HttpBody::size_hint(res.body()).exact();
  let stream: BytesStream =
    Box::pin(res.into_body().map(|r| r.map_err(std::io::Error::other)));

  let mut op_state = state.borrow_mut();

  let body_rid = op_state.resource_table.add(UserWorkerResponseBodyResource {
    reader: AsyncRefCell::new(stream.peekable()),
    cancel: CancelHandle::default(),
    size,
    req_end_tx,
    conn_token,
  });

  let response = UserWorkerResponse {
    status,
    status_text,
    headers,
    body_rid,
    size,
  };

  Ok(response)
}

#[op2(async)]
#[number]
pub async fn op_user_worker_cleanup_idle_workers(
  state: Rc<RefCell<OpState>>,
  #[number] timeout_ms: usize,
) -> usize {
  let msg_tx = {
    state
      .borrow()
      .borrow::<mpsc::UnboundedSender<UserWorkerMsgs>>()
      .clone()
  };

  let (tx, rx) = oneshot::channel();
  if msg_tx
    .send(UserWorkerMsgs::TryCleanupIdleWorkers(timeout_ms, tx))
    .is_err()
  {
    return 0;
  }

  (rx.await).unwrap_or_default()
}

#[op2(async)]
#[serde]
pub async fn op_user_worker_mem_stats(
  state: Rc<RefCell<OpState>>,
) -> Result<HashMap<Uuid, WorkerHeapStatisticsWithServicePath>, Error> {
  let mem_rx = {
    let op_state = state.borrow();
    let tx = op_state.borrow::<mpsc::UnboundedSender<UserWorkerMsgs>>();

    let (mem_tx, mem_rx) = oneshot::channel();
    let _ = tx.send(UserWorkerMsgs::InqueryMemoryUsage(mem_tx));

    mem_rx
  };

  Ok(mem_rx.await?)
}

/// Wraps a [`mpsc::Receiver`] in a [`Stream`] that can be used as a Hyper [`Body`].
pub struct BodyStream(pub mpsc::Receiver<Result<bytes::Bytes, Error>>);

impl Stream for BodyStream {
  type Item = Result<bytes::Bytes, Error>;

  fn poll_next(
    mut self: Pin<&mut Self>,
    cx: &mut Context<'_>,
  ) -> Poll<Option<Self::Item>> {
    self.0.poll_recv(cx)
  }
}
