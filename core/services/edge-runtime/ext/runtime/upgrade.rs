// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
#![allow(unused)]

use std::borrow::Cow;
use std::marker::PhantomData;
use std::pin::Pin;
use std::rc::Rc;

use bytes::Bytes;
use bytes::BytesMut;
use deno_core::error::custom_error;
use deno_core::error::AnyError;
use deno_core::AsyncRefCell;
use deno_core::AsyncResult;
use deno_core::CancelHandle;
use deno_core::CancelTryFuture;
use deno_core::RcRef;
use deno_core::Resource;
use httparse::Status;
use hyper::header::HeaderName;
use hyper::header::HeaderValue;
use hyper::Response;
use memmem::Searcher;
use memmem::TwoWaySearcher;
use once_cell::sync::OnceCell;
use tokio::io::AsyncReadExt;
use tokio::io::AsyncWriteExt;

pub(crate) struct UpgradeStream {
  read: AsyncRefCell<tokio::io::ReadHalf<tokio::io::DuplexStream>>,
  write: AsyncRefCell<tokio::io::WriteHalf<tokio::io::DuplexStream>>,
  cancel_handle: CancelHandle,
}

impl Resource for UpgradeStream {
  fn name(&self) -> Cow<'_, str> {
    "httpRawUpgradeStream2".into()
  }

  deno_core::impl_readable_byob!();
  deno_core::impl_writable!();

  fn close(self: Rc<Self>) {
    self.cancel_handle.cancel();
  }
}

impl UpgradeStream {
  pub fn new(
    read: tokio::io::ReadHalf<tokio::io::DuplexStream>,
    write: tokio::io::WriteHalf<tokio::io::DuplexStream>,
  ) -> Self {
    Self {
      read: AsyncRefCell::new(read),
      write: AsyncRefCell::new(write),
      cancel_handle: CancelHandle::new(),
    }
  }

  async fn read(self: Rc<Self>, buf: &mut [u8]) -> Result<usize, AnyError> {
    let cancel_handle = RcRef::map(self.clone(), |this| &this.cancel_handle);
    async {
      let read = RcRef::map(self, |this| &this.read);
      let mut read = read.borrow_mut().await;
      Ok(Pin::new(&mut *read).read(buf).await?)
    }
    .try_or_cancel(cancel_handle)
    .await
  }

  async fn write(self: Rc<Self>, buf: &[u8]) -> Result<usize, AnyError> {
    let cancel_handle = RcRef::map(self.clone(), |this| &this.cancel_handle);
    async {
      let write = RcRef::map(self, |this| &this.write);
      let mut write = write.borrow_mut().await;
      Ok(Pin::new(&mut *write).write(buf).await?)
    }
    .try_or_cancel(cancel_handle)
    .await
  }

  #[allow(dead_code)]
  async fn write_vectored(
    self: Rc<Self>,
    buf1: &[u8],
    buf2: &[u8],
  ) -> Result<usize, AnyError> {
    let mut wr = RcRef::map(self, |r| &r.write).borrow_mut().await;

    let total = buf1.len() + buf2.len();
    let mut bufs = [std::io::IoSlice::new(buf1), std::io::IoSlice::new(buf2)];
    let mut nwritten = wr.write_vectored(&bufs).await?;
    if nwritten == total {
      return Ok(nwritten);
    }

    // Slightly more optimized than (unstable) write_all_vectored for 2 iovecs.
    while nwritten <= buf1.len() {
      bufs[0] = std::io::IoSlice::new(&buf1[nwritten..]);
      nwritten += wr.write_vectored(&bufs).await?;
    }

    // First buffer out of the way.
    if nwritten < total && nwritten > buf1.len() {
      wr.write_all(&buf2[nwritten - buf1.len()..]).await?;
    }

    Ok(total)
  }
}

fn http_error(message: &'static str) -> AnyError {
  custom_error("Http", message)
}

/// Given a buffer that ends in `\n\n` or `\r\n\r\n`, returns a parsed [`Request<Body>`].
fn parse_response<T: Default>(
  header_bytes: &[u8],
) -> Result<(usize, Response<T>), AnyError> {
  let mut headers = [httparse::EMPTY_HEADER; 16];
  let status = httparse::parse_headers(header_bytes, &mut headers)?;
  match status {
    Status::Complete((index, parsed)) => {
      let mut resp = Response::builder().status(101).body(T::default())?;
      for header in parsed.iter() {
        resp.headers_mut().append(
          HeaderName::from_bytes(header.name.as_bytes())?,
          HeaderValue::from_str(std::str::from_utf8(header.value)?)?,
        );
      }
      Ok((index, resp))
    }
    _ => Err(http_error("invalid headers")),
  }
}

/// Find a newline in a slice.
fn find_newline(slice: &[u8]) -> Option<usize> {
  for (i, byte) in slice.iter().enumerate() {
    if *byte == b'\n' {
      return Some(i);
    }
  }
  None
}

/// WebSocket upgrade state machine states.
#[derive(Default)]
enum WebSocketUpgradeState {
  #[default]
  Initial,
  StatusLine,
  Headers,
  Complete,
}

static HEADER_SEARCHER: OnceCell<TwoWaySearcher> = OnceCell::new();
static HEADER_SEARCHER2: OnceCell<TwoWaySearcher> = OnceCell::new();

#[derive(Default)]
pub(crate) struct WebSocketUpgrade<T: Default> {
  state: WebSocketUpgradeState,
  buf: BytesMut,
  _t: PhantomData<T>,
}

impl<T: Default> WebSocketUpgrade<T> {
  /// Ensures that the status line starts with "HTTP/1.1 101 " which matches all of the node.js
  /// WebSocket libraries that are known. We don't care about the trailing status text.
  fn validate_status(&self, status: &[u8]) -> Result<(), AnyError> {
    if status.starts_with(b"HTTP/1.1 101 ") {
      Ok(())
    } else {
      Err(http_error("invalid HTTP status line"))
    }
  }

  /// Writes bytes to our upgrade buffer, returning [`Ok(None)`] if we need to keep feeding it data,
  /// [`Ok(Some(Response))`] if we got a valid upgrade header, or [`Err`] if something went badly.
  pub fn write(
    &mut self,
    bytes: &[u8],
  ) -> Result<Option<(Response<T>, Bytes)>, AnyError> {
    use WebSocketUpgradeState::*;

    match self.state {
      Initial => {
        if let Some(index) = find_newline(bytes) {
          let (status, rest) = bytes.split_at(index + 1);
          self.validate_status(status)?;

          // Fast path for the most common node.js WebSocket libraries that use \r\n as the
          // separator between header lines and send the whole response in one packet.
          if rest.ends_with(b"\r\n\r\n") {
            let (index, response) = parse_response(rest)?;
            if index == rest.len() {
              return Ok(Some((response, Bytes::default())));
            } else {
              let bytes = Bytes::copy_from_slice(&rest[index..]);
              return Ok(Some((response, bytes)));
            }
          }

          self.state = Headers;
          self.write(rest)
        } else {
          self.state = StatusLine;
          self.buf.extend_from_slice(bytes);
          Ok(None)
        }
      }
      StatusLine => {
        if let Some(index) = find_newline(bytes) {
          let (status, rest) = bytes.split_at(index + 1);
          self.buf.extend_from_slice(status);
          self.validate_status(&self.buf)?;
          self.buf.clear();
          // Recursively process this write
          self.state = Headers;
          self.write(rest)
        } else {
          self.buf.extend_from_slice(bytes);
          Ok(None)
        }
      }
      Headers => {
        self.buf.extend_from_slice(bytes);
        let header_searcher =
          HEADER_SEARCHER.get_or_init(|| TwoWaySearcher::new(b"\r\n\r\n"));
        let header_searcher2 =
          HEADER_SEARCHER2.get_or_init(|| TwoWaySearcher::new(b"\n\n"));
        if header_searcher.search_in(&self.buf).is_some()
          || header_searcher2.search_in(&self.buf).is_some()
        {
          let (index, response) = parse_response(&self.buf)?;
          let mut buf = std::mem::take(&mut self.buf);
          self.state = Complete;
          Ok(Some((response, buf.split_off(index).freeze())))
        } else {
          Ok(None)
        }
      }
      Complete => {
        Err(http_error("attempted to write to completed upgrade buffer"))
      }
    }
  }
}
