use std::borrow::Cow;
use std::cell::RefCell;
use std::pin::Pin;
use std::rc::Rc;
use std::sync::Arc;
use std::task::Poll;

use anyhow::bail;
use anyhow::Context;
use deno_core::error::custom_error;
use deno_core::error::AnyError;
use deno_core::op2;
use deno_core::unsync::sync::AtomicFlag;
use deno_core::ByteString;
use deno_core::OpState;
use deno_core::RcRef;
use deno_core::Resource;
use deno_core::ResourceId;
use deno_http::HttpRequestReader;
use deno_http::HttpStreamReadResource;
use deno_websocket::ws_create_server_stream;
use futures::future::BoxFuture;
use futures::ready;
use futures::FutureExt;
use hyper_v014::upgrade::OnUpgrade;
use hyper_v014::upgrade::Parts;
use log::error;
use serde::Serialize;
use tokio::io::copy_bidirectional;
use tokio::io::AsyncRead;
use tokio::io::AsyncReadExt;
use tokio::io::AsyncWrite;
use tokio::io::AsyncWriteExt;
use tokio::io::DuplexStream;
use tokio::net::UnixStream;
use tokio::sync::oneshot;
use tokio_util::sync::CancellationToken;

use crate::upgrade::UpgradeStream;
use crate::upgrade::WebSocketUpgrade;

deno_core::extension!(
  runtime_http,
  ops = [
    op_http_upgrade_websocket2,
    op_http_upgrade_raw2,
    op_http_upgrade_raw2_fence
  ],
  middleware = |op| match op.name {
    "op_http_upgrade_websocket" => {
      op.with_implementation_from(&op_http_upgrade_websocket2())
    }
    _ => op,
  },
);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum StreamState {
  Normal,
  Dropping,
  Dropped,
}

pub(crate) struct Stream2<S>
where
  S: AsyncWrite + AsyncRead + Send + Unpin + 'static,
{
  io: Option<(S, Option<CancellationToken>)>,
  state: StreamState,
  wait_fut: Option<BoxFuture<'static, ()>>,
  pub written: Arc<AtomicFlag>,
}

impl<S> Drop for Stream2<S>
where
  S: AsyncWrite + AsyncRead + Send + Unpin + 'static,
{
  fn drop(&mut self) {
    if self.state != StreamState::Normal {
      return;
    }

    let Some((stream, conn_sync)) = self.io.take() else {
      return;
    };

    let mut stream = Stream2::new(stream, conn_sync);

    stream.state = StreamState::Dropping;

    // TODO(Nyannyacha): Optimize this. No matter how I think about it,
    // using `tokio::spawn` to defer the stream shutdown seems like a waste.
    drop(tokio::spawn(async move {
      match stream.shutdown().await {
        Ok(_) => {}
        Err(e) => {
          error!("stream could not be shutdown properly: {}", e);
        }
      }
    }));
  }
}

impl<S> Stream2<S>
where
  S: AsyncWrite + AsyncRead + Send + Unpin + 'static,
{
  pub fn new(stream: S, token: Option<CancellationToken>) -> Self {
    Self {
      io: Some((stream, token)),
      state: StreamState::Normal,
      wait_fut: None,
      written: Arc::default(),
    }
  }

  pub fn is_dropped(&self) -> bool {
    self.state == StreamState::Dropped
  }

  fn into_inner(mut self) -> Option<(S, Option<CancellationToken>)> {
    self.io.take()
  }
}

impl<S> AsyncRead for Stream2<S>
where
  S: AsyncWrite + AsyncRead + Send + Unpin + 'static,
{
  fn poll_read(
    self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
    buf: &mut tokio::io::ReadBuf<'_>,
  ) -> Poll<std::io::Result<()>> {
    if let Some((stream, _)) = Pin::into_inner(self).io.as_mut() {
      Pin::new(stream).poll_read(cx, buf)
    } else {
      Poll::Ready(Err(std::io::Error::from(std::io::ErrorKind::BrokenPipe)))
    }
  }
}

impl<S> AsyncWrite for Stream2<S>
where
  S: AsyncWrite + AsyncRead + Send + Unpin + 'static,
{
  fn poll_write(
    self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
    buf: &[u8],
  ) -> Poll<Result<usize, std::io::Error>> {
    let written = self.written.clone();
    if let Some((stream, _)) = Pin::into_inner(self).io.as_mut() {
      let ret = ready!(Pin::new(stream).poll_write(cx, buf));
      if ret.is_ok() {
        written.raise();
      }
      Poll::Ready(ret)
    } else {
      Poll::Ready(Err(std::io::Error::from(std::io::ErrorKind::BrokenPipe)))
    }
  }

  fn poll_write_vectored(
    self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
    bufs: &[std::io::IoSlice<'_>],
  ) -> Poll<Result<usize, std::io::Error>> {
    let written = self.written.clone();
    if let Some((stream, _)) = Pin::into_inner(self).io.as_mut() {
      let ret = ready!(Pin::new(stream).poll_write_vectored(cx, bufs));
      if ret.is_ok() {
        written.raise();
      }
      Poll::Ready(ret)
    } else {
      Poll::Ready(Err(std::io::Error::from(std::io::ErrorKind::BrokenPipe)))
    }
  }

  fn is_write_vectored(&self) -> bool {
    self
      .io
      .as_ref()
      .map(|(it, _)| it.is_write_vectored())
      .unwrap_or_default()
  }

  fn poll_flush(
    self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> Poll<Result<(), std::io::Error>> {
    if let Some((stream, _)) = Pin::into_inner(self).io.as_mut() {
      Pin::new(stream).poll_flush(cx)
    } else {
      Poll::Ready(Err(std::io::Error::from(std::io::ErrorKind::BrokenPipe)))
    }
  }

  fn poll_shutdown(
    self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> Poll<Result<(), std::io::Error>> {
    let this = Pin::into_inner(self);

    if this.is_dropped() {
      return Poll::Ready(Ok(()));
    }

    if let Some((stream, token)) = this.io.as_mut() {
      if let Some(ref token) = token {
        let fut = this
          .wait_fut
          .get_or_insert_with(|| token.clone().cancelled_owned().boxed());

        ready!(fut.as_mut().poll_unpin(cx));
      }

      let poll_result = ready!(Pin::new(stream).poll_shutdown(cx));

      this.state = StreamState::Dropped;

      Poll::Ready(poll_result)
    } else {
      Poll::Ready(Err(std::io::Error::from(std::io::ErrorKind::BrokenPipe)))
    }
  }
}

pub(crate) type DuplexStream2 = Stream2<DuplexStream>;
pub(crate) type UnixStream2 = Stream2<UnixStream>;

fn http_error(message: &'static str) -> AnyError {
  custom_error("Http", message)
}

#[op2(async)]
#[smi]
async fn op_http_upgrade_websocket2(
  state: Rc<RefCell<OpState>>,
  #[smi] rid: ResourceId,
) -> Result<ResourceId, AnyError> {
  let stream = state
    .borrow_mut()
    .resource_table
    .get::<HttpStreamReadResource>(rid)?;

  let mut rd = RcRef::map(&stream, |r| &r.rd).borrow_mut().await;

  let request = match &mut *rd {
    HttpRequestReader::Headers(request) => request,
    _ => {
      return Err(http_error("cannot upgrade because request body was used"))
    }
  };

  let upgraded = hyper_v014::upgrade::on(request).await?;
  let Parts { io, read_buf, .. } =
    upgraded.downcast::<DuplexStream2>().unwrap();
  let (mut rw, conn_sync) = io
    .into_inner()
    .with_context(|| "invalid duplex stream was found")?;

  // NOTE(Nyannyacha): We use `UnixStream` out of necessity here because
  // `ws_create_server_stream` only supports network stream types.
  let (ours, theirs) = UnixStream::pair()?;

  tokio::spawn(async move {
    let mut theirs = UnixStream2::new(theirs, conn_sync);
    let _ = copy_bidirectional(&mut rw, &mut theirs).await;
  });

  Ok(ws_create_server_stream(
    &mut state.borrow_mut(),
    ours.into(),
    read_buf,
  ))
}

#[op2]
#[serde]
fn op_http_upgrade_raw2(
  state: &mut OpState,
  #[smi] stream_rid: ResourceId,
) -> Result<(ResourceId, ResourceId), AnyError> {
  let req_stream = state
    .resource_table
    .get::<HttpStreamReadResource>(stream_rid)?;
  let mut req_reader_mut = RcRef::map(&req_stream, |r| &r.rd)
    .try_borrow_mut()
    .with_context(|| "unable to get http stream reader")?;

  // Stage 1: extract the upgrade future
  let upgrade =
    if let HttpRequestReader::Headers(orig_req) = &mut *req_reader_mut {
      orig_req.extensions_mut().remove::<OnUpgrade>()
    } else {
      None
    }
    .with_context(|| "no upgrade extension was found")?;

  drop(req_reader_mut);

  let (resp_tx, resp_rx) = oneshot::channel();
  let (read, write) = tokio::io::duplex(1024);
  let (read_rx, write_tx) = tokio::io::split(read);
  let (mut write_rx, mut read_tx) = tokio::io::split(write);

  tokio::spawn(async move {
    let mut upgrade_stream = WebSocketUpgrade::<()>::default();

    // Stage 2: Extract the Upgraded connection
    let mut buf = [0; 1024];
    let upgraded = loop {
      let read = Pin::new(&mut write_rx).read(&mut buf).await?;
      match upgrade_stream.write(&buf[..read]) {
        Ok(None) => continue,
        Ok(Some((resp, pre))) => {
          if resp_tx.send(resp).is_err() {
            bail!("cannot send response");
          }

          let mut upgraded = upgrade.await?;

          upgraded.write_all(&pre).await?;
          break upgraded;
        }

        Err(err) => return Err(err),
      }
    };

    // Stage 3: Pump the data
    let (mut upgraded_rx, mut upgraded_tx) = tokio::io::split(upgraded);

    tokio::spawn(async move {
      let mut buf = [0; 1024];
      loop {
        let read = upgraded_rx.read(&mut buf).await?;
        if read == 0 {
          break;
        }
        read_tx.write_all(&buf[..read]).await?;
      }

      read_tx.shutdown().await
    });

    tokio::spawn(async move {
      let mut buf = [0; 1024];
      loop {
        let read = write_rx.read(&mut buf).await?;
        if read == 0 {
          break;
        }
        upgraded_tx.write_all(&buf[..read]).await?;
      }

      upgraded_tx.shutdown().await
    });

    Ok::<_, AnyError>(())
  });

  Ok((
    state
      .resource_table
      .add(UpgradeStream::new(read_rx, write_tx)),
    state
      .resource_table
      .add(HttpUpgradeRawResponseFenceResource(resp_rx)),
  ))
}

#[op2(async)]
#[serde]
async fn op_http_upgrade_raw2_fence(
  state: Rc<RefCell<OpState>>,
  #[smi] rid: ResourceId,
) -> Result<HttpUpgradeRawResponseResource, AnyError> {
  let resp = state
    .borrow_mut()
    .resource_table
    .take::<HttpUpgradeRawResponseFenceResource>(rid)?;

  Ok(HttpUpgradeRawResponseResource::new(
    Rc::into_inner(resp)
      .unwrap()
      .0
      .await
      .with_context(|| "cannot receive response")?,
  ))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HttpUpgradeRawResponseResource {
  status: u16,
  headers: Vec<(ByteString, ByteString)>,
}

impl Resource for HttpUpgradeRawResponseResource {
  fn name(&self) -> Cow<'_, str> {
    "httpUpgradeRawResponseResource".into()
  }
}

impl HttpUpgradeRawResponseResource {
  fn new(res: http::Response<()>) -> Self {
    let status = res.status().as_u16();
    let mut headers = vec![];

    for (key, value) in res.headers().iter() {
      headers.push((
        ByteString::from(key.as_str()),
        ByteString::from(value.to_str().unwrap_or_default()),
      ));
    }

    Self { status, headers }
  }
}

struct HttpUpgradeRawResponseFenceResource(
  oneshot::Receiver<http::Response<()>>,
);

impl Resource for HttpUpgradeRawResponseFenceResource {
  fn name(&self) -> Cow<'_, str> {
    "httpUpgradeRawResponseFenceResource".into()
  }
}
