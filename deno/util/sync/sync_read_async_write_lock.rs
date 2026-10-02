// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use deno_core::parking_lot::RwLock;
use deno_core::parking_lot::RwLockReadGuard;
use deno_core::parking_lot::RwLockWriteGuard;

use super::TaskQueue;
use super::TaskQueuePermit;

/// A lock that can be read synchronously at any time (including when
/// being written to), but must write asynchronously.
pub struct SyncReadAsyncWriteLockWriteGuard<'a, T: Send + Sync> {
  _update_permit: TaskQueuePermit<'a>,
  data: &'a RwLock<T>,
}

impl<'a, T: Send + Sync> SyncReadAsyncWriteLockWriteGuard<'a, T> {
  pub fn read(&self) -> RwLockReadGuard<'_, T> {
    self.data.read()
  }

  /// Warning: Only `write()` with data you created within this
  /// write this `SyncReadAsyncWriteLockWriteGuard`.
  ///
  /// ```rs
  /// let mut data = lock.write().await;
  ///
  /// let mut data = data.read().clone();
  /// data.value = 2;
  /// *data.write() = data;
  /// ```
  pub fn write(&self) -> RwLockWriteGuard<'_, T> {
    self.data.write()
  }
}

/// A lock that can only be
pub struct SyncReadAsyncWriteLock<T: Send + Sync> {
  data: RwLock<T>,
  update_queue: TaskQueue,
}

impl<T: Send + Sync> SyncReadAsyncWriteLock<T> {
  pub fn new(data: T) -> Self {
    Self {
      data: RwLock::new(data),
      update_queue: TaskQueue::default(),
    }
  }

  pub fn read(&self) -> RwLockReadGuard<'_, T> {
    self.data.read()
  }

  pub async fn acquire(&self) -> SyncReadAsyncWriteLockWriteGuard<'_, T> {
    let update_permit = self.update_queue.acquire().await;
    SyncReadAsyncWriteLockWriteGuard {
      _update_permit: update_permit,
      data: &self.data,
    }
  }
}
