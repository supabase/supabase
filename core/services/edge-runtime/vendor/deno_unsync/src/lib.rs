// Copyright 2018-2024 the Deno authors. MIT license.

mod flag;
pub mod future;
pub mod mpsc;
pub mod sync;
mod task;
mod task_queue;
#[cfg(feature = "tokio")]
mod tokio;
mod waker;

pub use flag::Flag;
pub use task_queue::TaskQueue;
pub use task_queue::TaskQueuePermit;
pub use task_queue::TaskQueuePermitAcquireFuture;
pub use waker::UnsyncWaker;

#[cfg(feature = "tokio")]
pub use self::tokio::*;

/// Marker for items that are ![`Send`].
#[derive(Copy, Clone, Default, Eq, PartialEq, PartialOrd, Ord, Debug, Hash)]
pub struct UnsendMarker(
  std::marker::PhantomData<std::sync::MutexGuard<'static, ()>>,
);
