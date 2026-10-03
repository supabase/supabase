use std::borrow::Cow;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering;

use base_rt::DenoRuntimeDropToken;
use deno_core::error::bad_resource;
use deno_core::error::AnyError;
use deno_core::op2;
use deno_core::AsyncRefCell;
use deno_core::AsyncResult;
use deno_core::CancelHandle;
use deno_core::OpState;
use deno_core::Resource;
use deno_core::ResourceId;
use deno_net::ops::IpAddr;
use tokio::io;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;
use tracing::span;
use tracing::Level;

deno_core::extension!(
  runtime_net,
  middleware = |op| match op.name {
    "op_net_listen_tcp" => op.with_implementation_from(&op_net_listen()),
    "op_net_accept_tcp" => op.with_implementation_from(&op_net_accept()),

    // disable listening on TLS, UDP and Unix sockets
    "op_net_listen_tls" => op.with_implementation_from(&op_net_unsupported()),
    "op_net_listen_udp" => op.with_implementation_from(&op_net_unsupported()),
    "op_node_unstable_net_listen_udp" =>
      op.with_implementation_from(&op_net_unsupported()),
    "op_net_listen_unix" => op.with_implementation_from(&op_net_unsupported()),
    "op_net_listen_unixpacket" =>
      op.with_implementation_from(&op_net_unsupported()),
    "op_node_unstable_net_listen_unixpacket" =>
      op.with_implementation_from(&op_net_unsupported()),
    _ => op,
  }
);

pub struct TokioDuplexResource {
  id: usize,
  rw: AsyncRefCell<io::DuplexStream>,
  cancel_handle: CancelHandle,
}

impl TokioDuplexResource {
  pub fn new(rw: io::DuplexStream) -> Self {
    static COUNTER: AtomicUsize = AtomicUsize::new(0);

    Self {
      id: COUNTER.fetch_add(1, Ordering::SeqCst),
      rw: rw.into(),
      cancel_handle: CancelHandle::default(),
    }
  }

  pub fn into_inner(self) -> (usize, io::DuplexStream) {
    (self.id, self.rw.into_inner())
  }

  pub fn cancel_read_ops(&self) {
    self.cancel_handle.cancel()
  }

  pub async fn read(
    self: Rc<Self>,
    _data: &mut [u8],
  ) -> Result<usize, AnyError> {
    unreachable!()
  }

  pub async fn write(self: Rc<Self>, _data: &[u8]) -> Result<usize, AnyError> {
    unreachable!()
  }

  pub async fn shutdown(self: Rc<Self>) -> Result<(), AnyError> {
    unreachable!()
  }
}

impl Resource for TokioDuplexResource {
  deno_core::impl_readable_byob!();
  deno_core::impl_writable!();

  fn name(&self) -> Cow<'_, str> {
    "tokioDuplexStream".into()
  }

  fn shutdown(self: Rc<Self>) -> AsyncResult<()> {
    Box::pin(self.shutdown())
  }

  fn close(self: Rc<Self>) {
    self.cancel_read_ops();
  }
}

#[derive(Debug, Clone, Default)]
struct ListenMarker(CancellationToken);

impl Drop for ListenMarker {
  fn drop(&mut self) {
    self.0.cancel();
  }
}

impl Resource for ListenMarker {}

#[op2]
#[serde]
pub fn op_net_listen(
  state: &mut OpState,
) -> Result<(ResourceId, IpAddr), AnyError> {
  // this is a noop
  // TODO: customize to match the service ip and port
  Ok((
    state.resource_table.add(ListenMarker::default()),
    IpAddr {
      hostname: "0.0.0.0".to_string(),
      port: 9999,
    },
  ))
}

#[op2(async)]
#[serde]
pub async fn op_net_accept(
  state: Rc<RefCell<OpState>>,
  #[smi] rid: ResourceId,
) -> Result<(ResourceId, IpAddr, IpAddr), AnyError> {
  let accept_token = state
    .borrow()
    .resource_table
    .get::<ListenMarker>(rid)?
    .0
    .clone();

  // we do not want to keep the op_state locked, so we take the channel receiver
  // from it and release op state. we need to add it back later after processing
  // a message.
  let (rx, runtime_token) = {
    let mut op_state = state.borrow_mut();

    (
      op_state
        .try_take::<mpsc::UnboundedReceiver<(io::DuplexStream, Option<CancellationToken>)>>(
        ),
      op_state
        .try_borrow::<DenoRuntimeDropToken>()
        .cloned()
        .unwrap(),
      )
  };

  let Some(rx) = rx else {
    return Err(bad_resource("duplex stream receiver is not available"));
  };

  let mut rx = scopeguard::guard(rx, {
    let state = state.clone();
    move |value| {
      let mut op_state = state.borrow_mut();
      op_state.put::<mpsc::UnboundedReceiver<(io::DuplexStream, Option<CancellationToken>)>>(
        value,
      );
    }
  });

  let (stream, conn_token) = match tokio::select! {
    ret = rx.recv() => { ret }
    _ = accept_token.cancelled() => { None }
  } {
    Some(ret) => ret,
    None => {
      return Err(bad_resource("duplex stream channel is closed"));
    }
  };

  let resource = TokioDuplexResource::new(stream);
  let id = resource.id;

  // since the op state was dropped before, reborrow and add the channel
  // receiver again
  drop(rx);

  let mut op_state = state.borrow_mut();
  let rid = op_state.resource_table.add(resource);

  if let Some(token) = conn_token {
    // connection token should only last as long as the worker is alive.
    drop(base_rt::SUPERVISOR_RT.spawn({
      let token = token.clone();
      async move {
        let _lt_track = span!(Level::DEBUG, "lt_track", id);
        tokio::select! {
          _ = runtime_token.cancelled_owned() => {
            if !token.is_cancelled() {
              token.cancel();
            }
          }

          _ = token.cancelled() => {}
        }
      }
    }));

    let _ = op_state
      .borrow_mut::<HashMap<usize, CancellationToken>>()
      .insert(id, token);
  }

  Ok((
    rid,
    IpAddr {
      hostname: "0.0.0.0".to_string(),
      port: 9999, // FIXME
    },
    IpAddr {
      hostname: "0.0.0.0".to_string(),
      port: 8888, // FIXME
    },
  ))
}

// TODO: This should be a global ext
#[op2(fast)]
pub fn op_net_unsupported(_state: &mut OpState) -> Result<(), AnyError> {
  Err(deno_core::error::not_supported())
}
