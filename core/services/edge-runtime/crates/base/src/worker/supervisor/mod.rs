use std::future::pending;
use std::sync::Arc;
use std::time::Duration;

use anyhow::anyhow;
use base_mem_check::MemCheckState;
use base_rt::RuntimeState;
use cpu_timer::CPUTimer;
use deno_core::v8;
use deno_core::InspectorSessionKind;
use deno_core::InspectorSessionOptions;
use deno_core::InspectorSessionProxy;
use deno_core::LocalInspectorSession;
use enum_as_inner::EnumAsInner;
use ext_event_worker::events::ShutdownEvent;
use ext_event_worker::events::WorkerEvents;
use ext_event_worker::events::WorkerMemoryUsed;
use ext_runtime::PromiseMetrics;
use ext_workers::context::Timing;
use ext_workers::context::UserWorkerMsgs;
use ext_workers::context::UserWorkerRuntimeOpts;
use futures_util::pin_mut;
use futures_util::task::AtomicWaker;
use tokio::sync::mpsc::UnboundedReceiver;
use tokio::sync::mpsc::{self};
use tokio::sync::oneshot;
use tokio::sync::Mutex;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

use super::pool::SupervisorPolicy;
use super::termination_token::TerminationToken;

use crate::runtime::DenoRuntime;
use crate::server::ServerFlags;
use crate::utils::units::percentage_value;

pub mod strategy_per_request;
pub mod strategy_per_worker;

pub mod v8_handler;

pub use v8_handler::*;

#[repr(C)]
pub struct IsolateMemoryStats {
  pub used_heap_size: usize,
  pub external_memory: usize,
}

pub struct Tokens {
  pub termination: Option<TerminationToken>,
  pub supervise: CancellationToken,
}

pub struct Arguments {
  pub key: Uuid,
  pub runtime_opts: UserWorkerRuntimeOpts,
  pub cpu_usage_metrics_rx: Option<mpsc::UnboundedReceiver<CPUUsageMetrics>>,
  pub supervisor_policy: SupervisorPolicy,
  pub runtime_state: Arc<RuntimeState>,
  pub promise_metrics: PromiseMetrics,
  pub timing: Option<Timing>,
  pub memory_limit_rx: mpsc::UnboundedReceiver<()>,
  pub pool_msg_tx: Option<mpsc::UnboundedSender<UserWorkerMsgs>>,
  pub isolate_memory_usage_tx: oneshot::Sender<IsolateMemoryStats>,
  pub thread_safe_handle: v8::IsolateHandle,
  pub waker: Arc<AtomicWaker>,
  pub tokens: Tokens,
  pub flags: Arc<ServerFlags>,
}

pub struct CPUUsage {
  pub accumulated: i64,
  pub diff: i64,
}

#[derive(EnumAsInner)]
pub enum CPUUsageMetrics {
  Enter(std::thread::ThreadId, CPUTimer),
  Leave(CPUUsage),
}

#[inline]
#[allow(unused)]
fn cpu_budget(conf: &UserWorkerRuntimeOpts) -> u64 {
  conf
    .cpu_time_max_budget_per_task_ms
    .unwrap_or(if cfg!(debug_assertions) {
      conf.cpu_time_soft_limit_ms
    } else {
      1
    })
}

async fn wait_cpu_alarm(
  maybe_alarm: Option<&mut UnboundedReceiver<()>>,
) -> Option<()> {
  match maybe_alarm {
    Some(alarm) => Some(alarm.recv().await?),
    None => None,
  }
}

async fn create_wall_clock_beforeunload_alert(
  wall_clock_limit_ms: u64,
  pct: Option<u8>,
) {
  let dur = pct
    .and_then(|it| percentage_value(wall_clock_limit_ms, it))
    .map(Duration::from_millis);

  if let Some(dur) = dur {
    tokio::time::sleep(dur).await;
  } else {
    pending::<()>().await;
    unreachable!()
  }
}

#[allow(clippy::too_many_arguments)]
pub fn create_supervisor(
  key: Uuid,
  runtime: &mut DenoRuntime,
  policy: SupervisorPolicy,
  termination_event_tx: oneshot::Sender<WorkerEvents>,
  pool_msg_tx: Option<mpsc::UnboundedSender<UserWorkerMsgs>>,
  cpu_usage_metrics_rx: Option<mpsc::UnboundedReceiver<CPUUsageMetrics>>,
  cancel: Option<CancellationToken>,
  timing: Option<Timing>,
  termination_token: Option<TerminationToken>,
  flags: Arc<ServerFlags>,
) -> Result<CancellationToken, anyhow::Error> {
  let (memory_limit_tx, memory_limit_rx) = mpsc::unbounded_channel();
  let (waker, thread_safe_handle) = (
    runtime.waker.clone(),
    runtime.js_runtime.v8_isolate().thread_safe_handle(),
  );

  // we assert supervisor is only run for user workers
  let conf = runtime.conf.as_user_worker().unwrap().clone();
  let mem_check_state = runtime.mem_check_state();
  let termination_request_token = runtime.termination_request_token.clone();
  let runtime_drop_token = runtime.drop_token.clone();

  let giveup_process_requests_token = cancel.clone();
  let supervise_cancel_token = CancellationToken::new();
  let tokens = Tokens {
    termination: termination_token.clone(),
    supervise: supervise_cancel_token.clone(),
  };

  let maybe_inspector_params = runtime.inspector().map(|_| {
    (
      runtime
        .js_runtime
        .inspector()
        .borrow_mut()
        .get_session_sender(),
      runtime.runtime_state.clone(),
    )
  });

  let send_memory_limit_fn = move |kind: &'static str| {
    log::debug!("memory limit triggered: isolate: {:?}, kind: {}", key, kind);

    if memory_limit_tx.send(()).is_err() {
      log::error!(
        "failed to send memory limit reached notification(isolate may already be terminating): isolate: {:?}, kind: {}",
        key, kind
      );
    }
  };

  runtime.add_memory_limit_callback({
    let send_fn = send_memory_limit_fn.clone();
    move |_| {
      send_fn("mem_check");
    }
  });

  runtime.js_runtime.add_near_heap_limit_callback({
    let send_fn = send_memory_limit_fn;
    move |current, _| {
      send_fn("v8");

      // give an allowance on current limit (until the isolate is
      // terminated) we do this so that oom won't end up killing the
      // edge-runtime process
      current * (conf.low_memory_multiplier as usize)
    }
  });

  drop({
    let _rt_guard = base_rt::SUPERVISOR_RT.enter();
    let supervise_cancel_token_inner = supervise_cancel_token.clone();
    let runtime_state = runtime.runtime_state.clone();
    let promise_metrics = runtime.promise_metrics();

    tokio::spawn(async move {
      let (isolate_memory_usage_tx, isolate_memory_usage_rx) =
        oneshot::channel::<IsolateMemoryStats>();

      let args = Arguments {
        key,
        runtime_opts: conf.clone(),
        cpu_usage_metrics_rx,
        supervisor_policy: policy,
        runtime_state,
        promise_metrics,
        timing,
        memory_limit_rx,
        pool_msg_tx,
        isolate_memory_usage_tx,
        thread_safe_handle,
        waker: waker.clone(),
        tokens,
        flags,
      };

      let (reason, cpu_usage_ms) = {
        match policy {
          SupervisorPolicy::PerWorker => {
            strategy_per_worker::supervise(args).await
          }
          SupervisorPolicy::PerRequest { oneshot, .. } => {
            strategy_per_request::supervise(args, oneshot).await
          }
        }
      };

      // NOTE: Sending a signal to the pooler that it is the user worker going
      // disposed down and will not accept awaiting subsequent requests, so
      // they must be re-polled again.
      if let Some(cancel) = giveup_process_requests_token.as_ref() {
        cancel.cancel();
      }

      if let Some((session_tx, state)) = maybe_inspector_params {
        use deno_core::futures::channel::mpsc;
        use deno_core::serde_json::Value;

        let termination_request_token = termination_request_token.clone();

        base_rt::SUPERVISOR_RT
          .spawn_blocking(move || {
            let wait_inspector_disconnect_fut = async move {
              let ls = tokio::task::LocalSet::new();
              ls.run_until(async move {
                if state.is_terminated()
                  || termination_request_token.is_cancelled()
                {
                  return;
                }

                termination_request_token.cancel();

                if state.is_found_inspector_session() {
                  return;
                }

                let (outbound_tx, outbound_rx) = mpsc::unbounded();
                let (inbound_tx, inbound_rx) = mpsc::unbounded();

                if session_tx
                  .unbounded_send(InspectorSessionProxy {
                    tx: outbound_tx,
                    rx: inbound_rx,
                    options: InspectorSessionOptions {
                      kind: InspectorSessionKind::Blocking,
                    },
                  })
                  .is_err()
                {
                  return;
                }

                let session = Arc::new(Mutex::new(LocalInspectorSession::new(
                  inbound_tx,
                  outbound_rx,
                )));

                let send_msg_fn = {
                  |msg| {
                    let state = state.clone();
                    let session = session.clone();
                    async move {
                      let mut session = session.lock().await;
                      let mut int =
                        tokio::time::interval(Duration::from_millis(61));

                      let fut = session.post_message(msg, None::<Value>);

                      pin_mut!(fut);

                      loop {
                        tokio::select! {
                          _ = int.tick() => {
                            if state.is_terminated() {
                              break
                            }
                          }

                          res = &mut fut => {
                            res.unwrap();
                            break
                          }
                        }
                      }
                    }
                  }
                };

                send_msg_fn("Debugger.enable").await;
                send_msg_fn("Runtime.runIfWaitingForDebugger").await;
              })
              .await;
            };

            base_rt::SUPERVISOR_RT.block_on(wait_inspector_disconnect_fut);
          })
          .await
          .unwrap();
      }

      // NOTE: If we issue a hard CPU time limit, It's OK because it is
      // still possible the worker's context is in the v8 event loop. The
      // interrupt callback would be invoked from the V8 engine
      // gracefully. But some case doesn't.
      //
      // Such as the worker going to a retired state due to the soft CPU
      // time limit but not hitting the hard CPU time limit. In this case,
      // we must wake up the worker's event loop manually. Otherwise, the
      // supervisor has to wait until the wall clock future that we placed
      // out on the runtime side is times out.
      waker.wake();

      let memory_report = tokio::select! {
        report = isolate_memory_usage_rx => report.map_err(anyhow::Error::from),
        _ = runtime_drop_token.cancelled() => Err(
          anyhow!("termination requested"
        ))
      };

      let memory_used = match memory_report {
        Ok(v) => WorkerMemoryUsed {
          total: v.used_heap_size + v.external_memory,
          heap: v.used_heap_size,
          external: v.external_memory,
          mem_check_captured: tokio::task::spawn_blocking(move || {
            *mem_check_state.read().unwrap()
          })
          .await
          .unwrap(),
        },

        Err(_) => {
          if !supervise_cancel_token_inner.is_cancelled() {
            log::warn!("isolate memory usage sender dropped");
          }

          WorkerMemoryUsed {
            total: 0,
            heap: 0,
            external: 0,
            mem_check_captured: MemCheckState::default(),
          }
        }
      };

      if !termination_request_token.is_cancelled() {
        termination_request_token.cancel();
        waker.wake();
      }

      // send termination reason
      let termination_event = WorkerEvents::Shutdown(ShutdownEvent {
        reason,
        memory_used,
        cpu_time_used: cpu_usage_ms as usize,
      });

      let _ = termination_event_tx.send(termination_event);
    })
  });

  Ok(supervise_cancel_token)
}
