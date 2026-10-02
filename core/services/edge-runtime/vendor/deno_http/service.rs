// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
use crate::request_properties::HttpConnectionProperties;
use crate::response_body::ResponseBytesInner;
use crate::response_body::ResponseStreamResult;
use deno_core::futures::ready;
use deno_core::BufView;
use deno_core::OpState;
use deno_core::ResourceId;
use http::request::Parts;
use hyper::body::Body;
use hyper::body::Frame;
use hyper::body::Incoming;
use hyper::body::SizeHint;
use hyper::header::HeaderMap;
use hyper::upgrade::OnUpgrade;

use scopeguard::guard;
use scopeguard::ScopeGuard;
use std::cell::Cell;
use std::cell::Ref;
use std::cell::RefCell;
use std::cell::RefMut;
use std::future::Future;
use std::mem::ManuallyDrop;
use std::pin::Pin;
use std::rc::Rc;
use std::task::Context;
use std::task::Poll;
use std::task::Waker;
use tokio::sync::oneshot;

pub type Request = hyper::Request<Incoming>;
pub type Response = hyper::Response<HttpRecordResponse>;

#[cfg(feature = "__http_tracing")]
pub static RECORD_COUNT: std::sync::atomic::AtomicUsize =
  std::sync::atomic::AtomicUsize::new(0);

macro_rules! http_general_trace {
  ($($args:expr),*) => {
    #[cfg(feature = "__http_tracing")]
    {
      let count = $crate::service::RECORD_COUNT
        .load(std::sync::atomic::Ordering::SeqCst);

      println!(
        "HTTP [+{count}]: {}",
        format!($($args),*),
      );
    }
  };
}

macro_rules! http_trace {
  ($record:expr $(, $args:expr)*) => {
    #[cfg(feature = "__http_tracing")]
    {
      let count = $crate::service::RECORD_COUNT
        .load(std::sync::atomic::Ordering::SeqCst);

      println!(
        "HTTP [+{count}] id={:p} strong={}: {}",
        $record,
        std::rc::Rc::strong_count(&$record),
        format!($($args),*),
      );
    }
  };
}

pub(crate) use http_general_trace;
pub(crate) use http_trace;

pub(crate) struct HttpServerStateInner {
  pool: Vec<(Rc<HttpRecord>, HeaderMap)>,
}

/// A signalling version of `Rc` that allows one to poll for when all other references
/// to the `Rc` have been dropped.
#[repr(transparent)]
pub(crate) struct SignallingRc<T>(Rc<(T, Cell<Option<Waker>>)>);

impl<T> SignallingRc<T> {
  #[inline]
  pub fn new(t: T) -> Self {
    Self(Rc::new((t, Default::default())))
  }

  #[inline]
  pub fn strong_count(&self) -> usize {
    Rc::strong_count(&self.0)
  }

  /// Resolves when this is the only remaining reference.
  #[inline]
  pub fn poll_complete(&self, cx: &mut Context<'_>) -> Poll<()> {
    if Rc::strong_count(&self.0) == 1 {
      Poll::Ready(())
    } else {
      self.0 .1.set(Some(cx.waker().clone()));
      Poll::Pending
    }
  }
}

impl<T> Clone for SignallingRc<T> {
  #[inline]
  fn clone(&self) -> Self {
    Self(self.0.clone())
  }
}

impl<T> Drop for SignallingRc<T> {
  #[inline]
  fn drop(&mut self) {
    // Trigger the waker iff the refcount is about to become 1.
    if Rc::strong_count(&self.0) == 2 {
      if let Some(waker) = self.0 .1.take() {
        waker.wake();
      }
    }
  }
}

impl<T> std::ops::Deref for SignallingRc<T> {
  type Target = T;
  #[inline]
  fn deref(&self) -> &Self::Target {
    &self.0 .0
  }
}

pub(crate) struct HttpServerState(RefCell<HttpServerStateInner>);

impl HttpServerState {
  pub fn new() -> SignallingRc<Self> {
    SignallingRc::new(Self(RefCell::new(HttpServerStateInner {
      pool: Vec::new(),
    })))
  }
}

impl std::ops::Deref for HttpServerState {
  type Target = RefCell<HttpServerStateInner>;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

enum RequestBodyState {
  Incoming(Incoming),
  Resource(#[allow(dead_code)] HttpRequestBodyAutocloser),
}

impl From<Incoming> for RequestBodyState {
  fn from(value: Incoming) -> Self {
    RequestBodyState::Incoming(value)
  }
}

/// Ensures that the request body closes itself when no longer needed.
pub struct HttpRequestBodyAutocloser(ResourceId, Rc<RefCell<OpState>>);

impl HttpRequestBodyAutocloser {
  pub fn new(res: ResourceId, op_state: Rc<RefCell<OpState>>) -> Self {
    Self(res, op_state)
  }
}

impl Drop for HttpRequestBodyAutocloser {
  fn drop(&mut self) {
    if let Ok(res) = self.1.borrow_mut().resource_table.take_any(self.0) {
      res.close();
    }
  }
}

pub(crate) async fn handle_request(
  request: Request,
  request_info: HttpConnectionProperties,
  server_state: SignallingRc<HttpServerState>, // Keep server alive for duration of this future.
  tx: tokio::sync::mpsc::Sender<Rc<HttpRecord>>,
) -> Result<Response, hyper_v014::Error> {
  // If the underlying TCP connection is closed, this future will be dropped
  // and execution could stop at any await point.
  // The HttpRecord must live until JavaScript is done processing so is wrapped
  // in an Rc. The guard ensures unneeded resources are freed at cancellation.
  let guarded_record = guard(
    HttpRecord::new(request, request_info, server_state),
    HttpRecord::cancel,
  );

  // Clone HttpRecord and send to JavaScript for processing.
  // Safe to unwrap as channel receiver is never closed.
  tx.send(guarded_record.clone()).await.unwrap();

  // Wait for JavaScript handler to return request.
  http_trace!(*guarded_record, "handle_request response_ready.await");
  guarded_record.response_ready().await;

  // Defuse the guard. Must not await after this point.
  let record = ScopeGuard::into_inner(guarded_record);
  http_trace!(record, "handle_request complete");
  let response = record.into_response();
  Ok(response)
}

#[derive(Debug, thiserror::Error)]
#[error("upgrade unavailable")]
pub struct UpgradeUnavailableError;

struct HttpRecordInner {
  server_state: SignallingRc<HttpServerState>,
  closed_channel: Option<oneshot::Sender<()>>,
  request_info: HttpConnectionProperties,
  request_parts: http::request::Parts,
  request_body: Option<RequestBodyState>,
  response_parts: Option<http::response::Parts>,
  response_ready: bool,
  response_waker: Option<Waker>,
  response_body: ResponseBytesInner,
  response_body_finished: bool,
  response_body_waker: Option<Waker>,
  trailers: Option<HeaderMap>,
  been_dropped: bool,
  finished: bool,
  needs_close_after_finish: bool,
}

pub struct HttpRecord(RefCell<Option<HttpRecordInner>>);

#[cfg(feature = "__http_tracing")]
impl Drop for HttpRecord {
  fn drop(&mut self) {
    RECORD_COUNT
      .fetch_sub(1, std::sync::atomic::Ordering::SeqCst)
      .checked_sub(1)
      .expect("Count went below zero");
    http_general_trace!("HttpRecord::drop");
  }
}

impl HttpRecord {
  fn new(
    request: Request,
    request_info: HttpConnectionProperties,
    server_state: SignallingRc<HttpServerState>,
  ) -> Rc<Self> {
    let (request_parts, request_body) = request.into_parts();
    let request_body = Some(request_body.into());
    let (mut response_parts, _) = http::Response::new(()).into_parts();
    let record =
      if let Some((record, headers)) = server_state.borrow_mut().pool.pop() {
        response_parts.headers = headers;
        http_trace!(record, "HttpRecord::reuse");
        record
      } else {
        #[cfg(feature = "__http_tracing")]
        {
          RECORD_COUNT.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        }

        #[allow(clippy::let_and_return)]
        let record = Rc::new(Self(RefCell::new(None)));
        http_trace!(record, "HttpRecord::new");
        record
      };
    *record.0.borrow_mut() = Some(HttpRecordInner {
      server_state,
      request_info,
      request_parts,
      request_body,
      response_parts: Some(response_parts),
      response_ready: false,
      response_waker: None,
      response_body: ResponseBytesInner::Empty,
      response_body_finished: false,
      response_body_waker: None,
      trailers: None,
      closed_channel: None,
      been_dropped: false,
      finished: false,
      needs_close_after_finish: false,
    });
    record
  }

  fn finish(self: Rc<Self>) {
    http_trace!(self, "HttpRecord::finish");
    let mut inner = self.self_mut();
    inner.response_body_finished = true;
    let response_body_waker = inner.response_body_waker.take();
    let needs_close_after_finish = inner.needs_close_after_finish;
    drop(inner);
    if let Some(waker) = response_body_waker {
      waker.wake();
    }
    if !needs_close_after_finish {
      self.recycle();
    }
  }

  pub fn close_after_finish(self: Rc<Self>) {
    debug_assert!(self.self_ref().needs_close_after_finish);
    let mut inner = self.self_mut();
    inner.needs_close_after_finish = false;
    if !inner.finished {
      drop(inner);
      self.recycle();
    }
  }

  pub fn needs_close_after_finish(&self) -> RefMut<'_, bool> {
    RefMut::map(self.self_mut(), |inner| &mut inner.needs_close_after_finish)
  }

  pub fn on_cancel(&self, sender: oneshot::Sender<()>) {
    self.self_mut().closed_channel = Some(sender);
  }

  fn recycle(self: Rc<Self>) {
    assert!(
      Rc::strong_count(&self) == 1,
      "HTTP state error: Expected to be last strong reference"
    );
    let HttpRecordInner {
      server_state,
      request_parts: Parts { mut headers, .. },
      ..
    } = self.0.borrow_mut().take().unwrap();

    let inflight = server_state.strong_count();
    http_trace!(self, "HttpRecord::recycle inflight={}", inflight);

    // Keep a buffer of allocations on hand to be reused by incoming requests.
    // Estimated target size is 16 + 1/8 the number of inflight requests.
    let target = 16 + (inflight >> 3);
    let pool = &mut server_state.borrow_mut().pool;
    if target > pool.len() {
      headers.clear();
      pool.push((self, headers));
    } else if target < pool.len() - 8 {
      pool.truncate(target);
    }
  }

  fn self_ref(&self) -> Ref<'_, HttpRecordInner> {
    Ref::map(self.0.borrow(), |option| option.as_ref().unwrap())
  }

  fn self_mut(&self) -> RefMut<'_, HttpRecordInner> {
    RefMut::map(self.0.borrow_mut(), |option| option.as_mut().unwrap())
  }

  /// Perform the Hyper upgrade on this record.
  pub fn upgrade(&self) -> Result<OnUpgrade, UpgradeUnavailableError> {
    // Manually perform the upgrade. We're peeking into hyper's underlying machinery here a bit
    self
      .self_mut()
      .request_parts
      .extensions
      .remove::<OnUpgrade>()
      .ok_or(UpgradeUnavailableError)
  }

  /// Take the Hyper body from this record.
  pub fn take_request_body(&self) -> Option<Incoming> {
    let body_holder = &mut self.self_mut().request_body;
    let body = body_holder.take();
    match body {
      Some(RequestBodyState::Incoming(body)) => Some(body),
      x => {
        *body_holder = x;
        None
      }
    }
  }

  /// Replace the request body with a resource ID and the OpState we'll need to shut it down.
  /// We cannot keep just the resource itself, as JS code might be reading from the resource ID
  /// to generate the response data (requiring us to keep it in the resource table).
  pub fn put_resource(&self, res: HttpRequestBodyAutocloser) {
    self.self_mut().request_body = Some(RequestBodyState::Resource(res));
  }

  /// Cleanup resources not needed after the future is dropped.
  fn cancel(self: Rc<Self>) {
    http_trace!(self, "HttpRecord::cancel");
    let mut inner = self.self_mut();
    if inner.response_ready {
      // Future dropped between wake() and async fn resuming.
      drop(inner);
      self.finish();
      return;
    }
    inner.been_dropped = true;
    // The request body might include actual resources.
    inner.request_body.take();
    if let Some(closed_channel) = inner.closed_channel.take() {
      let _ = closed_channel.send(());
    }
  }

  /// Complete this record, potentially expunging it if it is fully complete (ie: cancelled as well).
  pub fn complete(self: Rc<Self>) {
    http_trace!(self, "HttpRecord::complete");
    let mut inner = self.self_mut();
    assert!(
      !inner.response_ready,
      "HTTP state error: Entry has already been completed"
    );
    if inner.been_dropped {
      drop(inner);
      self.finish();
      return;
    }
    inner.response_ready = true;
    if let Some(waker) = inner.response_waker.take() {
      drop(inner);
      waker.wake();
    }
  }

  fn take_response_body(&self) -> ResponseBytesInner {
    let mut inner = self.self_mut();
    debug_assert!(
      !matches!(inner.response_body, ResponseBytesInner::Done),
      "HTTP state error: response body already complete"
    );
    std::mem::replace(&mut inner.response_body, ResponseBytesInner::Done)
  }

  /// Has the future for this record been dropped? ie, has the underlying TCP connection
  /// been closed?
  pub fn cancelled(&self) -> bool {
    self.self_ref().been_dropped
  }

  /// Get a mutable reference to the response status and headers.
  pub fn response_parts(&self) -> RefMut<'_, http::response::Parts> {
    RefMut::map(self.self_mut(), |inner| {
      inner.response_parts.as_mut().unwrap()
    })
  }

  /// Get a mutable reference to the trailers.
  pub fn trailers(&self) -> RefMut<'_, Option<HeaderMap>> {
    RefMut::map(self.self_mut(), |inner| &mut inner.trailers)
  }

  pub fn set_response_body(&self, response_body: ResponseBytesInner) {
    let mut inner = self.self_mut();
    debug_assert!(matches!(inner.response_body, ResponseBytesInner::Empty));
    inner.response_body = response_body;
  }

  /// Take the response.
  fn into_response(self: Rc<Self>) -> Response {
    let parts = self.self_mut().response_parts.take().unwrap();
    let body = HttpRecordResponse(ManuallyDrop::new(self));
    Response::from_parts(parts, body)
  }

  /// Get a reference to the connection properties.
  pub fn request_info(&self) -> Ref<'_, HttpConnectionProperties> {
    Ref::map(self.self_ref(), |inner| &inner.request_info)
  }

  /// Get a reference to the request parts.
  pub fn request_parts(&self) -> Ref<'_, Parts> {
    Ref::map(self.self_ref(), |inner| &inner.request_parts)
  }

  /// Resolves when response head is ready.
  fn response_ready(&self) -> impl Future<Output = ()> + '_ {
    struct HttpRecordReady<'a>(&'a HttpRecord);

    impl<'a> Future for HttpRecordReady<'a> {
      type Output = ();

      fn poll(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
      ) -> Poll<Self::Output> {
        let mut mut_self = self.0.self_mut();
        if mut_self.response_ready {
          return Poll::Ready(());
        }
        mut_self.response_waker = Some(cx.waker().clone());
        Poll::Pending
      }
    }

    HttpRecordReady(self)
  }

  /// Resolves when response body has finished streaming. Returns true if the
  /// response completed.
  pub fn response_body_finished(&self) -> impl Future<Output = bool> + '_ {
    struct HttpRecordFinished<'a>(&'a HttpRecord);

    impl<'a> Future for HttpRecordFinished<'a> {
      type Output = bool;

      fn poll(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
      ) -> Poll<Self::Output> {
        let mut mut_self = self.0.self_mut();
        if mut_self.response_body_finished {
          // If we sent the response body and the trailers, this body completed successfully
          return Poll::Ready(
            mut_self.response_body.is_complete() && mut_self.trailers.is_none(),
          );
        }
        mut_self.response_body_waker = Some(cx.waker().clone());
        Poll::Pending
      }
    }

    HttpRecordFinished(self)
  }
}

#[repr(transparent)]
pub struct HttpRecordResponse(ManuallyDrop<Rc<HttpRecord>>);

impl Body for HttpRecordResponse {
  type Data = BufView;
  type Error = deno_core::error::AnyError;

  fn poll_frame(
    self: Pin<&mut Self>,
    cx: &mut Context<'_>,
  ) -> Poll<Option<Result<Frame<Self::Data>, Self::Error>>> {
    use crate::response_body::PollFrame;
    let record = &self.0;

    let res = loop {
      let mut inner = record.self_mut();
      let res = match &mut inner.response_body {
        ResponseBytesInner::Done | ResponseBytesInner::Empty => {
          if let Some(trailers) = inner.trailers.take() {
            return Poll::Ready(Some(Ok(Frame::trailers(trailers))));
          }
          unreachable!()
        }
        ResponseBytesInner::Bytes(..) => {
          drop(inner);
          let ResponseBytesInner::Bytes(data) = record.take_response_body()
          else {
            unreachable!();
          };
          return Poll::Ready(Some(Ok(Frame::data(data))));
        }
        ResponseBytesInner::UncompressedStream(stm) => {
          ready!(Pin::new(stm).poll_frame(cx))
        }
        ResponseBytesInner::GZipStream(stm) => {
          ready!(Pin::new(stm.as_mut()).poll_frame(cx))
        }
        ResponseBytesInner::BrotliStream(stm) => {
          ready!(Pin::new(stm.as_mut()).poll_frame(cx))
        }
      };
      // This is where we retry the NoData response
      if matches!(res, ResponseStreamResult::NoData) {
        continue;
      }
      break res;
    };

    if matches!(res, ResponseStreamResult::EndOfStream) {
      if let Some(trailers) = record.self_mut().trailers.take() {
        return Poll::Ready(Some(Ok(Frame::trailers(trailers))));
      }
      record.take_response_body();
    }
    Poll::Ready(res.into())
  }

  fn is_end_stream(&self) -> bool {
    let inner = self.0.self_ref();
    matches!(
      inner.response_body,
      ResponseBytesInner::Done | ResponseBytesInner::Empty
    ) && inner.trailers.is_none()
  }

  fn size_hint(&self) -> SizeHint {
    // The size hint currently only used in the case where it is exact bounds in hyper, but we'll pass it through
    // anyways just in case hyper needs it.
    self.0.self_ref().response_body.size_hint()
  }
}

impl Drop for HttpRecordResponse {
  fn drop(&mut self) {
    // SAFETY: this ManuallyDrop is not used again.
    let record = unsafe { ManuallyDrop::take(&mut self.0) };
    http_trace!(record, "HttpRecordResponse::drop");
    record.finish();
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::response_body::Compression;
  use crate::response_body::ResponseBytesInner;
  use bytes::Buf;
  use deno_net::raw::NetworkStreamType;
  use hyper::body::Body;
  use hyper::service::service_fn;
  use hyper::service::HttpService;
  use hyper_util::rt::TokioIo;
  use std::error::Error as StdError;

  /// Execute client request on service and concurrently map the response.
  async fn serve_request<B, S, T, F>(
    req: http::Request<B>,
    service: S,
    map_response: impl FnOnce(hyper::Response<Incoming>) -> F,
  ) -> hyper::Result<T>
  where
    B: Body + Send + 'static, // Send bound due to DuplexStream
    B::Data: Send,
    B::Error: Into<Box<dyn StdError + Send + Sync>>,
    S: HttpService<Incoming>,
    S::Error: Into<Box<dyn StdError + Send + Sync>>,
    S::ResBody: 'static,
    <S::ResBody as Body>::Error: Into<Box<dyn StdError + Send + Sync>>,
    F: std::future::Future<Output = hyper::Result<T>>,
  {
    use hyper::client::conn::http1::handshake;
    use hyper::server::conn::http1::Builder;
    let (stream_client, stream_server) = tokio::io::duplex(16 * 1024);
    let conn_server =
      Builder::new().serve_connection(TokioIo::new(stream_server), service);
    let (mut sender, conn_client) =
      handshake(TokioIo::new(stream_client)).await?;

    let (res, _, _) = tokio::try_join!(
      async move {
        let res = sender.send_request(req).await?;
        map_response(res).await
      },
      conn_server,
      conn_client,
    )?;
    Ok(res)
  }

  #[tokio::test]
  async fn test_handle_request() -> Result<(), deno_core::error::AnyError> {
    let (tx, mut rx) = tokio::sync::mpsc::channel(10);
    let server_state = HttpServerState::new();
    let server_state_check = server_state.clone();
    let request_info = HttpConnectionProperties {
      peer_address: "".into(),
      peer_port: None,
      local_port: None,
      stream_type: NetworkStreamType::Tcp,
    };
    let svc = service_fn(move |req: hyper::Request<Incoming>| {
      handle_request(
        req,
        request_info.clone(),
        server_state.clone(),
        tx.clone(),
      )
    });

    let client_req = http::Request::builder().uri("/").body("".to_string())?;

    // Response produced by concurrent tasks
    tokio::try_join!(
      async move {
        // JavaScript handler produces response
        let record = rx.recv().await.unwrap();
        record.set_response_body(ResponseBytesInner::from_vec(
          Compression::None,
          b"hello world".to_vec(),
        ));
        record.complete();
        Ok(())
      },
      // Server connection executes service
      async move {
        serve_request(client_req, svc, |res| async {
          // Client reads the response
          use http_body_util::BodyExt;
          assert_eq!(res.status(), 200);
          let body = res.collect().await?.to_bytes();
          assert_eq!(body.chunk(), b"hello world");
          Ok(())
        })
        .await
      },
    )?;
    assert_eq!(server_state_check.strong_count(), 1);
    Ok(())
  }
}
