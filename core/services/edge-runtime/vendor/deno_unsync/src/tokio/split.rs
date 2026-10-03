// Copyright 2018-2024 the Deno authors. MIT license.

use crate::UnsendMarker;
use std::cell::Cell;
use std::cell::UnsafeCell;
use std::pin::Pin;
use std::rc::Rc;
use std::task::Poll;

use tokio::io::AsyncRead;
use tokio::io::AsyncWrite;

/// Create a ![`Send`] I/O split on top of a stream. The split reader and writer halves are safe to use
/// only in a single-threaded context, and are not legal to send to another thread.
pub fn split_io<S>(stream: S) -> (IOReadHalf<S>, IOWriteHalf<S>)
where
  S: AsyncRead + AsyncWrite + Unpin,
{
  let is_write_vectored = stream.is_write_vectored();
  let stream = Rc::new(Split {
    stream: UnsafeCell::new(stream),
    lock: Cell::new(false),
  });
  (
    IOReadHalf {
      split: stream.clone(),
      _marker: UnsendMarker::default(),
    },
    IOWriteHalf {
      split: stream,
      is_write_vectored,
      _marker: UnsendMarker::default(),
    },
  )
}

struct Split<S> {
  stream: UnsafeCell<S>,
  lock: Cell<bool>,
}

pub struct IOReadHalf<S> {
  split: Rc<Split<S>>,
  _marker: UnsendMarker,
}

pub struct IOWriteHalf<S> {
  split: Rc<Split<S>>,
  is_write_vectored: bool,
  _marker: UnsendMarker,
}

impl<S> AsyncRead for IOReadHalf<S>
where
  S: AsyncRead + Unpin,
{
  fn poll_read(
    self: std::pin::Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
    buf: &mut tokio::io::ReadBuf<'_>,
  ) -> std::task::Poll<std::io::Result<()>> {
    let lock = &self.split.lock;
    if lock.clone().into_inner() {
      return Poll::Ready(Err(std::io::Error::new(
        std::io::ErrorKind::PermissionDenied,
        "Re-entrant read while writing",
      )));
    }
    lock.set(true);
    // SAFETY: This is !Send and the lock is set, so we can guarantee we won't get another &mut to the stream now
    let s = unsafe { self.split.stream.get().as_mut().unwrap() };
    let res = Pin::new(s).poll_read(cx, buf);
    lock.set(false);
    res
  }
}

impl<S> AsyncWrite for IOWriteHalf<S>
where
  S: AsyncWrite + Unpin,
{
  fn poll_flush(
    self: std::pin::Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> std::task::Poll<Result<(), std::io::Error>> {
    let lock = &self.split.lock;
    if lock.clone().into_inner() {
      return Poll::Ready(Err(std::io::Error::new(
        std::io::ErrorKind::PermissionDenied,
        "Re-entrant write while reading",
      )));
    }
    lock.set(true);
    // SAFETY: This is !Send and the lock is set, so we can guarantee we won't get another &mut to the stream now
    let s = unsafe { self.split.stream.get().as_mut().unwrap() };
    let res = Pin::new(s).poll_flush(cx);
    lock.set(false);
    res
  }

  fn poll_shutdown(
    self: std::pin::Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> std::task::Poll<Result<(), std::io::Error>> {
    let lock = &self.split.lock;
    if lock.clone().into_inner() {
      return Poll::Ready(Err(std::io::Error::new(
        std::io::ErrorKind::PermissionDenied,
        "Re-entrant write while reading",
      )));
    }
    lock.set(true);
    // SAFETY: This is !Send and the lock is set, so we can guarantee we won't get another &mut to the stream now
    let s = unsafe { self.split.stream.get().as_mut().unwrap() };
    let res = Pin::new(s).poll_shutdown(cx);
    lock.set(false);
    res
  }

  fn poll_write(
    self: std::pin::Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
    buf: &[u8],
  ) -> std::task::Poll<Result<usize, std::io::Error>> {
    let lock = &self.split.lock;
    if lock.clone().into_inner() {
      return Poll::Ready(Err(std::io::Error::new(
        std::io::ErrorKind::PermissionDenied,
        "Re-entrant write while reading",
      )));
    }
    lock.set(true);
    // SAFETY: This is !Send and the lock is set, so we can guarantee we won't get another &mut to the stream now
    let s = unsafe { self.split.stream.get().as_mut().unwrap() };
    let res = Pin::new(s).poll_write(cx, buf);
    lock.set(false);
    res
  }

  fn poll_write_vectored(
    self: std::pin::Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
    bufs: &[std::io::IoSlice<'_>],
  ) -> std::task::Poll<Result<usize, std::io::Error>> {
    let lock = &self.split.lock;
    if lock.clone().into_inner() {
      return Poll::Ready(Err(std::io::Error::new(
        std::io::ErrorKind::PermissionDenied,
        "Re-entrant write while reading",
      )));
    }
    lock.set(true);
    // SAFETY: This is !Send and the lock is set, so we can guarantee we won't get another &mut to the stream now
    let s = unsafe { self.split.stream.get().as_mut().unwrap() };
    let res = Pin::new(s).poll_write_vectored(cx, bufs);
    lock.set(false);
    res
  }

  fn is_write_vectored(&self) -> bool {
    self.is_write_vectored
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use tokio::io::AsyncReadExt;
  use tokio::io::AsyncWriteExt;

  #[tokio::test(flavor = "current_thread")]
  async fn split_duplex() {
    let (a, b) = tokio::io::duplex(1024);
    let (mut ar, mut aw) = split_io(a);
    let (mut br, mut bw) = split_io(b);

    bw.write_i8(123).await.unwrap();
    assert_eq!(ar.read_i8().await.unwrap(), 123);

    aw.write_i8(123).await.unwrap();
    assert_eq!(br.read_i8().await.unwrap(), 123);
  }
}
