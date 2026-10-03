// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::pin::Pin;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::task::Context;
use std::task::Poll;

use bytes::Bytes;
use deno_core::futures::Stream;
use pin_project::pin_project;
use tokio::io::AsyncRead;
use tokio_util::io::ReaderStream;

/// [ExternallyAbortableByteStream] adapts a [tokio::AsyncRead] into a [Stream].
/// It is used to bridge between the HTTP response body resource, and
/// `hyper::Body`. The stream has the special property that it errors if the
/// underlying reader is closed before an explicit EOF is sent (in the form of
/// setting the `shutdown` flag to true).
#[pin_project]
pub struct ExternallyAbortableReaderStream<R: AsyncRead> {
  #[pin]
  inner: ReaderStream<R>,
  done: Arc<AtomicBool>,
}

pub struct ShutdownHandle(Arc<AtomicBool>);

impl ShutdownHandle {
  pub fn shutdown(&self) {
    self.0.store(true, std::sync::atomic::Ordering::SeqCst);
  }
}

impl<R: AsyncRead> ExternallyAbortableReaderStream<R> {
  pub fn new(reader: R) -> (Self, ShutdownHandle) {
    let done = Arc::new(AtomicBool::new(false));
    let this = Self {
      inner: ReaderStream::new(reader),
      done: done.clone(),
    };
    (this, ShutdownHandle(done))
  }
}

impl<R: AsyncRead> Stream for ExternallyAbortableReaderStream<R> {
  type Item = std::io::Result<Bytes>;

  fn poll_next(
    self: Pin<&mut Self>,
    cx: &mut Context<'_>,
  ) -> Poll<Option<Self::Item>> {
    let this = self.project();
    let val = std::task::ready!(this.inner.poll_next(cx));
    match val {
      None if this.done.load(Ordering::SeqCst) => Poll::Ready(None),
      None => Poll::Ready(Some(Err(std::io::Error::new(
        std::io::ErrorKind::UnexpectedEof,
        "stream reader has shut down",
      )))),
      Some(val) => Poll::Ready(Some(val)),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use bytes::Bytes;
  use deno_core::futures::StreamExt;
  use tokio::io::AsyncWriteExt;

  #[tokio::test]
  async fn success() {
    let (a, b) = tokio::io::duplex(64 * 1024);
    let (reader, _) = tokio::io::split(a);
    let (_, mut writer) = tokio::io::split(b);

    let (mut stream, shutdown_handle) =
      ExternallyAbortableReaderStream::new(reader);

    writer.write_all(b"hello").await.unwrap();
    assert_eq!(stream.next().await.unwrap().unwrap(), Bytes::from("hello"));

    writer.write_all(b"world").await.unwrap();
    assert_eq!(stream.next().await.unwrap().unwrap(), Bytes::from("world"));

    shutdown_handle.shutdown();
    writer.shutdown().await.unwrap();
    drop(writer);
    assert!(stream.next().await.is_none());
  }

  #[tokio::test]
  async fn error() {
    let (a, b) = tokio::io::duplex(64 * 1024);
    let (reader, _) = tokio::io::split(a);
    let (_, mut writer) = tokio::io::split(b);

    let (mut stream, _shutdown_handle) =
      ExternallyAbortableReaderStream::new(reader);

    writer.write_all(b"hello").await.unwrap();
    assert_eq!(stream.next().await.unwrap().unwrap(), Bytes::from("hello"));

    drop(writer);
    assert_eq!(
      stream.next().await.unwrap().unwrap_err().kind(),
      std::io::ErrorKind::UnexpectedEof
    );
  }

  #[tokio::test]
  async fn error2() {
    let (a, b) = tokio::io::duplex(64 * 1024);
    let (reader, _) = tokio::io::split(a);
    let (_, mut writer) = tokio::io::split(b);

    let (mut stream, _shutdown_handle) =
      ExternallyAbortableReaderStream::new(reader);

    writer.write_all(b"hello").await.unwrap();
    assert_eq!(stream.next().await.unwrap().unwrap(), Bytes::from("hello"));

    writer.shutdown().await.unwrap();
    drop(writer);
    assert_eq!(
      stream.next().await.unwrap().unwrap_err().kind(),
      std::io::ErrorKind::UnexpectedEof
    );
  }

  #[tokio::test]
  async fn write_after_shutdown() {
    let (a, b) = tokio::io::duplex(64 * 1024);
    let (reader, _) = tokio::io::split(a);
    let (_, mut writer) = tokio::io::split(b);

    let (mut stream, shutdown_handle) =
      ExternallyAbortableReaderStream::new(reader);

    writer.write_all(b"hello").await.unwrap();
    assert_eq!(stream.next().await.unwrap().unwrap(), Bytes::from("hello"));

    writer.write_all(b"world").await.unwrap();
    assert_eq!(stream.next().await.unwrap().unwrap(), Bytes::from("world"));

    shutdown_handle.shutdown();
    writer.shutdown().await.unwrap();

    assert!(writer.write_all(b"!").await.is_err());

    drop(writer);
    assert!(stream.next().await.is_none());
  }
}
