// This implementation originated from the link below:
// https://gist.github.com/programatik29/36d371c657392fd7f322e7342957b6d1

use std::pin::Pin;
use std::task::ready;
use std::task::Poll;
use std::time::Duration;

use enum_as_inner::EnumAsInner;
use futures_util::Future;
use pin_project::pin_project;
use tokio::io::AsyncRead;
use tokio::io::AsyncWrite;
use tokio::sync::mpsc::UnboundedReceiver;
use tokio::sync::mpsc::UnboundedSender;
use tokio::sync::mpsc::{self};
use tokio::time::sleep;
use tokio::time::Instant;
use tokio::time::Sleep;

pub(super) enum State {
  Wait,
  Reset,
}

enum StreamKind {
  UseTimeout {
    sleep: Pin<Box<Sleep>>,
    duration: Duration,
    waiting: bool,
    finished: bool,
    rx: UnboundedReceiver<State>,
  },

  Bypass,
}

pub struct Stream<S> {
  inner: S,
  kind: StreamKind,
}

impl<S> Stream<S> {
  fn new(inner: S, kind: StreamKind) -> Self {
    Self { inner, kind }
  }

  pub(super) fn with_timeout(
    inner: S,
    duration: Duration,
  ) -> (Self, Option<UnboundedSender<State>>) {
    let (tx, rx) = mpsc::unbounded_channel();

    (
      Self::new(
        inner,
        StreamKind::UseTimeout {
          sleep: Box::pin(sleep(duration)),
          duration,
          waiting: false,
          finished: false,
          rx,
        },
      ),
      Some(tx),
    )
  }

  pub(super) fn with_bypass(
    inner: S,
  ) -> (Self, Option<UnboundedSender<State>>) {
    (Self::new(inner, StreamKind::Bypass), None)
  }
}

impl<S: AsyncRead + Unpin> AsyncRead for Stream<S> {
  fn poll_read(
    mut self: std::pin::Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
    buf: &mut tokio::io::ReadBuf<'_>,
  ) -> Poll<std::io::Result<()>> {
    match &mut self.kind {
      StreamKind::UseTimeout {
        sleep,
        duration,
        waiting,
        finished,
        rx,
      } => {
        if !*finished {
          match Pin::new(rx).poll_recv(cx) {
            Poll::Ready(Some(State::Reset)) => {
              *waiting = false;

              let deadline = Instant::now() + *duration;

              sleep.as_mut().reset(deadline);
            }

            // enter waiting mode (for response body last chunk)
            Poll::Ready(Some(State::Wait)) => *waiting = true,
            Poll::Ready(None) => *finished = true,
            Poll::Pending => (),
          }
        }

        if !*waiting {
          // return error if timer is elapsed
          if let Poll::Ready(()) = sleep.as_mut().poll(cx) {
            return Poll::Ready(Err(std::io::Error::new(
              std::io::ErrorKind::TimedOut,
              "request header read timed out",
            )));
          }
        }
      }

      StreamKind::Bypass => {}
    }

    Pin::new(&mut self.inner).poll_read(cx, buf)
  }
}

impl<S: AsyncWrite + Unpin> AsyncWrite for Stream<S> {
  fn poll_write(
    mut self: std::pin::Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
    buf: &[u8],
  ) -> Poll<Result<usize, std::io::Error>> {
    Pin::new(&mut self.inner).poll_write(cx, buf)
  }

  fn poll_flush(
    mut self: std::pin::Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> Poll<Result<(), std::io::Error>> {
    Pin::new(&mut self.inner).poll_flush(cx)
  }

  fn poll_shutdown(
    mut self: std::pin::Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> Poll<Result<(), std::io::Error>> {
    Pin::new(&mut self.inner).poll_shutdown(cx)
  }

  fn poll_write_vectored(
    mut self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
    bufs: &[std::io::IoSlice<'_>],
  ) -> Poll<Result<usize, std::io::Error>> {
    Pin::new(&mut self.inner).poll_write_vectored(cx, bufs)
  }

  fn is_write_vectored(&self) -> bool {
    self.inner.is_write_vectored()
  }
}

pub struct Service<S> {
  inner: S,
  tx: Option<UnboundedSender<State>>,
}

impl<S> Service<S> {
  pub(super) fn new(inner: S, tx: Option<UnboundedSender<State>>) -> Self {
    Self { inner, tx }
  }
}

impl<S, B, Request> hyper_v014::service::Service<Request> for Service<S>
where
  S: hyper_v014::service::Service<Request, Response = hyper_v014::Response<B>>,
{
  type Response = hyper_v014::Response<Body<B>>;
  type Error = S::Error;
  type Future = ServiceFuture<S::Future>;

  fn poll_ready(
    &mut self,
    cx: &mut std::task::Context<'_>,
  ) -> Poll<Result<(), Self::Error>> {
    self.inner.poll_ready(cx)
  }

  fn call(&mut self, req: Request) -> Self::Future {
    if let Some(tx) = self.tx.as_ref() {
      // send timer wait signal
      let _ = tx.send(State::Wait);
    }

    ServiceFuture::new(self.inner.call(req), self.tx.clone())
  }
}

#[pin_project]
pub struct ServiceFuture<F> {
  #[pin]
  inner: F,
  tx: Option<UnboundedSender<State>>,
}

impl<F> ServiceFuture<F> {
  fn new(inner: F, tx: Option<UnboundedSender<State>>) -> Self {
    Self { inner, tx }
  }
}

impl<F, B, Error> Future for ServiceFuture<F>
where
  F: Future<Output = Result<hyper_v014::Response<B>, Error>>,
{
  type Output = Result<hyper_v014::Response<Body<B>>, Error>;

  fn poll(
    self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> Poll<Self::Output> {
    let this = self.project();

    this.inner.poll(cx).map(|result| {
      result
        .map(|response| response.map(|body| Body::new(body, this.tx.take())))
    })
  }
}

#[pin_project]
pub struct Body<B> {
  #[pin]
  inner: B,
  tx: Option<UnboundedSender<State>>,
}

impl<B> Body<B> {
  fn new(inner: B, tx: Option<UnboundedSender<State>>) -> Self {
    Self { inner, tx }
  }
}

impl<B> hyper_v014::body::HttpBody for Body<B>
where
  B: hyper_v014::body::HttpBody,
{
  type Data = B::Data;
  type Error = B::Error;

  fn poll_data(
    self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> Poll<Option<Result<Self::Data, Self::Error>>> {
    let this = self.project();

    if let Some(tx) = this.tx.as_ref() {
      let option = ready!(this.inner.poll_data(cx));

      if option.is_none() {
        let _ = tx.send(State::Reset);
      }

      Poll::Ready(option)
    } else {
      this.inner.poll_data(cx)
    }
  }

  fn poll_trailers(
    self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> Poll<Result<Option<http_v02::HeaderMap>, Self::Error>> {
    self.project().inner.poll_trailers(cx)
  }

  fn is_end_stream(&self) -> bool {
    if let Some(tx) = self.tx.as_ref() {
      let is_end_stream = self.inner.is_end_stream();

      if is_end_stream {
        let _ = tx.send(State::Reset);
      }

      is_end_stream
    } else {
      self.inner.is_end_stream()
    }
  }

  fn size_hint(&self) -> hyper_v014::body::SizeHint {
    self.inner.size_hint()
  }
}

pub(crate) struct CancelOnWriteTimeout<S> {
  inner: S,
  duration: Duration,
  sleep: Pin<Box<Sleep>>,
}

impl<S: futures_util::Stream + Unpin> futures_util::Stream
  for CancelOnWriteTimeout<S>
{
  type Item = S::Item;

  fn poll_next(
    mut self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> Poll<Option<Self::Item>> {
    match Pin::new(&mut self.inner).poll_next(cx) {
      Poll::Ready(v) => {
        let deadline = Instant::now() + self.duration;

        self.sleep.as_mut().reset(deadline);

        Poll::Ready(v)
      }

      Poll::Pending => {
        if let Poll::Ready(()) = self.sleep.as_mut().poll(cx) {
          return Poll::Ready(None);
        }

        Poll::Pending
      }
    }
  }

  fn size_hint(&self) -> (usize, Option<usize>) {
    self.inner.size_hint()
  }
}

impl<S> CancelOnWriteTimeout<S> {
  pub(crate) fn new(inner: S, duration: Duration) -> Self {
    Self {
      inner,
      duration,
      sleep: Box::pin(sleep(duration)),
    }
  }
}

#[derive(EnumAsInner)]
pub(crate) enum ReadTimeoutOp {
  UseTimeout {
    duration: Duration,
    sleep: Pin<Box<Sleep>>,
  },

  Bypass,
}

pub(crate) struct ReadTimeoutStream<S> {
  inner: S,
  op: ReadTimeoutOp,
}

impl<S> AsyncRead for ReadTimeoutStream<S>
where
  S: AsyncRead + Unpin,
{
  fn poll_read(
    mut self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
    buf: &mut tokio::io::ReadBuf<'_>,
  ) -> Poll<std::io::Result<()>> {
    match Pin::new(&mut self.inner).poll_read(cx, buf) {
      Poll::Ready(v) => {
        if self.op.is_bypass() {
          return Poll::Ready(v);
        }

        let (duration, sleep) = self.op.as_use_timeout_mut().unwrap();

        let deadline = Instant::now() + *duration;

        sleep.as_mut().reset(deadline);

        Poll::Ready(v)
      }

      Poll::Pending => {
        if let Some((_, sleep)) = self.op.as_use_timeout_mut() {
          if let Poll::Ready(()) = sleep.as_mut().poll(cx) {
            return Poll::Ready(Err(std::io::Error::new(
              std::io::ErrorKind::TimedOut,
              "socket timed out",
            )));
          }
        }

        Poll::Pending
      }
    }
  }
}

impl<S> AsyncWrite for ReadTimeoutStream<S>
where
  S: AsyncWrite + Unpin,
{
  fn poll_write(
    mut self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
    buf: &[u8],
  ) -> Poll<Result<usize, std::io::Error>> {
    Pin::new(&mut self.inner).poll_write(cx, buf)
  }

  fn poll_write_vectored(
    mut self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
    bufs: &[std::io::IoSlice<'_>],
  ) -> Poll<Result<usize, std::io::Error>> {
    Pin::new(&mut self.inner).poll_write_vectored(cx, bufs)
  }

  fn poll_flush(
    mut self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> Poll<Result<(), std::io::Error>> {
    Pin::new(&mut self.inner).poll_flush(cx)
  }

  fn poll_shutdown(
    mut self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> Poll<Result<(), std::io::Error>> {
    Pin::new(&mut self.inner).poll_shutdown(cx)
  }

  fn is_write_vectored(&self) -> bool {
    self.inner.is_write_vectored()
  }
}

impl<S> ReadTimeoutStream<S> {
  pub(crate) fn new(inner: S, kind: ReadTimeoutOp) -> Self {
    Self { inner, op: kind }
  }

  pub(crate) fn with_timeout(inner: S, duration: Duration) -> Self {
    Self::new(
      inner,
      ReadTimeoutOp::UseTimeout {
        duration,
        sleep: Box::pin(sleep(duration)),
      },
    )
  }

  pub(crate) fn with_bypass(inner: S) -> Self {
    Self::new(inner, ReadTimeoutOp::Bypass)
  }
}
