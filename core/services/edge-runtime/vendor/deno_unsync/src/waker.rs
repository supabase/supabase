// Copyright 2018-2024 the Deno authors. MIT license.

use std::cell::UnsafeCell;
use std::task::Waker;

use crate::UnsendMarker;

/// A ![`Sync`] and ![`Sync`] equivalent to `AtomicWaker`.
#[derive(Default)]
pub struct UnsyncWaker {
  waker: UnsafeCell<Option<Waker>>,
  _unsend_marker: UnsendMarker,
}

impl UnsyncWaker {
  /// Register a waker if the waker represents a different waker than is already stored.
  pub fn register(&self, waker: &Waker) {
    // SAFETY: This is We can guarantee no other threads are accessing this field as
    // we are !Send and !Sync.
    unsafe {
      if let Some(old_waker) = &mut *self.waker.get() {
        if old_waker.will_wake(waker) {
          return;
        }
      }
      *self.waker.get() = Some(waker.clone())
    }
  }

  /// If a waker has been registered, wake the contained [`Waker`], unregistering it at the same time.
  pub fn wake(&self) {
    // SAFETY: This is We can guarantee no other threads are accessing this field as
    // we are !Send and !Sync.
    unsafe {
      if let Some(waker) = (*self.waker.get()).take() {
        waker.wake();
      }
    }
  }

  /// If a waker has been registered, wake the contained [`Waker`], maintaining it for later use.
  pub fn wake_by_ref(&self) {
    // SAFETY: This is We can guarantee no other threads are accessing this field as
    // we are !Send and !Sync.
    unsafe {
      if let Some(waker) = &mut *self.waker.get() {
        waker.wake_by_ref();
      }
    }
  }
}
