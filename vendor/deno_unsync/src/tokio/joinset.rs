// Copyright 2018-2024 the Deno authors. MIT license.
// Some code and comments under MIT license where adapted from Tokio code
// Copyright (c) 2023 Tokio Contributors

use std::future::Future;
use std::task::Context;
use std::task::Poll;
use std::task::Waker;
use tokio::task::AbortHandle;
use tokio::task::JoinError;

use super::task::MaskFutureAsSend;
use super::task::MaskResultAsSend;

/// Wraps the tokio [`JoinSet`] to make it !Send-friendly and to make it easier and safer for us to
/// poll while empty.
pub struct JoinSet<T> {
  joinset: tokio::task::JoinSet<MaskResultAsSend<T>>,
  /// If join_next returns Ready(None), we stash the waker
  waker: Option<Waker>,
}

impl<T> Default for JoinSet<T> {
  fn default() -> Self {
    Self {
      joinset: Default::default(),
      waker: None,
    }
  }
}

impl<T: 'static> JoinSet<T> {
  /// Spawn the provided task on the `JoinSet`, returning an [`AbortHandle`]
  /// that can be used to remotely cancel the task.
  ///
  /// The provided future will start running in the background immediately
  /// when this method is called, even if you don't await anything on this
  /// `JoinSet`.
  ///
  /// # Panics
  ///
  /// This method panics if called outside of a Tokio runtime.
  ///
  /// [`AbortHandle`]: tokio::task::AbortHandle
  #[track_caller]
  pub fn spawn<F>(&mut self, task: F) -> AbortHandle
  where
    F: Future<Output = T>,
    F: 'static,
    T: 'static,
  {
    // SAFETY: We only use this with the single-thread executor
    let handle = self.joinset.spawn(unsafe { MaskFutureAsSend::new(task) });

    // If someone had called poll_join_next while we were empty, ask them to poll again
    // so we can properly register the waker with the underlying JoinSet.
    if let Some(waker) = self.waker.take() {
      waker.wake();
    }
    handle
  }

  /// Returns the number of tasks currently in the `JoinSet`.
  pub fn len(&self) -> usize {
    self.joinset.len()
  }

  /// Returns whether the `JoinSet` is empty.
  pub fn is_empty(&self) -> bool {
    self.joinset.is_empty()
  }

  /// Waits until one of the tasks in the set completes and returns its output.
  ///
  /// # Cancel Safety
  ///
  /// This method is cancel safe. If `join_next` is used as the event in a `tokio::select!`
  /// statement and some other branch completes first, it is guaranteed that no tasks were
  /// removed from this `JoinSet`.
  pub fn poll_join_next(
    &mut self,
    cx: &mut Context,
  ) -> Poll<Result<T, JoinError>> {
    match self.joinset.poll_join_next(cx) {
      Poll::Ready(Some(res)) => Poll::Ready(res.map(|res| res.into_inner())),
      Poll::Ready(None) => {
        // Stash waker
        self.waker = Some(cx.waker().clone());
        Poll::Pending
      }
      Poll::Pending => Poll::Pending,
    }
  }

  /// Waits until one of the tasks in the set completes and returns its output.
  ///
  /// Returns `None` if the set is empty.
  ///
  /// # Cancel Safety
  ///
  /// This method is cancel safe. If `join_next` is used as the event in a `tokio::select!`
  /// statement and some other branch completes first, it is guaranteed that no tasks were
  /// removed from this `JoinSet`.
  pub async fn join_next(&mut self) -> Option<Result<T, JoinError>> {
    self
      .joinset
      .join_next()
      .await
      .map(|result| result.map(|res| res.into_inner()))
  }

  /// Aborts all tasks on this `JoinSet`.
  ///
  /// This does not remove the tasks from the `JoinSet`. To wait for the tasks to complete
  /// cancellation, you should call `join_next` in a loop until the `JoinSet` is empty.
  pub fn abort_all(&mut self) {
    self.joinset.abort_all();
  }

  /// Removes all tasks from this `JoinSet` without aborting them.
  ///
  /// The tasks removed by this call will continue to run in the background even if the `JoinSet`
  /// is dropped.
  pub fn detach_all(&mut self) {
    self.joinset.detach_all();
  }
}
