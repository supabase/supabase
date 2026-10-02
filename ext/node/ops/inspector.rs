// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use crate::NodePermissions;
use deno_core::anyhow::Error;
use deno_core::error::generic_error;
use deno_core::futures::channel::mpsc;
use deno_core::op2;
use deno_core::v8;
use deno_core::GarbageCollected;
use deno_core::InspectorSessionKind;
use deno_core::InspectorSessionOptions;
use deno_core::JsRuntimeInspector;
use deno_core::OpState;
use std::cell::RefCell;
use std::rc::Rc;

#[op2(fast)]
pub fn op_inspector_enabled() -> bool {
  // TODO: hook up to InspectorServer
  false
}

#[op2(stack_trace)]
pub fn op_inspector_open<P>(
  _state: &mut OpState,
  _port: Option<u16>,
  #[string] _host: Option<String>,
) -> Result<(), Error>
where
  P: NodePermissions + 'static,
{
  // TODO: hook up to InspectorServer
  /*
  let server = state.borrow_mut::<InspectorServer>();
  if let Some(host) = host {
    server.set_host(host);
  }
  if let Some(port) = port {
    server.set_port(port);
  }
  state
    .borrow_mut::<P>()
    .check_net((server.host(), Some(server.port())), "inspector.open")?;
  */

  Ok(())
}

#[op2(fast)]
pub fn op_inspector_close() {
  // TODO: hook up to InspectorServer
}

#[op2]
#[string]
pub fn op_inspector_url() -> Option<String> {
  // TODO: hook up to InspectorServer
  None
}

#[op2(fast)]
pub fn op_inspector_wait(state: &OpState) -> bool {
  match state.try_borrow::<Rc<RefCell<JsRuntimeInspector>>>() {
    Some(inspector) => {
      inspector
        .borrow_mut()
        .wait_for_session_and_break_on_next_statement();
      true
    }
    None => false,
  }
}

#[op2(fast)]
pub fn op_inspector_emit_protocol_event(
  #[string] _event_name: String,
  #[string] _params: String,
) {
  // TODO: inspector channel & protocol notifications
}

struct JSInspectorSession {
  tx: RefCell<Option<mpsc::UnboundedSender<String>>>,
}

impl GarbageCollected for JSInspectorSession {}

#[op2(stack_trace)]
#[cppgc]
pub fn op_inspector_connect<'s, P>(
  isolate: *mut v8::Isolate,
  scope: &mut v8::HandleScope<'s>,
  state: &mut OpState,
  connect_to_main_thread: bool,
  callback: v8::Local<'s, v8::Function>,
) -> Result<JSInspectorSession, Error>
where
  P: NodePermissions + 'static,
{
  state
    .borrow_mut::<P>()
    .check_sys("inspector", "inspector.Session.connect")?;

  if connect_to_main_thread {
    return Err(generic_error("connectToMainThread not supported"));
  }

  let context = scope.get_current_context();
  let context = v8::Global::new(scope, context);
  let callback = v8::Global::new(scope, callback);

  let inspector = state
    .borrow::<Rc<RefCell<JsRuntimeInspector>>>()
    .borrow_mut();

  let tx = inspector.create_raw_session(
    InspectorSessionOptions {
      kind: InspectorSessionKind::NonBlocking {
        wait_for_disconnect: false,
      },
    },
    // The inspector connection does not keep the event loop alive but
    // when the inspector sends a message to the frontend, the JS that
    // that runs may keep the event loop alive so we have to call back
    // synchronously, instead of using the usual LocalInspectorSession
    // UnboundedReceiver<InspectorMsg> API.
    Box::new(move |message| {
      // SAFETY: This function is called directly by the inspector, so
      //   1) The isolate is still valid
      //   2) We are on the same thread as the Isolate
      let scope = unsafe { &mut v8::CallbackScope::new(&mut *isolate) };
      let context = v8::Local::new(scope, context.clone());
      let scope = &mut v8::ContextScope::new(scope, context);
      let scope = &mut v8::TryCatch::new(scope);
      let recv = v8::undefined(scope);
      if let Some(message) = v8::String::new(scope, &message.content) {
        let callback = v8::Local::new(scope, callback.clone());
        callback.call(scope, recv.into(), &[message.into()]);
      }
    }),
  );

  Ok(JSInspectorSession {
    tx: RefCell::new(Some(tx)),
  })
}

#[op2(fast)]
pub fn op_inspector_dispatch(
  #[cppgc] session: &JSInspectorSession,
  #[string] message: String,
) {
  if let Some(tx) = &*session.tx.borrow() {
    let _ = tx.unbounded_send(message);
  }
}

#[op2(fast)]
pub fn op_inspector_disconnect(#[cppgc] session: &JSInspectorSession) {
  drop(session.tx.borrow_mut().take());
}
