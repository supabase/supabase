use std::collections::HashMap;
use std::rc::Rc;

use deno_core::error::bad_resource;
use deno_core::error::bad_resource_id;
use deno_core::error::AnyError;
use deno_core::op2;
use deno_core::OpState;
use deno_core::ResourceId;
use deno_http::http_create_conn_resource;
use tokio_util::sync::CancellationToken;

use super::http::DuplexStream2;
use super::net::TokioDuplexResource;

use crate::conn_sync::ConnWatcher;

deno_core::extension!(runtime_http_start, ops = [op_http_start]);

#[op2]
#[serde]
fn op_http_start(
  state: &mut OpState,
  #[smi] stream_rid: ResourceId,
) -> Result<(ResourceId, ResourceId), AnyError> {
  if let Ok(resource_rc) =
    state.resource_table.take::<TokioDuplexResource>(stream_rid)
  {
    // This connection might be used somewhere else. If it's the case, we cannot proceed with the
    // process of starting a HTTP server on top of this connection, so we just return a bad
    // resource error. See also: https://github.com/denoland/deno/pull/16242
    let resource = Rc::try_unwrap(resource_rc)
      .map_err(|_| bad_resource("Duplex stream is currently in use"))?;

    let (id, stream) = resource.into_inner();
    let token = state
      .borrow_mut::<HashMap<usize, CancellationToken>>()
      .remove(&id);

    // set a hardcoded address
    let addr: std::net::SocketAddr = "0.0.0.0:9999".parse().unwrap();
    let stream = DuplexStream2::new(stream, token.clone());
    let written = stream.written.clone();
    let conn = http_create_conn_resource(state, stream, addr, "http");
    let conn_watcher = state.resource_table.add(ConnWatcher(token, written));

    return Ok((conn, conn_watcher));
  }

  Err(bad_resource_id())
}
