// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::collections::LinkedList;
use std::sync::Arc;

use deno_core::futures::task::AtomicWaker;
use deno_core::futures::Future;
use deno_core::parking_lot::Mutex;

use super::AtomicFlag;

#[derive(Debug, Default)]
struct TaskQueueTaskItem {
  is_ready: AtomicFlag,
  is_future_dropped: AtomicFlag,
  waker: AtomicWaker,
}

#[derive(Debug, Default)]
struct TaskQueueTasks {
  is_running: bool,
  items: LinkedList<Arc<TaskQueueTaskItem>>,
}

/// A queue that executes tasks sequentially one after the other
/// ensuring order and that no task runs at the same time as another.
///
/// Note that this differs from tokio's semaphore in that the order
/// is acquired synchronously.
#[derive(Debug, Default)]
pub struct TaskQueue {
  tasks: Mutex<TaskQueueTasks>,
}

impl TaskQueue {
  /// Acquires a permit where the tasks are executed one at a time
  /// and in the order that they were acquired.
  pub fn acquire(&self) -> TaskQueuePermitAcquireFuture<'_> {
    TaskQueuePermitAcquireFuture::new(self)
  }

  /// Alternate API that acquires a permit internally
  /// for the duration of the future.
  #[allow(unused)]
  pub fn run<'a, R>(
    &'a self,
    future: impl Future<Output = R> + 'a,
  ) -> impl Future<Output = R> + 'a {
    let acquire_future = self.acquire();
    async move {
      let permit = acquire_future.await;
      let result = future.await;
      drop(permit); // explicit for clarity
      result
    }
  }

  fn raise_next(&self) {
    let front_item = {
      let mut tasks = self.tasks.lock();

      // clear out any wakers for futures that were dropped
      while let Some(front_waker) = tasks.items.front() {
        if front_waker.is_future_dropped.is_raised() {
          tasks.items.pop_front();
        } else {
          break;
        }
      }
      let front_item = tasks.items.pop_front();
      tasks.is_running = front_item.is_some();
      front_item
    };

    // wake up the next waker
    if let Some(front_item) = front_item {
      front_item.is_ready.raise();
      front_item.waker.wake();
    }
  }
}

/// A permit that when dropped will allow another task to proceed.
pub struct TaskQueuePermit<'a>(&'a TaskQueue);

impl<'a> Drop for TaskQueuePermit<'a> {
  fn drop(&mut self) {
    self.0.raise_next();
  }
}

pub struct TaskQueuePermitAcquireFuture<'a> {
  task_queue: Option<&'a TaskQueue>,
  item: Arc<TaskQueueTaskItem>,
}

impl<'a> TaskQueuePermitAcquireFuture<'a> {
  pub fn new(task_queue: &'a TaskQueue) -> Self {
    // acquire the waker position synchronously
    let mut tasks = task_queue.tasks.lock();
    let item = if !tasks.is_running {
      tasks.is_running = true;
      let item = Arc::new(TaskQueueTaskItem::default());
      item.is_ready.raise();
      item
    } else {
      let item = Arc::new(TaskQueueTaskItem::default());
      tasks.items.push_back(item.clone());
      item
    };
    drop(tasks);
    Self {
      task_queue: Some(task_queue),
      item,
    }
  }
}

impl<'a> Drop for TaskQueuePermitAcquireFuture<'a> {
  fn drop(&mut self) {
    if let Some(task_queue) = self.task_queue.take() {
      if self.item.is_ready.is_raised() {
        task_queue.raise_next();
      } else {
        self.item.is_future_dropped.raise();
      }
    }
  }
}

impl<'a> Future for TaskQueuePermitAcquireFuture<'a> {
  type Output = TaskQueuePermit<'a>;

  fn poll(
    mut self: std::pin::Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> std::task::Poll<Self::Output> {
    if self.item.is_ready.is_raised() {
      std::task::Poll::Ready(TaskQueuePermit(self.task_queue.take().unwrap()))
    } else {
      self.item.waker.register(cx.waker());
      std::task::Poll::Pending
    }
  }
}
