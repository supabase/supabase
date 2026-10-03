use std::future::pending;
use std::sync::atomic::Ordering;
use std::time::Duration;

use cpu_timer::CPUTimer;
use ext_event_worker::events::ShutdownReason;
use ext_workers::context::Timing;
use ext_workers::context::TimingStatus;
use ext_workers::context::UserWorkerMsgs;
use ext_workers::context::UserWorkerRuntimeOpts;
use tokio::sync::mpsc;
use tokio::time::Instant;
use tracing::Instrument;

use crate::runtime::WillTerminateReason;
use crate::worker::supervisor::create_wall_clock_beforeunload_alert;
use crate::worker::supervisor::v8_handle_beforeunload;
use crate::worker::supervisor::v8_handle_early_retire;
use crate::worker::supervisor::v8_handle_termination;
use crate::worker::supervisor::wait_cpu_alarm;
use crate::worker::supervisor::CPUUsage;
use crate::worker::supervisor::CPUUsageMetrics;
use crate::worker::supervisor::Tokens;
use crate::worker::supervisor::V8HandleBeforeunloadData;
use crate::worker::supervisor::V8HandleTerminationData;

use super::Arguments;

pub async fn supervise(
  args: Arguments,
  oneshot: bool,
) -> (ShutdownReason, i64) {
  let Arguments {
    key,
    runtime_opts,
    timing,
    cpu_usage_metrics_rx,
    mut memory_limit_rx,
    pool_msg_tx,
    isolate_memory_usage_tx,
    thread_safe_handle,
    waker,
    tokens: Tokens {
      termination,
      supervise,
    },
    flags,
    ..
  } = args;

  let Timing {
    status: TimingStatus { demand, is_retired },
    req: (mut req_start_rx, mut req_end_rx),
    ..
  } = timing.unwrap_or_default();

  let _guard = scopeguard::guard(is_retired, |v| {
    v.raise();

    if thread_safe_handle
      .request_interrupt(v8_handle_early_retire, std::ptr::null_mut())
    {
      waker.wake();
    }
  });

  let mut cpu_timer = Option::<CPUTimer>::None;

  let UserWorkerRuntimeOpts {
    worker_timeout_ms,
    cpu_time_soft_limit_ms,
    cpu_time_hard_limit_ms,
    ..
  } = runtime_opts;

  let is_wall_clock_limit_disabled = worker_timeout_ms == 0;
  let is_cpu_time_limit_disabled =
    cpu_time_soft_limit_ms == 0 && cpu_time_hard_limit_ms == 0;
  let mut is_worker_entered = false;
  let mut is_wall_clock_beforeunload_armed = false;

  let mut cpu_usage_metrics_rx = cpu_usage_metrics_rx.unwrap();
  let mut cpu_usage_ms = 0i64;
  let mut cpu_usage_accumulated_ms = 0i64;
  let mut cpu_timer_rx = None::<mpsc::UnboundedReceiver<()>>;

  let mut complete_reason = None::<ShutdownReason>;
  let mut req_ack_count = 0usize;
  let mut req_start_ack = false;

  let wall_clock_limit_ms = if worker_timeout_ms < 1 {
    1
  } else {
    worker_timeout_ms
  };

  let wall_clock_duration = Duration::from_millis(wall_clock_limit_ms);
  let wall_clock_duration_alert = tokio::time::sleep(wall_clock_duration);
  let wall_clock_beforeunload_alert = create_wall_clock_beforeunload_alert(
    wall_clock_limit_ms,
    flags.beforeunload_wall_clock_pct,
  );

  let reset_cpu_timer_fn = |cpu_timer: Option<&CPUTimer>| {
    if let Some(Err(err)) =
      cpu_timer.map(|it| it.reset(cpu_time_hard_limit_ms, 0))
    {
      log::error!("can't reset cpu timer: {}", err);
    }
  };

  tokio::pin!(wall_clock_duration_alert);
  tokio::pin!(wall_clock_beforeunload_alert);

  loop {
    tokio::select! {
      _ = supervise.cancelled() => {
          return (ShutdownReason::TerminationRequested, cpu_usage_ms);
      }

      _ = async {
          match termination.as_ref() {
              Some(token) => token.inbound.cancelled().await,
              None => pending().await,
          }
      } => {
          complete_reason = Some(ShutdownReason::TerminationRequested);
      }

      Some(metrics) = cpu_usage_metrics_rx.recv() => {
        match metrics {
          CPUUsageMetrics::Enter(_thread_id, timer) => {
            assert!(!is_worker_entered);
            is_worker_entered = true;

            if !is_cpu_time_limit_disabled {
              cpu_timer_rx = Some(timer.set_channel().in_current_span().await);
              cpu_timer = Some(timer);
              reset_cpu_timer_fn(cpu_timer.as_ref());
            }
          }

          CPUUsageMetrics::Leave(CPUUsage { accumulated, diff }) => {
            assert!(is_worker_entered);

            is_worker_entered = false;
            cpu_usage_ms += diff / 1_000_000;
            cpu_usage_accumulated_ms = accumulated / 1_000_000;

            if !is_cpu_time_limit_disabled {
              if cpu_usage_ms >= cpu_time_hard_limit_ms as i64 {
                log::error!("CPU time limit reached: isolate: {:?}", key);
                complete_reason = Some(ShutdownReason::CPUTime);
              }

              reset_cpu_timer_fn(cpu_timer.as_ref());
            }

            cpu_timer = None;
          }
        }
      }

      Some(_) = async {
        if cpu_timer_rx.is_some() {
          wait_cpu_alarm(cpu_timer_rx.as_mut()).await
        } else {
          pending::<_>().await
        }
      } => {
        if is_worker_entered && req_start_ack {
          log::error!("CPU time limit reached: isolate: {:?}", key);
          complete_reason = Some(ShutdownReason::CPUTime);
        }
      }

      Some(notify) = req_start_rx.recv() => {
        // INVARIANT: This branch MUST not be satisfied more than once during
        // the same request cycle.
        assert!(!req_start_ack, "supervisor has seen request start signal twice");

        notify.notify_one();
        reset_cpu_timer_fn(cpu_timer.as_ref());

        cpu_usage_ms = 0;
        req_start_ack = true;
        complete_reason = None;
      }

      Some(_) = req_end_rx.recv() => {
        // INVARIANT: This branch MUST be satisfied only once after the request
        // start signal has arrived during the same request cycle.
        assert!(
          req_start_ack,
          "supervisor observed the request end signal but did not see request start signal"
        );

        req_ack_count += 1;
        complete_reason = Some(ShutdownReason::EarlyDrop);
      }

      _ = &mut wall_clock_duration_alert, if !is_wall_clock_limit_disabled => {
        if !oneshot && req_ack_count != demand.load(Ordering::Acquire) {
          wall_clock_duration_alert
            .as_mut()
            .reset(Instant::now() + wall_clock_duration);

          continue;
        } else {
          log::error!("wall clock duraiton reached: isolate: {:?}", key);
          complete_reason = Some(ShutdownReason::WallClockTime);
        }
      }

      _ = &mut wall_clock_beforeunload_alert,
        if !is_wall_clock_limit_disabled && !is_wall_clock_beforeunload_armed
      => {
        let data_ptr_mut = Box::into_raw(Box::new(V8HandleBeforeunloadData {
            reason: WillTerminateReason::WallClock
        }));

        if thread_safe_handle
          .request_interrupt(v8_handle_beforeunload, data_ptr_mut as *mut _)
        {
          waker.wake();
        } else {
          drop(unsafe { Box::from_raw(data_ptr_mut)});
        }

        is_wall_clock_beforeunload_armed = true;
      }

      Some(_) = memory_limit_rx.recv() => {
        log::error!("memory limit reached for the worker: isolate: {:?}", key);
        complete_reason = Some(ShutdownReason::Memory);
      }
    }

    match complete_reason.take() {
      Some(ShutdownReason::EarlyDrop) if !oneshot => {
        req_start_ack = false;
        wall_clock_duration_alert
          .as_mut()
          .reset(Instant::now() + wall_clock_duration);

        if let Some(tx) = pool_msg_tx.clone() {
          if tx.send(UserWorkerMsgs::Idle(key)).is_err() {
            log::error!("failed to send idle msg to pool: {:?}", key);
          }
        }

        continue;
      }

      Some(reason) => {
        let data_ptr_mut = Box::into_raw(Box::new(V8HandleTerminationData {
          should_terminate: true,
          isolate_memory_usage_tx: Some(isolate_memory_usage_tx),
        }));

        if thread_safe_handle
          .request_interrupt(v8_handle_termination, data_ptr_mut as *mut _)
        {
          waker.wake();
        } else {
          drop(unsafe { Box::from_raw(data_ptr_mut) });
        }

        return (reason, cpu_usage_accumulated_ms);
      }

      None => continue,
    }
  }
}
