// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

pub mod dns;
mod fs_fetch_handler;
mod proxy;
#[cfg(test)]
mod tests;

use std::borrow::Cow;
use std::cell::RefCell;
use std::cmp::min;
use std::convert::From;
use std::path::Path;
use std::path::PathBuf;
use std::pin::Pin;
use std::rc::Rc;
use std::sync::Arc;
use std::sync::OnceLock;
use std::task::Context;
use std::task::Poll;

static TCP_KEEPALIVE: OnceLock<std::time::Duration> = OnceLock::new();

fn tcp_keepalive() -> std::time::Duration {
  *TCP_KEEPALIVE.get_or_init(|| {
    let secs = std::env::var("DENO_TCP_KEEPALIVE_SECS")
      .ok()
      .and_then(|v| v.parse::<u64>().ok())
      .unwrap_or(30);
    std::time::Duration::from_secs(secs)
  })
}

use deno_core::futures::stream::Peekable;
use deno_core::futures::Future;
use deno_core::futures::FutureExt;
use deno_core::futures::Stream;
use deno_core::futures::StreamExt;
use deno_core::futures::TryFutureExt;
use deno_core::op2;
use deno_core::url;
use deno_core::url::Url;
use deno_core::v8;
use deno_core::AsyncRefCell;
use deno_core::AsyncResult;
use deno_core::BufView;
use deno_core::ByteString;
use deno_core::CancelFuture;
use deno_core::CancelHandle;
use deno_core::CancelTryFuture;
use deno_core::Canceled;
use deno_core::JsBuffer;
use deno_core::OpState;
use deno_core::RcRef;
use deno_core::Resource;
use deno_core::ResourceId;
use deno_path_util::url_from_file_path;
use deno_path_util::PathToUrlError;
use deno_permissions::PermissionCheckError;
use deno_tls::rustls::RootCertStore;
use deno_tls::Proxy;
use deno_tls::RootCertStoreProvider;
use deno_tls::TlsKey;
use deno_tls::TlsKeys;
use deno_tls::TlsKeysHolder;

use bytes::Bytes;
use data_url::DataUrl;
use http::header::HeaderName;
use http::header::HeaderValue;
use http::header::ACCEPT;
use http::header::ACCEPT_ENCODING;
use http::header::AUTHORIZATION;
use http::header::CONTENT_LENGTH;
use http::header::HOST;
use http::header::PROXY_AUTHORIZATION;
use http::header::RANGE;
use http::header::USER_AGENT;
use http::Extensions;
use http::Method;
use http::Uri;
use http_body_util::BodyExt;
use hyper::body::Frame;
use hyper_util::client::legacy::connect::HttpConnector;
use hyper_util::client::legacy::connect::HttpInfo;
use hyper_util::client::legacy::Builder as HyperClientBuilder;
use hyper_util::rt::TokioExecutor;
use hyper_util::rt::TokioTimer;
use serde::Deserialize;
use serde::Serialize;
use tower::ServiceExt;
use tower_http::decompression::Decompression;

// Re-export data_url
pub use data_url;
pub use proxy::basic_auth;

pub use fs_fetch_handler::FsFetchHandler;

#[derive(Clone)]
pub struct Options {
  pub user_agent: String,
  pub root_cert_store_provider: Option<Arc<dyn RootCertStoreProvider>>,
  pub proxy: Option<Proxy>,
  /// A callback to customize HTTP client configuration.
  ///
  /// The settings applied with this hook may be overridden by the options
  /// provided through `Deno.createHttpClient()` API. For instance, if the hook
  /// calls [`hyper_util::client::legacy::Builder::pool_max_idle_per_host`] with
  /// a value of 99, and a user calls `Deno.createHttpClient({ poolMaxIdlePerHost: 42 })`,
  /// the value that will take effect is 42.
  ///
  /// For more info on what can be configured, see [`hyper_util::client::legacy::Builder`].
  pub client_builder_hook: Option<fn(HyperClientBuilder) -> HyperClientBuilder>,
  /// A callback to customize the headers of every outbound request before it
  /// is sent.
  ///
  /// Unlike upstream, it is a closure rather than a plain `fn`, so a hook can
  /// carry state of its own (the worker it belongs to, say). It also takes the
  /// header map rather than the whole request: callers build requests with
  /// different body types (`ReqBody` here, `()` in `node:http2`) and a
  /// `dyn Fn` cannot be generic over them, while the headers are the surface
  /// every path shares.
  #[allow(clippy::type_complexity)]
  pub request_builder_hook: Option<
    Arc<
      dyn Fn(&mut http::HeaderMap) -> Result<(), deno_core::error::AnyError>
        + Send
        + Sync,
    >,
  >,
  pub unsafely_ignore_certificate_errors: Option<Vec<String>>,
  pub client_cert_chain_and_key: TlsKeys,
  pub file_fetch_handler: Rc<dyn FetchHandler>,
  pub resolver: dns::Resolver,
}

impl Options {
  pub fn root_cert_store(
    &self,
  ) -> Result<Option<RootCertStore>, deno_core::error::AnyError> {
    Ok(match &self.root_cert_store_provider {
      Some(provider) => Some(provider.get_or_try_init()?.clone()),
      None => None,
    })
  }
}

impl Default for Options {
  fn default() -> Self {
    Self {
      user_agent: "".to_string(),
      root_cert_store_provider: None,
      proxy: None,
      client_builder_hook: None,
      request_builder_hook: None,
      unsafely_ignore_certificate_errors: None,
      client_cert_chain_and_key: TlsKeys::Null,
      file_fetch_handler: Rc::new(DefaultFileFetchHandler),
      resolver: dns::Resolver::default(),
    }
  }
}

deno_core::extension!(deno_fetch,
  deps = [ deno_webidl, deno_web, deno_url, deno_console ],
  parameters = [FP: FetchPermissions],
  ops = [
    op_fetch<FP>,
    op_fetch_send,
    op_utf8_to_byte_string,
    op_fetch_custom_client<FP>,
    op_fetch_promise_is_settled,
  ],
  esm = [
    "20_headers.js",
    "21_formdata.js",
    "22_body.js",
    "22_http_client.js",
    "23_request.js",
    "23_response.js",
    "26_fetch.js",
    "27_eventsource.js"
  ],
  options = {
    options: Options,
  },
  state = |state, options| {
    state.put::<Options>(options.options);
  },
);

#[derive(Debug, thiserror::Error)]
pub enum FetchError {
  #[error(transparent)]
  Resource(deno_core::error::AnyError),
  #[error(transparent)]
  Permission(#[from] PermissionCheckError),
  #[error("NetworkError when attempting to fetch resource")]
  NetworkError,
  #[error("Fetching files only supports the GET method: received {0}")]
  FsNotGet(Method),
  #[error(transparent)]
  PathToUrl(#[from] PathToUrlError),
  #[error("Invalid URL {0}")]
  InvalidUrl(Url),
  #[error(transparent)]
  InvalidHeaderName(#[from] http::header::InvalidHeaderName),
  #[error(transparent)]
  InvalidHeaderValue(#[from] http::header::InvalidHeaderValue),
  #[error("{0:?}")]
  DataUrl(data_url::DataUrlError),
  #[error("{0:?}")]
  Base64(data_url::forgiving_base64::InvalidBase64),
  #[error("Blob for the given URL not found.")]
  BlobNotFound,
  #[error("Url scheme '{0}' not supported")]
  SchemeNotSupported(String),
  #[error("Request was cancelled")]
  RequestCanceled,
  #[error(transparent)]
  Http(#[from] http::Error),
  #[error(transparent)]
  ClientCreate(#[from] HttpClientCreateError),
  #[error(transparent)]
  Url(#[from] url::ParseError),
  #[error(transparent)]
  Method(#[from] http::method::InvalidMethod),
  #[error(transparent)]
  ClientSend(#[from] ClientSendError),
  #[error(transparent)]
  RequestBuilderHook(deno_core::error::AnyError),
  #[error(transparent)]
  Io(#[from] std::io::Error),
  // Only used for node upgrade
  #[error(transparent)]
  Hyper(#[from] hyper::Error),
}

pub type CancelableResponseFuture =
  Pin<Box<dyn Future<Output = CancelableResponseResult>>>;

pub trait FetchHandler: dyn_clone::DynClone {
  // Return the result of the fetch request consisting of a tuple of the
  // cancelable response result, the optional fetch body resource and the
  // optional cancel handle.
  fn fetch_file(
    &self,
    state: &mut OpState,
    url: &Url,
  ) -> (CancelableResponseFuture, Option<Rc<CancelHandle>>);
}

dyn_clone::clone_trait_object!(FetchHandler);

/// A default implementation which will error for every request.
#[derive(Clone)]
pub struct DefaultFileFetchHandler;

impl FetchHandler for DefaultFileFetchHandler {
  fn fetch_file(
    &self,
    _state: &mut OpState,
    _url: &Url,
  ) -> (CancelableResponseFuture, Option<Rc<CancelHandle>>) {
    let fut = async move { Ok(Err(FetchError::NetworkError)) };
    (Box::pin(fut), None)
  }
}

pub fn get_declaration() -> PathBuf {
  PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("lib.deno_fetch.d.ts")
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchReturn {
  pub request_rid: ResourceId,
  pub cancel_handle_rid: Option<ResourceId>,
}

pub fn get_or_create_client_from_state(
  state: &mut OpState,
) -> Result<Client, HttpClientCreateError> {
  if let Some(client) = state.try_borrow::<Client>() {
    Ok(client.clone())
  } else {
    let options = state.borrow::<Options>();
    let client = create_client_from_options(options)?;
    state.put::<Client>(client.clone());
    Ok(client)
  }
}

pub fn create_client_from_options(
  options: &Options,
) -> Result<Client, HttpClientCreateError> {
  create_http_client(
    &options.user_agent,
    CreateHttpClientOptions {
      root_cert_store: options
        .root_cert_store()
        .map_err(HttpClientCreateError::RootCertStore)?,
      ca_certs: vec![],
      proxy: options.proxy.clone(),
      dns_resolver: options.resolver.clone(),
      unsafely_ignore_certificate_errors: options
        .unsafely_ignore_certificate_errors
        .clone(),
      client_cert_chain_and_key: options
        .client_cert_chain_and_key
        .clone()
        .try_into()
        .unwrap_or_default(),
      pool_max_idle_per_host: None,
      pool_idle_timeout: None,
      http1: true,
      http2: true,
      client_builder_hook: options.client_builder_hook,
    },
  )
}

#[allow(clippy::type_complexity)]
pub struct ResourceToBodyAdapter(
  Rc<dyn Resource>,
  Option<
    Pin<Box<dyn Future<Output = Result<BufView, deno_core::error::AnyError>>>>,
  >,
);

impl ResourceToBodyAdapter {
  pub fn new(resource: Rc<dyn Resource>) -> Self {
    let future = resource.clone().read(64 * 1024);
    Self(resource, Some(future))
  }
}

// SAFETY: we only use this on a single-threaded executor
unsafe impl Send for ResourceToBodyAdapter {}
// SAFETY: we only use this on a single-threaded executor
unsafe impl Sync for ResourceToBodyAdapter {}

impl Stream for ResourceToBodyAdapter {
  type Item = Result<Bytes, deno_core::error::AnyError>;

  fn poll_next(
    self: Pin<&mut Self>,
    cx: &mut Context<'_>,
  ) -> Poll<Option<Self::Item>> {
    let this = self.get_mut();
    if let Some(mut fut) = this.1.take() {
      match fut.poll_unpin(cx) {
        Poll::Pending => {
          this.1 = Some(fut);
          Poll::Pending
        }
        Poll::Ready(res) => match res {
          Ok(buf) if buf.is_empty() => Poll::Ready(None),
          Ok(buf) => {
            this.1 = Some(this.0.clone().read(64 * 1024));
            Poll::Ready(Some(Ok(buf.to_vec().into())))
          }
          Err(err) => Poll::Ready(Some(Err(err))),
        },
      }
    } else {
      Poll::Ready(None)
    }
  }
}

impl hyper::body::Body for ResourceToBodyAdapter {
  type Data = Bytes;
  type Error = deno_core::error::AnyError;

  fn poll_frame(
    self: Pin<&mut Self>,
    cx: &mut Context<'_>,
  ) -> Poll<Option<Result<Frame<Self::Data>, Self::Error>>> {
    match self.poll_next(cx) {
      Poll::Ready(Some(res)) => Poll::Ready(Some(res.map(Frame::data))),
      Poll::Ready(None) => Poll::Ready(None),
      Poll::Pending => Poll::Pending,
    }
  }
}

impl Drop for ResourceToBodyAdapter {
  fn drop(&mut self) {
    self.0.clone().close()
  }
}

pub trait FetchPermissions {
  fn check_net_url(
    &mut self,
    url: &Url,
    api_name: &str,
  ) -> Result<(), PermissionCheckError>;
  #[must_use = "the resolved return value to mitigate time-of-check to time-of-use issues"]
  fn check_read<'a>(
    &mut self,
    p: &'a Path,
    api_name: &str,
  ) -> Result<Cow<'a, Path>, PermissionCheckError>;
}

impl FetchPermissions for deno_permissions::PermissionsContainer {
  #[inline(always)]
  fn check_net_url(
    &mut self,
    url: &Url,
    api_name: &str,
  ) -> Result<(), PermissionCheckError> {
    deno_permissions::PermissionsContainer::check_net_url(self, url, api_name)
  }

  #[inline(always)]
  fn check_read<'a>(
    &mut self,
    path: &'a Path,
    api_name: &str,
  ) -> Result<Cow<'a, Path>, PermissionCheckError> {
    deno_permissions::PermissionsContainer::check_read_path(
      self,
      path,
      Some(api_name),
    )
  }
}

#[op2(stack_trace)]
#[serde]
#[allow(clippy::too_many_arguments)]
pub fn op_fetch<FP>(
  state: &mut OpState,
  #[serde] method: ByteString,
  #[string] url: String,
  #[serde] headers: Vec<(ByteString, ByteString)>,
  #[smi] client_rid: Option<u32>,
  has_body: bool,
  #[buffer] data: Option<JsBuffer>,
  #[smi] resource: Option<ResourceId>,
) -> Result<FetchReturn, FetchError>
where
  FP: FetchPermissions + 'static,
{
  let (client, allow_host) = if let Some(rid) = client_rid {
    let r = state
      .resource_table
      .get::<HttpClientResource>(rid)
      .map_err(FetchError::Resource)?;
    (r.client.clone(), r.allow_host)
  } else {
    (get_or_create_client_from_state(state)?, false)
  };

  let method = Method::from_bytes(&method)?;
  let mut url = Url::parse(&url)?;

  // Check scheme before asking for net permission
  let scheme = url.scheme();
  let (request_rid, cancel_handle_rid) = match scheme {
    "file" => {
      let path = url.to_file_path().map_err(|_| FetchError::NetworkError)?;
      let permissions = state.borrow_mut::<FP>();
      let path = permissions.check_read(&path, "fetch()")?;
      let url = match path {
        Cow::Owned(path) => url_from_file_path(&path)?,
        Cow::Borrowed(_) => url,
      };

      if method != Method::GET {
        return Err(FetchError::FsNotGet(method));
      }

      let Options {
        file_fetch_handler, ..
      } = state.borrow_mut::<Options>();
      let file_fetch_handler = file_fetch_handler.clone();
      let (future, maybe_cancel_handle) =
        file_fetch_handler.fetch_file(state, &url);
      let request_rid = state
        .resource_table
        .add(FetchRequestResource { future, url });
      let maybe_cancel_handle_rid = maybe_cancel_handle
        .map(|ch| state.resource_table.add(FetchCancelHandle(ch)));

      (request_rid, maybe_cancel_handle_rid)
    }
    "http" | "https" => {
      let permissions = state.borrow_mut::<FP>();
      permissions.check_net_url(&url, "fetch()")?;

      let maybe_authority = extract_authority(&mut url);
      let uri = url
        .as_str()
        .parse::<Uri>()
        .map_err(|_| FetchError::InvalidUrl(url.clone()))?;

      let mut con_len = None;
      let body = if has_body {
        match (data, resource) {
          (Some(data), _) => {
            // If a body is passed, we use it, and don't return a body for streaming.
            con_len = Some(data.len() as u64);

            http_body_util::Full::new(data.to_vec().into())
              .map_err(|never| match never {})
              .boxed()
          }
          (_, Some(resource)) => {
            let resource = state
              .resource_table
              .take_any(resource)
              .map_err(FetchError::Resource)?;
            match resource.size_hint() {
              (body_size, Some(n)) if body_size == n && body_size > 0 => {
                con_len = Some(body_size);
              }
              _ => {}
            }
            ReqBody::new(ResourceToBodyAdapter::new(resource))
          }
          (None, None) => unreachable!(),
        }
      } else {
        // POST and PUT requests should always have a 0 length content-length,
        // if there is no body. https://fetch.spec.whatwg.org/#http-network-or-cache-fetch
        if matches!(method, Method::POST | Method::PUT) {
          con_len = Some(0);
        }
        http_body_util::Empty::new()
          .map_err(|never| match never {})
          .boxed()
      };

      let mut request = http::Request::new(body);
      *request.method_mut() = method.clone();
      *request.uri_mut() = uri.clone();

      if let Some((username, password)) = maybe_authority {
        request.headers_mut().insert(
          AUTHORIZATION,
          proxy::basic_auth(&username, password.as_deref()),
        );
      }
      if let Some(len) = con_len {
        request.headers_mut().insert(CONTENT_LENGTH, len.into());
      }

      for (key, value) in headers {
        let name = HeaderName::from_bytes(&key)?;
        let v = HeaderValue::from_bytes(&value)?;

        if (name != HOST || allow_host) && name != CONTENT_LENGTH {
          request.headers_mut().append(name, v);
        }
      }

      if request.headers().contains_key(RANGE) {
        // https://fetch.spec.whatwg.org/#http-network-or-cache-fetch step 18
        // If httpRequest’s header list contains `Range`, then append (`Accept-Encoding`, `identity`)
        request
          .headers_mut()
          .insert(ACCEPT_ENCODING, HeaderValue::from_static("identity"));
      }

      let options = state.borrow::<Options>();
      if let Some(request_builder_hook) = options.request_builder_hook.as_ref()
      {
        request_builder_hook(request.headers_mut())
          .map_err(FetchError::RequestBuilderHook)?;
      }

      let cancel_handle = CancelHandle::new_rc();
      let cancel_handle_ = cancel_handle.clone();

      let fut = async move {
        client
          .send(request)
          .map_err(Into::into)
          .or_cancel(cancel_handle_)
          .await
      };

      let request_rid = state.resource_table.add(FetchRequestResource {
        future: Box::pin(fut),
        url,
      });

      let cancel_handle_rid =
        state.resource_table.add(FetchCancelHandle(cancel_handle));

      (request_rid, Some(cancel_handle_rid))
    }
    "data" => {
      let data_url =
        DataUrl::process(url.as_str()).map_err(FetchError::DataUrl)?;

      let (body, _) = data_url.decode_to_vec().map_err(FetchError::Base64)?;
      let body = http_body_util::Full::new(body.into())
        .map_err(|never| match never {})
        .boxed();

      let response = http::Response::builder()
        .status(http::StatusCode::OK)
        .header(http::header::CONTENT_TYPE, data_url.mime_type().to_string())
        .body(body)?;

      let fut = async move { Ok(Ok(response)) };

      let request_rid = state.resource_table.add(FetchRequestResource {
        future: Box::pin(fut),
        url,
      });

      (request_rid, None)
    }
    "blob" => {
      // Blob URL resolution happens in the JS side of fetch. If we got here is
      // because the URL isn't an object URL.
      return Err(FetchError::BlobNotFound);
    }
    _ => return Err(FetchError::SchemeNotSupported(scheme.to_string())),
  };

  Ok(FetchReturn {
    request_rid,
    cancel_handle_rid,
  })
}

#[derive(Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchResponse {
  pub status: u16,
  pub status_text: String,
  pub headers: Vec<(ByteString, ByteString)>,
  pub url: String,
  pub response_rid: ResourceId,
  pub content_length: Option<u64>,
  pub remote_addr_ip: Option<String>,
  pub remote_addr_port: Option<u16>,
  /// This field is populated if some error occurred which needs to be
  /// reconstructed in the JS side to set the error _cause_.
  /// In the tuple, the first element is an error message and the second one is
  /// an error cause.
  pub error: Option<(String, String)>,
}

#[op2(async)]
#[serde]
pub async fn op_fetch_send(
  state: Rc<RefCell<OpState>>,
  #[smi] rid: ResourceId,
) -> Result<FetchResponse, FetchError> {
  let request = state
    .borrow_mut()
    .resource_table
    .take::<FetchRequestResource>(rid)
    .map_err(FetchError::Resource)?;

  let request = Rc::try_unwrap(request)
    .ok()
    .expect("multiple op_fetch_send ongoing");

  let res = match request.future.await {
    Ok(Ok(res)) => res,
    Ok(Err(err)) => {
      // We're going to try and rescue the error cause from a stream and return it from this fetch.
      // If any error in the chain is a hyper body error, return that as a special result we can use to
      // reconstruct an error chain (eg: `new TypeError(..., { cause: new Error(...) })`).
      // TODO(mmastrac): it would be a lot easier if we just passed a v8::Global through here instead

      if let FetchError::ClientSend(err_src) = &err {
        if let Some(client_err) = std::error::Error::source(&err_src.source) {
          if let Some(err_src) = client_err.downcast_ref::<hyper::Error>() {
            if let Some(err_src) = std::error::Error::source(err_src) {
              return Ok(FetchResponse {
                error: Some((err.to_string(), err_src.to_string())),
                ..Default::default()
              });
            }
          }
        }
      }

      return Err(err);
    }
    Err(_) => return Err(FetchError::RequestCanceled),
  };

  let status = res.status();
  let url = request.url.into();
  let mut res_headers = Vec::new();
  for (key, val) in res.headers().iter() {
    res_headers.push((key.as_str().into(), val.as_bytes().into()));
  }

  let content_length = hyper::body::Body::size_hint(res.body()).exact();
  let remote_addr = res
    .extensions()
    .get::<hyper_util::client::legacy::connect::HttpInfo>()
    .map(|info| info.remote_addr());
  let (remote_addr_ip, remote_addr_port) = if let Some(addr) = remote_addr {
    (Some(addr.ip().to_string()), Some(addr.port()))
  } else {
    (None, None)
  };

  let response_rid = state
    .borrow_mut()
    .resource_table
    .add(FetchResponseResource::new(res, content_length));

  Ok(FetchResponse {
    status: status.as_u16(),
    status_text: status.canonical_reason().unwrap_or("").to_string(),
    headers: res_headers,
    url,
    response_rid,
    content_length,
    remote_addr_ip,
    remote_addr_port,
    error: None,
  })
}

type CancelableResponseResult =
  Result<Result<http::Response<ResBody>, FetchError>, Canceled>;

pub struct FetchRequestResource {
  pub future: Pin<Box<dyn Future<Output = CancelableResponseResult>>>,
  pub url: Url,
}

impl Resource for FetchRequestResource {
  fn name(&self) -> Cow<'_, str> {
    "fetchRequest".into()
  }
}

pub struct FetchCancelHandle(pub Rc<CancelHandle>);

impl Resource for FetchCancelHandle {
  fn name(&self) -> Cow<'_, str> {
    "fetchCancelHandle".into()
  }

  fn close(self: Rc<Self>) {
    self.0.cancel()
  }
}

type BytesStream =
  Pin<Box<dyn Stream<Item = Result<bytes::Bytes, std::io::Error>> + Unpin>>;

pub enum FetchResponseReader {
  Start(http::Response<ResBody>),
  BodyReader(Peekable<BytesStream>),
}

impl Default for FetchResponseReader {
  fn default() -> Self {
    let stream: BytesStream = Box::pin(deno_core::futures::stream::empty());
    Self::BodyReader(stream.peekable())
  }
}
#[derive(Debug)]
pub struct FetchResponseResource {
  pub response_reader: AsyncRefCell<FetchResponseReader>,
  pub cancel: CancelHandle,
  pub size: Option<u64>,
}

impl FetchResponseResource {
  pub fn new(response: http::Response<ResBody>, size: Option<u64>) -> Self {
    Self {
      response_reader: AsyncRefCell::new(FetchResponseReader::Start(response)),
      cancel: CancelHandle::default(),
      size,
    }
  }

  pub async fn upgrade(self) -> Result<hyper::upgrade::Upgraded, hyper::Error> {
    let reader = self.response_reader.into_inner();
    match reader {
      FetchResponseReader::Start(resp) => Ok(hyper::upgrade::on(resp).await?),
      _ => unreachable!(),
    }
  }
}

impl Resource for FetchResponseResource {
  fn name(&self) -> Cow<'_, str> {
    "fetchResponse".into()
  }

  fn read(self: Rc<Self>, limit: usize) -> AsyncResult<BufView> {
    Box::pin(async move {
      let mut reader =
        RcRef::map(&self, |r| &r.response_reader).borrow_mut().await;

      let body = loop {
        match &mut *reader {
          FetchResponseReader::BodyReader(reader) => break reader,
          FetchResponseReader::Start(_) => {}
        }

        match std::mem::take(&mut *reader) {
          FetchResponseReader::Start(resp) => {
            let stream: BytesStream =
              Box::pin(resp.into_body().into_data_stream().map(|r| {
                r.map_err(|err| {
                  std::io::Error::new(std::io::ErrorKind::Other, err)
                })
              }));
            *reader = FetchResponseReader::BodyReader(stream.peekable());
          }
          FetchResponseReader::BodyReader(_) => unreachable!(),
        }
      };
      let fut = async move {
        let mut reader = Pin::new(body);
        loop {
          match reader.as_mut().peek_mut().await {
            Some(Ok(chunk)) if !chunk.is_empty() => {
              let len = min(limit, chunk.len());
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
              Err(err) => {
                break Err(deno_core::error::type_error(err.to_string()))
              }
            },
            None => break Ok(BufView::empty()),
          }
        }
      };

      let cancel_handle = RcRef::map(self, |r| &r.cancel);
      fut.try_or_cancel(cancel_handle).await
    })
  }

  fn size_hint(&self) -> (u64, Option<u64>) {
    (self.size.unwrap_or(0), self.size)
  }

  fn close(self: Rc<Self>) {
    self.cancel.cancel()
  }
}

pub struct HttpClientResource {
  pub client: Client,
  pub allow_host: bool,
}

impl Resource for HttpClientResource {
  fn name(&self) -> Cow<'_, str> {
    "httpClient".into()
  }
}

impl HttpClientResource {
  fn new(client: Client, allow_host: bool) -> Self {
    Self { client, allow_host }
  }
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateHttpClientArgs {
  ca_certs: Vec<String>,
  proxy: Option<Proxy>,
  pool_max_idle_per_host: Option<usize>,
  pool_idle_timeout: Option<serde_json::Value>,
  #[serde(default)]
  use_hickory_resolver: bool,
  #[serde(default = "default_true")]
  http1: bool,
  #[serde(default = "default_true")]
  http2: bool,
  #[serde(default)]
  allow_host: bool,
}

fn default_true() -> bool {
  true
}

#[op2(stack_trace)]
#[smi]
pub fn op_fetch_custom_client<FP>(
  state: &mut OpState,
  #[serde] args: CreateHttpClientArgs,
  #[cppgc] tls_keys: &TlsKeysHolder,
) -> Result<ResourceId, FetchError>
where
  FP: FetchPermissions + 'static,
{
  if let Some(proxy) = args.proxy.clone() {
    let permissions = state.borrow_mut::<FP>();
    let url = Url::parse(&proxy.url)?;
    permissions.check_net_url(&url, "Deno.createHttpClient()")?;
  }

  let options = state.borrow::<Options>();
  let ca_certs = args
    .ca_certs
    .into_iter()
    .map(|cert| cert.into_bytes())
    .collect::<Vec<_>>();

  let client = create_http_client(
    &options.user_agent,
    CreateHttpClientOptions {
      root_cert_store: options
        .root_cert_store()
        .map_err(HttpClientCreateError::RootCertStore)?,
      ca_certs,
      proxy: args.proxy,
      dns_resolver: if args.use_hickory_resolver {
        dns::Resolver::hickory()
          .map_err(deno_core::error::AnyError::new)
          .map_err(FetchError::Resource)?
      } else {
        dns::Resolver::default()
      },
      unsafely_ignore_certificate_errors: options
        .unsafely_ignore_certificate_errors
        .clone(),
      client_cert_chain_and_key: tls_keys.take().try_into().unwrap(),
      pool_max_idle_per_host: args.pool_max_idle_per_host,
      pool_idle_timeout: args.pool_idle_timeout.and_then(
        |timeout| match timeout {
          serde_json::Value::Bool(true) => None,
          serde_json::Value::Bool(false) => Some(None),
          serde_json::Value::Number(specify) => {
            Some(Some(specify.as_u64().unwrap_or_default()))
          }
          _ => Some(None),
        },
      ),
      http1: args.http1,
      http2: args.http2,
      client_builder_hook: options.client_builder_hook,
    },
  )?;

  let rid = state
    .resource_table
    .add(HttpClientResource::new(client, args.allow_host));
  Ok(rid)
}

#[derive(Debug, Clone)]
pub struct CreateHttpClientOptions {
  pub root_cert_store: Option<RootCertStore>,
  pub ca_certs: Vec<Vec<u8>>,
  pub proxy: Option<Proxy>,
  pub dns_resolver: dns::Resolver,
  pub unsafely_ignore_certificate_errors: Option<Vec<String>>,
  pub client_cert_chain_and_key: Option<TlsKey>,
  pub pool_max_idle_per_host: Option<usize>,
  pub pool_idle_timeout: Option<Option<u64>>,
  pub http1: bool,
  pub http2: bool,
  pub client_builder_hook: Option<fn(HyperClientBuilder) -> HyperClientBuilder>,
}

impl Default for CreateHttpClientOptions {
  fn default() -> Self {
    CreateHttpClientOptions {
      root_cert_store: None,
      ca_certs: vec![],
      proxy: None,
      dns_resolver: dns::Resolver::default(),
      unsafely_ignore_certificate_errors: None,
      client_cert_chain_and_key: None,
      pool_max_idle_per_host: None,
      pool_idle_timeout: None,
      http1: true,
      http2: true,
      client_builder_hook: None,
    }
  }
}

#[derive(Debug, thiserror::Error)]
pub enum HttpClientCreateError {
  #[error(transparent)]
  Tls(deno_tls::TlsError),
  #[error("Illegal characters in User-Agent: received {0}")]
  InvalidUserAgent(String),
  #[error("invalid proxy url")]
  InvalidProxyUrl,
  #[error("Cannot create Http Client: either `http1` or `http2` needs to be set to true")]
  HttpVersionSelectionInvalid,
  #[error(transparent)]
  RootCertStore(deno_core::error::AnyError),
}

/// Create new instance of async Client. This client supports
/// proxies and doesn't follow redirects.
pub fn create_http_client(
  user_agent: &str,
  options: CreateHttpClientOptions,
) -> Result<Client, HttpClientCreateError> {
  let mut tls_config = deno_tls::create_client_config(
    options.root_cert_store,
    options.ca_certs,
    options.unsafely_ignore_certificate_errors,
    options.client_cert_chain_and_key.into(),
    deno_tls::SocketUse::Http,
  )
  .map_err(HttpClientCreateError::Tls)?;

  // Proxy TLS should not send ALPN
  tls_config.alpn_protocols.clear();
  let proxy_tls_config = Arc::from(tls_config.clone());

  let mut alpn_protocols = vec![];
  if options.http2 {
    alpn_protocols.push("h2".into());
  }
  if options.http1 {
    alpn_protocols.push("http/1.1".into());
  }
  tls_config.alpn_protocols = alpn_protocols;
  let tls_config = Arc::from(tls_config);

  let mut http_connector =
    HttpConnector::new_with_resolver(options.dns_resolver.clone());
  http_connector.enforce_http(false);
  http_connector.set_keepalive(Some(tcp_keepalive()));

  let user_agent = user_agent.parse::<HeaderValue>().map_err(|_| {
    HttpClientCreateError::InvalidUserAgent(user_agent.to_string())
  })?;

  let mut builder = HyperClientBuilder::new(TokioExecutor::new());
  builder.timer(TokioTimer::new());
  builder.pool_timer(TokioTimer::new());

  if let Some(client_builder_hook) = options.client_builder_hook {
    builder = client_builder_hook(builder);
  }

  let mut proxies = proxy::from_env();
  if let Some(proxy) = options.proxy {
    let mut intercept = proxy::Intercept::all(&proxy.url)
      .ok_or_else(|| HttpClientCreateError::InvalidProxyUrl)?;
    if let Some(basic_auth) = &proxy.basic_auth {
      intercept.set_auth(&basic_auth.username, &basic_auth.password);
    }
    proxies.prepend(intercept);
  }
  let proxies = Arc::new(proxies);
  let connector = proxy::ProxyConnector {
    http: http_connector,
    proxies: proxies.clone(),
    tls: tls_config,
    tls_proxy: proxy_tls_config,
    user_agent: Some(user_agent.clone()),
  };

  if let Some(pool_max_idle_per_host) = options.pool_max_idle_per_host {
    builder.pool_max_idle_per_host(pool_max_idle_per_host);
  }

  if let Some(pool_idle_timeout) = options.pool_idle_timeout {
    builder.pool_idle_timeout(
      pool_idle_timeout.map(std::time::Duration::from_millis),
    );
  }

  match (options.http1, options.http2) {
    (true, false) => {} // noop, handled by ALPN above
    (false, true) => {
      builder.http2_only(true);
    }
    (true, true) => {}
    (false, false) => {
      return Err(HttpClientCreateError::HttpVersionSelectionInvalid)
    }
  }

  let pooled_client = builder.build(connector);
  let decompress = Decompression::new(pooled_client).gzip(true).br(true);

  Ok(Client {
    inner: decompress,
    proxies,
    user_agent,
  })
}

#[op2]
#[serde]
pub fn op_utf8_to_byte_string(#[string] input: String) -> ByteString {
  input.into()
}

#[derive(Clone, Debug)]
pub struct Client {
  inner: Decompression<hyper_util::client::legacy::Client<Connector, ReqBody>>,
  // Used to check whether to include a proxy-authorization header
  proxies: Arc<proxy::Proxies>,
  user_agent: HeaderValue,
}

type Connector = proxy::ProxyConnector<HttpConnector<dns::Resolver>>;

// clippy is wrong here
#[allow(clippy::declare_interior_mutable_const)]
const STAR_STAR: HeaderValue = HeaderValue::from_static("*/*");

#[derive(Debug)]
pub struct ClientSendError {
  uri: Uri,
  pub source: hyper_util::client::legacy::Error,
}

impl ClientSendError {
  pub fn is_connect_error(&self) -> bool {
    self.source.is_connect()
  }

  fn http_info(&self) -> Option<HttpInfo> {
    let mut exts = Extensions::new();
    self.source.connect_info()?.get_extras(&mut exts);
    exts.remove::<HttpInfo>()
  }
}

impl std::fmt::Display for ClientSendError {
  fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
    // NOTE: we can use `std::error::Report` instead once it's stabilized.
    let detail = error_reporter::Report::new(&self.source);

    match self.http_info() {
      Some(http_info) => {
        write!(
          f,
          "error sending request from {src} for {uri} ({dst}): {detail}",
          src = http_info.local_addr(),
          uri = self.uri,
          dst = http_info.remote_addr(),
          detail = detail,
        )
      }
      None => {
        write!(
          f,
          "error sending request for url ({uri}): {detail}",
          uri = self.uri,
          detail = detail,
        )
      }
    }
  }
}

impl std::error::Error for ClientSendError {
  fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
    Some(&self.source)
  }
}

impl Client {
  pub async fn send(
    self,
    mut req: http::Request<ReqBody>,
  ) -> Result<http::Response<ResBody>, ClientSendError> {
    req
      .headers_mut()
      .entry(USER_AGENT)
      .or_insert_with(|| self.user_agent.clone());

    req.headers_mut().entry(ACCEPT).or_insert(STAR_STAR);

    if let Some(auth) = self.proxies.http_forward_auth(req.uri()) {
      req.headers_mut().insert(PROXY_AUTHORIZATION, auth.clone());
    }

    let uri = req.uri().clone();

    let resp = self
      .inner
      .oneshot(req)
      .await
      .map_err(|e| ClientSendError { uri, source: e })?;
    Ok(resp.map(|b| b.map_err(|e| deno_core::anyhow::anyhow!(e)).boxed()))
  }
}

pub type ReqBody =
  http_body_util::combinators::BoxBody<Bytes, deno_core::error::AnyError>;
pub type ResBody =
  http_body_util::combinators::BoxBody<Bytes, deno_core::error::AnyError>;

/// Copied from https://github.com/seanmonstar/reqwest/blob/b9d62a0323d96f11672a61a17bf8849baec00275/src/async_impl/request.rs#L572
/// Check the request URL for a "username:password" type authority, and if
/// found, remove it from the URL and return it.
pub fn extract_authority(url: &mut Url) -> Option<(String, Option<String>)> {
  use percent_encoding::percent_decode;

  if url.has_authority() {
    let username: String = percent_decode(url.username().as_bytes())
      .decode_utf8()
      .ok()?
      .into();
    let password = url.password().and_then(|pass| {
      percent_decode(pass.as_bytes())
        .decode_utf8()
        .ok()
        .map(String::from)
    });
    if !username.is_empty() || password.is_some() {
      url
        .set_username("")
        .expect("has_authority means set_username shouldn't fail");
      url
        .set_password(None)
        .expect("has_authority means set_password shouldn't fail");
      return Some((username, password));
    }
  }

  None
}

#[op2(fast)]
fn op_fetch_promise_is_settled(promise: v8::Local<v8::Promise>) -> bool {
  promise.state() != v8::PromiseState::Pending
}
