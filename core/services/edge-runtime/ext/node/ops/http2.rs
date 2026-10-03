// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::borrow::Cow;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::task::Poll;

use bytes::Bytes;
use deno_core::futures::future::poll_fn;
use deno_core::op2;
use deno_core::serde::Serialize;
use deno_core::AsyncRefCell;
use deno_core::BufView;
use deno_core::ByteString;
use deno_core::CancelFuture;
use deno_core::CancelHandle;
use deno_core::JsBuffer;
use deno_core::OpState;
use deno_core::RcRef;
use deno_core::Resource;
use deno_core::ResourceId;
use deno_net::raw::take_network_stream_resource;
use deno_net::raw::NetworkStream;
use h2;
use h2::Reason;
use h2::RecvStream;
use http;
use http::header::HeaderName;
use http::header::HeaderValue;
use http::request::Parts;
use http::HeaderMap;
use http::Response;
use http::StatusCode;
use url::Url;

pub struct Http2Client {
  pub client: AsyncRefCell<h2::client::SendRequest<BufView>>,
  pub url: Url,
}

impl Resource for Http2Client {
  fn name(&self) -> Cow<'_, str> {
    "http2Client".into()
  }
}

#[derive(Debug)]
pub struct Http2ClientConn {
  pub conn: AsyncRefCell<h2::client::Connection<NetworkStream, BufView>>,
  cancel_handle: CancelHandle,
}

impl Resource for Http2ClientConn {
  fn name(&self) -> Cow<'_, str> {
    "http2ClientConnection".into()
  }

  fn close(self: Rc<Self>) {
    self.cancel_handle.cancel()
  }
}

#[derive(Debug)]
pub struct Http2ClientStream {
  pub response: AsyncRefCell<h2::client::ResponseFuture>,
  pub stream: AsyncRefCell<h2::SendStream<BufView>>,
}

impl Resource for Http2ClientStream {
  fn name(&self) -> Cow<'_, str> {
    "http2ClientStream".into()
  }
}

#[derive(Debug)]
pub struct Http2ClientResponseBody {
  pub body: AsyncRefCell<h2::RecvStream>,
  pub trailers_rx:
    AsyncRefCell<Option<tokio::sync::oneshot::Receiver<Option<HeaderMap>>>>,
  pub trailers_tx:
    AsyncRefCell<Option<tokio::sync::oneshot::Sender<Option<HeaderMap>>>>,
}

impl Resource for Http2ClientResponseBody {
  fn name(&self) -> Cow<'_, str> {
    "http2ClientResponseBody".into()
  }
}

#[derive(Debug)]
pub struct Http2ServerConnection {
  pub conn: AsyncRefCell<h2::server::Connection<NetworkStream, BufView>>,
}

impl Resource for Http2ServerConnection {
  fn name(&self) -> Cow<'_, str> {
    "http2ServerConnection".into()
  }
}

pub struct Http2ServerSendResponse {
  pub send_response: AsyncRefCell<h2::server::SendResponse<BufView>>,
}

impl Resource for Http2ServerSendResponse {
  fn name(&self) -> Cow<'_, str> {
    "http2ServerSendResponse".into()
  }
}

#[derive(Debug, thiserror::Error)]
pub enum Http2Error {
  #[error(transparent)]
  Resource(deno_core::error::AnyError),
  #[error(transparent)]
  UrlParse(#[from] url::ParseError),
  #[error(transparent)]
  H2(#[from] h2::Error),
}

#[op2(async)]
#[serde]
pub async fn op_http2_connect(
  state: Rc<RefCell<OpState>>,
  #[smi] rid: ResourceId,
  #[string] url: String,
) -> Result<(ResourceId, ResourceId), Http2Error> {
  // No permission check necessary because we're using an existing connection
  let network_stream = {
    let mut state = state.borrow_mut();
    take_network_stream_resource(&mut state.resource_table, rid)
      .map_err(Http2Error::Resource)?
  };

  let url = Url::parse(&url)?;

  let (client, conn) =
    h2::client::Builder::new().handshake(network_stream).await?;
  let mut state = state.borrow_mut();
  let client_rid = state.resource_table.add(Http2Client {
    client: AsyncRefCell::new(client),
    url,
  });
  let conn_rid = state.resource_table.add(Http2ClientConn {
    conn: AsyncRefCell::new(conn),
    cancel_handle: CancelHandle::new(),
  });
  Ok((client_rid, conn_rid))
}

#[op2(async)]
#[smi]
pub async fn op_http2_listen(
  state: Rc<RefCell<OpState>>,
  #[smi] rid: ResourceId,
) -> Result<ResourceId, Http2Error> {
  let stream =
    take_network_stream_resource(&mut state.borrow_mut().resource_table, rid)
      .map_err(Http2Error::Resource)?;

  let conn = h2::server::Builder::new().handshake(stream).await?;
  Ok(
    state
      .borrow_mut()
      .resource_table
      .add(Http2ServerConnection {
        conn: AsyncRefCell::new(conn),
      }),
  )
}

#[op2(async)]
#[serde]
pub async fn op_http2_accept(
  state: Rc<RefCell<OpState>>,
  #[smi] rid: ResourceId,
) -> Result<
  Option<(Vec<(ByteString, ByteString)>, ResourceId, ResourceId)>,
  Http2Error,
> {
  let resource = state
    .borrow()
    .resource_table
    .get::<Http2ServerConnection>(rid)
    .map_err(Http2Error::Resource)?;
  let mut conn = RcRef::map(&resource, |r| &r.conn).borrow_mut().await;
  if let Some(res) = conn.accept().await {
    let (req, resp) = res?;
    let (parts, body) = req.into_parts();
    let (trailers_tx, trailers_rx) = tokio::sync::oneshot::channel();
    let stm = state
      .borrow_mut()
      .resource_table
      .add(Http2ClientResponseBody {
        body: AsyncRefCell::new(body),
        trailers_rx: AsyncRefCell::new(Some(trailers_rx)),
        trailers_tx: AsyncRefCell::new(Some(trailers_tx)),
      });

    let Parts {
      uri,
      method,
      headers,
      ..
    } = parts;
    let mut req_headers = Vec::with_capacity(headers.len() + 4);
    req_headers.push((
      ByteString::from(":method"),
      ByteString::from(method.as_str()),
    ));
    req_headers.push((
      ByteString::from(":scheme"),
      ByteString::from(uri.scheme().map(|s| s.as_str()).unwrap_or("http")),
    ));
    req_headers.push((
      ByteString::from(":path"),
      ByteString::from(uri.path_and_query().map(|p| p.as_str()).unwrap_or("")),
    ));
    req_headers.push((
      ByteString::from(":authority"),
      ByteString::from(uri.authority().map(|a| a.as_str()).unwrap_or("")),
    ));
    for (key, val) in headers.iter() {
      req_headers.push((key.as_str().into(), val.as_bytes().into()));
    }

    let resp = state
      .borrow_mut()
      .resource_table
      .add(Http2ServerSendResponse {
        send_response: AsyncRefCell::new(resp),
      });

    Ok(Some((req_headers, stm, resp)))
  } else {
    Ok(None)
  }
}

#[op2(async)]
#[serde]
pub async fn op_http2_send_response(
  state: Rc<RefCell<OpState>>,
  #[smi] rid: ResourceId,
  #[smi] status: u16,
  #[serde] headers: Vec<(ByteString, ByteString)>,
) -> Result<(ResourceId, u32), Http2Error> {
  let resource = state
    .borrow()
    .resource_table
    .get::<Http2ServerSendResponse>(rid)
    .map_err(Http2Error::Resource)?;
  let mut send_response = RcRef::map(resource, |r| &r.send_response)
    .borrow_mut()
    .await;
  let mut response = Response::new(());
  if let Ok(status) = StatusCode::from_u16(status) {
    *response.status_mut() = status;
  }
  for (name, value) in headers {
    response.headers_mut().append(
      HeaderName::from_bytes(&name).unwrap(),
      HeaderValue::from_bytes(&value).unwrap(),
    );
  }

  let stream = send_response.send_response(response, false)?;
  let stream_id = stream.stream_id();

  Ok((rid, stream_id.into()))
}

#[op2(async)]
pub async fn op_http2_poll_client_connection(
  state: Rc<RefCell<OpState>>,
  #[smi] rid: ResourceId,
) -> Result<(), Http2Error> {
  let resource = state
    .borrow()
    .resource_table
    .get::<Http2ClientConn>(rid)
    .map_err(Http2Error::Resource)?;

  let cancel_handle = RcRef::map(resource.clone(), |this| &this.cancel_handle);
  let mut conn = RcRef::map(resource, |this| &this.conn).borrow_mut().await;

  match (&mut *conn).or_cancel(cancel_handle).await {
    Ok(result) => result?,
    Err(_) => {
      // TODO(bartlomieju): probably need a better mechanism for closing the connection

      // cancelled
    }
  }

  Ok(())
}

#[op2(async)]
#[serde]
pub async fn op_http2_client_request(
  state: Rc<RefCell<OpState>>,
  #[smi] client_rid: ResourceId,
  // TODO(bartlomieju): maybe use a vector with fixed layout to save sending
  // 4 strings of keys?
  #[serde] mut pseudo_headers: HashMap<String, String>,
  #[serde] headers: Vec<(ByteString, ByteString)>,
) -> Result<(ResourceId, u32), Http2Error> {
  let resource = state
    .borrow()
    .resource_table
    .get::<Http2Client>(client_rid)
    .map_err(Http2Error::Resource)?;

  let url = resource.url.clone();

  let pseudo_path = pseudo_headers.remove(":path").unwrap_or("/".to_string());
  let pseudo_method = pseudo_headers
    .remove(":method")
    .unwrap_or("GET".to_string());
  // TODO(bartlomieju): handle all pseudo-headers (:authority, :scheme)
  let _pseudo_authority = pseudo_headers
    .remove(":authority")
    .unwrap_or("/".to_string());
  let _pseudo_scheme = pseudo_headers
    .remove(":scheme")
    .unwrap_or("http".to_string());

  let url = url.join(&pseudo_path)?;

  let mut req = http::Request::builder()
    .uri(url.as_str())
    .method(pseudo_method.as_str());

  for (name, value) in headers {
    req.headers_mut().unwrap().append(
      HeaderName::from_bytes(&name).unwrap(),
      HeaderValue::from_bytes(&value).unwrap(),
    );
  }

  // Requests from here never pass through `deno_fetch`'s client, so both its
  // default `User-Agent` and the stamping hook have to be applied by hand to
  // keep `node:http2` traffic attributed like every other outbound path.
  {
    let state = state.borrow();
    let options = state.borrow::<deno_fetch::Options>();
    let headers = req.headers_mut().unwrap();

    if let Some(request_builder_hook) = options.request_builder_hook.as_ref() {
      request_builder_hook(headers).map_err(Http2Error::Resource)?;
    }
    if let Ok(user_agent) = HeaderValue::from_str(&options.user_agent) {
      headers
        .entry(http::header::USER_AGENT)
        .or_insert(user_agent);
    }
  }

  let request = req.body(()).unwrap();

  let resource = {
    let state = state.borrow();
    state
      .resource_table
      .get::<Http2Client>(client_rid)
      .map_err(Http2Error::Resource)?
  };
  let mut client = RcRef::map(&resource, |r| &r.client).borrow_mut().await;
  poll_fn(|cx| client.poll_ready(cx)).await?;
  let (response, stream) = client.send_request(request, false).unwrap();
  let stream_id = stream.stream_id();
  let stream_rid = state.borrow_mut().resource_table.add(Http2ClientStream {
    response: AsyncRefCell::new(response),
    stream: AsyncRefCell::new(stream),
  });
  Ok((stream_rid, stream_id.into()))
}

#[op2(async)]
pub async fn op_http2_client_send_data(
  state: Rc<RefCell<OpState>>,
  #[smi] stream_rid: ResourceId,
  #[buffer] data: JsBuffer,
  end_of_stream: bool,
) -> Result<(), Http2Error> {
  let resource = state
    .borrow()
    .resource_table
    .get::<Http2ClientStream>(stream_rid)
    .map_err(Http2Error::Resource)?;
  let mut stream = RcRef::map(&resource, |r| &r.stream).borrow_mut().await;

  stream.send_data(data.to_vec().into(), end_of_stream)?;
  Ok(())
}

#[op2(async)]
pub async fn op_http2_client_reset_stream(
  state: Rc<RefCell<OpState>>,
  #[smi] stream_rid: ResourceId,
  #[smi] code: u32,
) -> Result<(), deno_core::error::AnyError> {
  let resource = state
    .borrow()
    .resource_table
    .get::<Http2ClientStream>(stream_rid)?;
  let mut stream = RcRef::map(&resource, |r| &r.stream).borrow_mut().await;
  stream.send_reset(h2::Reason::from(code));
  Ok(())
}

#[op2(async)]
pub async fn op_http2_client_send_trailers(
  state: Rc<RefCell<OpState>>,
  #[smi] stream_rid: ResourceId,
  #[serde] trailers: Vec<(ByteString, ByteString)>,
) -> Result<(), Http2Error> {
  let resource = state
    .borrow()
    .resource_table
    .get::<Http2ClientStream>(stream_rid)
    .map_err(Http2Error::Resource)?;
  let mut stream = RcRef::map(&resource, |r| &r.stream).borrow_mut().await;

  let mut trailers_map = http::HeaderMap::new();
  for (name, value) in trailers {
    trailers_map.insert(
      HeaderName::from_bytes(&name).unwrap(),
      HeaderValue::from_bytes(&value).unwrap(),
    );
  }

  stream.send_trailers(trailers_map)?;
  Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Http2ClientResponse {
  headers: Vec<(ByteString, ByteString)>,
  body_rid: ResourceId,
  status_code: u16,
}

#[op2(async)]
#[serde]
pub async fn op_http2_client_get_response(
  state: Rc<RefCell<OpState>>,
  #[smi] stream_rid: ResourceId,
) -> Result<(Http2ClientResponse, bool), Http2Error> {
  let resource = state
    .borrow()
    .resource_table
    .get::<Http2ClientStream>(stream_rid)
    .map_err(Http2Error::Resource)?;
  let mut response_future =
    RcRef::map(&resource, |r| &r.response).borrow_mut().await;

  let response = (&mut *response_future).await?;

  let (parts, body) = response.into_parts();
  let status = parts.status;
  let mut res_headers = Vec::new();
  for (key, val) in parts.headers.iter() {
    res_headers.push((key.as_str().into(), val.as_bytes().into()));
  }
  let end_stream = body.is_end_stream();

  let (trailers_tx, trailers_rx) = tokio::sync::oneshot::channel();
  let body_rid =
    state
      .borrow_mut()
      .resource_table
      .add(Http2ClientResponseBody {
        body: AsyncRefCell::new(body),
        trailers_rx: AsyncRefCell::new(Some(trailers_rx)),
        trailers_tx: AsyncRefCell::new(Some(trailers_tx)),
      });
  Ok((
    Http2ClientResponse {
      headers: res_headers,
      body_rid,
      status_code: status.into(),
    },
    end_stream,
  ))
}

enum DataOrTrailers {
  Data(Bytes),
  Trailers(HeaderMap),
  Eof,
}

fn poll_data_or_trailers(
  cx: &mut std::task::Context,
  body: &mut RecvStream,
) -> Poll<Result<DataOrTrailers, h2::Error>> {
  if let Poll::Ready(trailers) = body.poll_trailers(cx) {
    if let Some(trailers) = trailers? {
      return Poll::Ready(Ok(DataOrTrailers::Trailers(trailers)));
    } else {
      return Poll::Ready(Ok(DataOrTrailers::Eof));
    }
  }
  if let Poll::Ready(Some(data)) = body.poll_data(cx) {
    let data = data?;
    body.flow_control().release_capacity(data.len())?;
    return Poll::Ready(Ok(DataOrTrailers::Data(data)));
    // If `poll_data` returns `Ready(None)`, poll one more time to check for trailers
  }
  // Return pending here as poll_data will keep the waker
  Poll::Pending
}

#[op2(async)]
#[serde]
pub async fn op_http2_client_get_response_body_chunk(
  state: Rc<RefCell<OpState>>,
  #[smi] body_rid: ResourceId,
) -> Result<(Option<Vec<u8>>, bool, bool), Http2Error> {
  let resource = state
    .borrow()
    .resource_table
    .get::<Http2ClientResponseBody>(body_rid)
    .map_err(Http2Error::Resource)?;
  let mut body = RcRef::map(&resource, |r| &r.body).borrow_mut().await;

  loop {
    let result = poll_fn(|cx| poll_data_or_trailers(cx, &mut body)).await;
    if let Err(err) = result {
      match err.reason() {
        Some(Reason::NO_ERROR) => return Ok((None, true, false)),
        Some(Reason::CANCEL) => return Ok((None, false, true)),
        _ => return Err(err.into()),
      }
    }
    match result.unwrap() {
      DataOrTrailers::Data(data) => {
        return Ok((Some(data.to_vec()), false, false));
      }
      DataOrTrailers::Trailers(trailers) => {
        if let Some(trailers_tx) = RcRef::map(&resource, |r| &r.trailers_tx)
          .borrow_mut()
          .await
          .take()
        {
          _ = trailers_tx.send(Some(trailers));
        };

        continue;
      }
      DataOrTrailers::Eof => {
        RcRef::map(&resource, |r| &r.trailers_tx)
          .borrow_mut()
          .await
          .take();
        return Ok((None, true, false));
      }
    };
  }
}

#[op2(async)]
#[serde]
pub async fn op_http2_client_get_response_trailers(
  state: Rc<RefCell<OpState>>,
  #[smi] body_rid: ResourceId,
) -> Result<Option<Vec<(ByteString, ByteString)>>, deno_core::error::AnyError> {
  let resource = state
    .borrow()
    .resource_table
    .get::<Http2ClientResponseBody>(body_rid)?;
  let trailers = RcRef::map(&resource, |r| &r.trailers_rx)
    .borrow_mut()
    .await
    .take();
  if let Some(trailers) = trailers {
    if let Ok(Some(trailers)) = trailers.await {
      let mut v = Vec::with_capacity(trailers.len());
      for (key, value) in trailers.iter() {
        v.push((
          ByteString::from(key.as_str()),
          ByteString::from(value.as_bytes()),
        ));
      }
      Ok(Some(v))
    } else {
      Ok(None)
    }
  } else {
    Ok(None)
  }
}
