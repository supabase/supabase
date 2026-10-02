// Copyright 2014-2021 Sean McArthur
// SPDX-License-Identifier: MIT

use std::cmp;
use std::io;
use std::marker::Unpin;
use std::pin::Pin;
use std::task::Context;
use std::task::Poll;

use bytes::Buf;
use bytes::Bytes;
use tokio::io::AsyncRead;
use tokio::io::AsyncWrite;
use tokio::io::ReadBuf;

/// Combine a buffer with an IO, rewinding reads to use the buffer.
#[derive(Debug)]
pub struct Rewind<T> {
  pre: Option<Bytes>,
  inner: T,
}

impl<T> Rewind<T> {
  pub fn new_buffered(io: T, buf: Bytes) -> Self {
    Rewind {
      pre: Some(buf),
      inner: io,
    }
  }
}

impl<T> AsyncRead for Rewind<T>
where
  T: AsyncRead + Unpin,
{
  fn poll_read(
    mut self: Pin<&mut Self>,
    cx: &mut Context<'_>,
    buf: &mut ReadBuf<'_>,
  ) -> Poll<io::Result<()>> {
    if let Some(mut prefix) = self.pre.take() {
      // If there are no remaining bytes, let the bytes get dropped.
      if !prefix.is_empty() {
        let copy_len = cmp::min(prefix.len(), buf.remaining());
        // TODO: There should be a way to do following two lines cleaner...
        buf.put_slice(&prefix[..copy_len]);
        prefix.advance(copy_len);
        // Put back what's left
        if !prefix.is_empty() {
          self.pre = Some(prefix);
        }

        return Poll::Ready(Ok(()));
      }
    }
    Pin::new(&mut self.inner).poll_read(cx, buf)
  }
}

impl<T> AsyncWrite for Rewind<T>
where
  T: AsyncWrite + Unpin,
{
  fn poll_write(
    mut self: Pin<&mut Self>,
    cx: &mut Context<'_>,
    buf: &[u8],
  ) -> Poll<io::Result<usize>> {
    Pin::new(&mut self.inner).poll_write(cx, buf)
  }

  fn poll_write_vectored(
    mut self: Pin<&mut Self>,
    cx: &mut Context<'_>,
    bufs: &[io::IoSlice<'_>],
  ) -> Poll<io::Result<usize>> {
    Pin::new(&mut self.inner).poll_write_vectored(cx, bufs)
  }

  fn poll_flush(
    mut self: Pin<&mut Self>,
    cx: &mut Context<'_>,
  ) -> Poll<io::Result<()>> {
    Pin::new(&mut self.inner).poll_flush(cx)
  }

  fn poll_shutdown(
    mut self: Pin<&mut Self>,
    cx: &mut Context<'_>,
  ) -> Poll<io::Result<()>> {
    Pin::new(&mut self.inner).poll_shutdown(cx)
  }

  fn is_write_vectored(&self) -> bool {
    self.inner.is_write_vectored()
  }
}
