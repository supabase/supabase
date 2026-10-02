//! # Warning
//!
//! Do not directly call v8 functions that are likely to execute deno ops within the interrupted
//! context. This may cause a panic due to the reentrancy check.
//!
//! If you need to call a v8 function that has side effects that might be calling the deno ops, you
//! can safely call it through [`V8TaskSpawner`].

use deno_core::v8;
use deno_core::JsRuntime;
use deno_core::V8TaskSpawner;
use tokio::sync::oneshot;
use tokio_util::sync::CancellationToken;
use tracing::debug;
use tracing::instrument;

use crate::runtime::MaybeDenoRuntime;
use crate::runtime::WillTerminateReason;

use super::IsolateMemoryStats;

#[repr(C)]
pub struct V8HandleTerminationData {
  pub should_terminate: bool,
  pub isolate_memory_usage_tx: Option<oneshot::Sender<IsolateMemoryStats>>,
}

pub extern "C" fn v8_handle_termination(
  isolate: &mut v8::Isolate,
  data: *mut std::ffi::c_void,
) {
  let mut data = unsafe { Box::from_raw(data as *mut V8HandleTerminationData) };

  // log memory usage
  let mut heap_stats = v8::HeapStatistics::default();

  isolate.get_heap_statistics(&mut heap_stats);

  let usage = IsolateMemoryStats {
    used_heap_size: heap_stats.used_heap_size(),
    external_memory: heap_stats.external_memory(),
  };

  if let Some(usage_tx) = data.isolate_memory_usage_tx.take() {
    if usage_tx.send(usage).is_err() {
      log::error!(
        "failed to send isolate memory usage - receiver may have been dropped"
      );
    }
  }

  if data.should_terminate {
    isolate.terminate_execution();
  }
}

#[repr(C)]
pub struct V8HandleBeforeunloadData {
  pub reason: WillTerminateReason,
}

pub extern "C" fn v8_handle_beforeunload(
  isolate: &mut v8::Isolate,
  data: *mut std::ffi::c_void,
) {
  let data = unsafe { Box::from_raw(data as *mut V8HandleBeforeunloadData) };

  JsRuntime::op_state_from(isolate)
    .borrow()
    .borrow::<V8TaskSpawner>()
    .spawn(move |scope| {
      if let Err(err) = MaybeDenoRuntime::<()>::Isolate(scope)
        .dispatch_beforeunload_event(data.reason)
      {
        log::error!(
          "found an error while dispatching the beforeunload event: {}",
          err
        );
      }
    });
}

#[repr(C)]
pub struct V8HandleEarlyDropData {
  pub token: CancellationToken,
}

pub extern "C" fn v8_handle_early_drop_beforeunload(
  isolate: &mut v8::Isolate,
  data: *mut std::ffi::c_void,
) {
  let data = unsafe { Box::from_raw(data as *mut V8HandleEarlyDropData) };

  JsRuntime::op_state_from(isolate)
    .borrow()
    .borrow::<V8TaskSpawner>()
    .spawn(move |scope| {
      if let Err(err) = MaybeDenoRuntime::<()>::Isolate(scope)
        .dispatch_beforeunload_event(WillTerminateReason::EarlyDrop)
      {
        log::error!(
          "found an error while dispatching the beforeunload event: {}",
          err
        );
      } else {
        data.token.cancel();
      }
    });
}

#[instrument(level = "debug", skip_all)]
pub extern "C" fn v8_handle_early_retire(
  isolate: &mut v8::Isolate,
  _data: *mut std::ffi::c_void,
) {
  isolate.low_memory_notification();
  debug!("sent low mem notification");
}

#[instrument(level = "debug", skip_all)]
pub extern "C" fn v8_handle_drain(
  isolate: &mut v8::Isolate,
  _data: *mut std::ffi::c_void,
) {
  JsRuntime::op_state_from(isolate)
    .borrow()
    .borrow::<V8TaskSpawner>()
    .spawn(move |scope| {
      if let Err(err) =
        MaybeDenoRuntime::<()>::Isolate(scope).dispatch_drain_event()
      {
        log::error!(
          "found an error while dispatching the drain event: {}",
          err
        );
      }
    });
}
