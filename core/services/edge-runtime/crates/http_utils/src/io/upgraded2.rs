// Copyright 2014-2021 Sean McArthur
// SPDX-License-Identifier: MIT

use std::fmt;
use std::io;
use std::pin::Pin;
use std::task::Context;
use std::task::Poll;

use bytes::Bytes;
use tokio::io::AsyncRead;
use tokio::io::AsyncWrite;
use tokio::io::ReadBuf;

use super::Rewind;

trait Io: AsyncRead + AsyncWrite + Unpin + 'static {}

impl<T: AsyncRead + AsyncWrite + Unpin + 'static> Io for T {}

pub struct Upgraded2 {
  io: Rewind<Box<dyn Io + Send>>,
}

impl Upgraded2 {
  pub fn new<T>(io: T, read_buf: Bytes) -> Self
  where
    T: AsyncRead + AsyncWrite + Unpin + Send + 'static,
  {
    Upgraded2 {
      io: Rewind::new_buffered(Box::new(io), read_buf),
    }
  }
}

impl AsyncRead for Upgraded2 {
  fn poll_read(
    mut self: Pin<&mut Self>,
    cx: &mut Context<'_>,
    buf: &mut ReadBuf<'_>,
  ) -> Poll<io::Result<()>> {
    Pin::new(&mut self.io).poll_read(cx, buf)
  }
}

impl AsyncWrite for Upgraded2 {
  fn poll_write(
    mut self: Pin<&mut Self>,
    cx: &mut Context<'_>,
    buf: &[u8],
  ) -> Poll<io::Result<usize>> {
    Pin::new(&mut self.io).poll_write(cx, buf)
  }

  fn poll_write_vectored(
    mut self: Pin<&mut Self>,
    cx: &mut Context<'_>,
    bufs: &[io::IoSlice<'_>],
  ) -> Poll<io::Result<usize>> {
    Pin::new(&mut self.io).poll_write_vectored(cx, bufs)
  }

  fn poll_flush(
    mut self: Pin<&mut Self>,
    cx: &mut Context<'_>,
  ) -> Poll<io::Result<()>> {
    Pin::new(&mut self.io).poll_flush(cx)
  }

  fn poll_shutdown(
    mut self: Pin<&mut Self>,
    cx: &mut Context<'_>,
  ) -> Poll<io::Result<()>> {
    Pin::new(&mut self.io).poll_shutdown(cx)
  }

  fn is_write_vectored(&self) -> bool {
    self.io.is_write_vectored()
  }
}

impl fmt::Debug for Upgraded2 {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.debug_struct("Upgraded2").finish()
  }
}
