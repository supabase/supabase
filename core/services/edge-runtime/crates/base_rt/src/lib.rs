use std::collections::HashMap;
use std::num::NonZeroUsize;
use std::sync::atomic::AtomicI64;
use std::sync::atomic::Ordering;
use std::sync::Arc;

use cpu_timer::get_thread_time;
use deno_core::anyhow::Context;
use deno_core::error::AnyError;
use deno_core::futures::task::AtomicWaker;
use deno_core::OpState;
use deno_core::Resource;
use deno_core::V8CrossThreadTaskSpawner;
use once_cell::sync::Lazy;
use tokio::runtime::Handle;
use tokio::sync::oneshot;
use tokio_util::sync::CancellationToken;
use tokio_util::sync::WaitForCancellationFutureOwned;
use tracing::debug;
use tracing::debug_span;
use tracing::Instrument;

mod runtime_state;

pub mod error;

pub use runtime_state::RuntimeState;

pub const DEFAULT_PRIMARY_WORKER_POOL_SIZE: usize = 2;
pub const DEFAULT_USER_WORKER_POOL_SIZE: usize = 1;

pub static SUPERVISOR_RT: Lazy<tokio::runtime::Runtime> = Lazy::new(|| {
  tokio::runtime::Builder::new_multi_thread()
    .enable_all()
    .thread_name("sb-supervisor")
    .build()
    .unwrap()
});

// NOTE: This pool is for the main and event workers. The reason why they should
// separate from the user worker pool is they can starve them if user workers
// are saturated.
pub static PRIMARY_WORKER_RT: Lazy<tokio_util::task::LocalPoolHandle> =
  Lazy::new(|| {
    let maybe_pool_size =
      std::env::var("EDGE_RUNTIME_PRIMARY_WORKER_POOL_SIZE")
        .ok()
        .and_then(|it| it.parse::<usize>().ok())
        .map(|it| {
          if it < DEFAULT_PRIMARY_WORKER_POOL_SIZE {
            DEFAULT_PRIMARY_WORKER_POOL_SIZE
          } else {
            it
          }
        });

    tokio_util::task::LocalPoolHandle::new(
      maybe_pool_size.unwrap_or(DEFAULT_PRIMARY_WORKER_POOL_SIZE),
    )
  });

pub static USER_WORKER_RT: Lazy<tokio_util::task::LocalPoolHandle> =
  Lazy::new(|| {
    let maybe_pool_size = std::env::var("EDGE_RUNTIME_WORKER_POOL_SIZE")
      .ok()
      .and_then(|it| it.parse::<usize>().ok())
      .map(|it| {
        if it < DEFAULT_USER_WORKER_POOL_SIZE {
          DEFAULT_USER_WORKER_POOL_SIZE
        } else {
          it
        }
      });

    tokio_util::task::LocalPoolHandle::new(if cfg!(debug_assertions) {
      maybe_pool_size.unwrap_or(DEFAULT_USER_WORKER_POOL_SIZE)
    } else {
      maybe_pool_size.unwrap_or(
        std::thread::available_parallelism()
          .ok()
          .map(NonZeroUsize::get)
          .unwrap_or(DEFAULT_USER_WORKER_POOL_SIZE),
      )
    })
  });

#[derive(Clone)]
pub struct DropToken(pub CancellationToken);

impl Resource for DropToken {}

#[derive(Clone)]
pub struct DenoRuntimeDropToken(pub DropToken);

impl std::ops::Deref for DenoRuntimeDropToken {
  type Target = CancellationToken;

  fn deref(&self) -> &Self::Target {
    &self.0 .0
  }
}

impl DenoRuntimeDropToken {
  pub fn cancelled_owned(self) -> WaitForCancellationFutureOwned {
    self.0 .0.cancelled_owned()
  }
}

pub fn get_current_cpu_time_ns() -> Result<i64, AnyError> {
  get_thread_time().context("can't get current thread time")
}

pub trait BlockingScopeCPUUsageMetricExt {
  fn spawn_cpu_accumul_blocking_scope<F, R>(
    self,
    scope_fn: F,
  ) -> tokio::task::JoinHandle<R>
  where
    F: FnOnce() -> R + Send + 'static,
    R: Send + 'static;
}

#[derive(Default)]
pub struct BlockingScopeCPUUsage(Arc<AtomicI64>);

impl BlockingScopeCPUUsage {
  pub fn get_cpu_usage_ns_and_reset(state: &mut OpState) -> i64 {
    let Some(storage) = state.try_borrow_mut::<BlockingScopeCPUUsage>() else {
      return 0;
    };

    storage.0.swap(0, Ordering::SeqCst)
  }
}

impl BlockingScopeCPUUsageMetricExt for &mut OpState {
  fn spawn_cpu_accumul_blocking_scope<F, R>(
    self,
    scope_fn: F,
  ) -> tokio::task::JoinHandle<R>
  where
    F: FnOnce() -> R + Send + 'static,
    R: Send + 'static,
  {
    let drop_token = self.borrow::<DenoRuntimeDropToken>().clone();
    let cross_thread_spawner =
      self.borrow::<V8CrossThreadTaskSpawner>().clone();
    let usage = {
      if let Some(store) = self.try_borrow_mut::<BlockingScopeCPUUsage>() {
        store
      } else {
        self.put(BlockingScopeCPUUsage::default());
        self.borrow_mut()
      }
    }
    .0
    .clone();

    tokio::task::spawn_blocking(move || {
      let _span = debug_span!("cpu_accumul_scope").entered();
      let handle = Handle::current();

      let (tx, rx) = oneshot::channel::<()>();
      let current_cpu_time_ns = get_current_cpu_time_ns().unwrap_or_default();
      let result = scope_fn();
      let cpu_time_after_drop_ns =
        get_current_cpu_time_ns().unwrap_or(current_cpu_time_ns);
      let diff_cpu_time_ns =
        std::cmp::max(0, cpu_time_after_drop_ns - current_cpu_time_ns);

      usage.fetch_add(diff_cpu_time_ns, Ordering::SeqCst);
      cross_thread_spawner.spawn({
        let span = debug_span!("in v8 stack");
        move |_| {
          let _span = span.entered();
          tx.send(()).unwrap();
        }
      });

      handle.block_on({
        async move {
          tokio::select! {
            _ = rx => {}
            _ = drop_token.cancelled() => {
              debug!(
                js_runtime_dropped = true,
                unreported_blocking_cpu_time_ms = diff_cpu_time_ns / 1_000_000
              );
            }
          }
        }
        .instrument(debug_span!("wait v8 task done"))
      });

      result
    })
  }
}

#[derive(Debug, Clone)]
pub struct RuntimeWaker(pub Arc<AtomicWaker>);

#[derive(Debug, Clone)]
pub struct RuntimeOtelExtraAttributes(
  pub HashMap<opentelemetry::Key, opentelemetry::Value>,
);
