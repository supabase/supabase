// Copyright 2018-2024 the Deno authors. MIT license.

use core::pin::Pin;
use core::task::Context;
use core::task::Poll;
use std::cell::RefCell;
use std::future::Future;
use std::marker::PhantomData;
use tokio::runtime::Handle;
use tokio::runtime::RuntimeFlavor;
use tokio_util::sync::CancellationToken;

thread_local! {
  static WALL: RefCell<Option<CancellationToken>> = RefCell::default();
}

/// Equivalent to [`tokio::task::JoinHandle`].
#[repr(transparent)]
pub struct JoinHandle<R> {
  handle: tokio::task::JoinHandle<MaskResultAsSend<R>>,
  _r: PhantomData<R>,
}

impl<R> JoinHandle<R> {
  /// Equivalent to [`tokio::task::JoinHandle::abort`].
  pub fn abort(&self) {
    self.handle.abort()
  }

  pub fn abort_handle(&self) -> tokio::task::AbortHandle {
    self.handle.abort_handle()
  }
}

impl<R> Future for JoinHandle<R> {
  type Output = Result<R, tokio::task::JoinError>;

  fn poll(
    self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> std::task::Poll<Self::Output> {
    // SAFETY: We are sure that handle is valid here
    unsafe {
      let me: &mut Self = Pin::into_inner_unchecked(self);
      let handle = Pin::new_unchecked(&mut me.handle);
      match handle.poll(cx) {
        Poll::Pending => Poll::Pending,
        Poll::Ready(Ok(r)) => Poll::Ready(Ok(r.into_inner())),
        Poll::Ready(Err(e)) => Poll::Ready(Err(e)),
      }
    }
  }
}

pub fn is_wall_set() -> bool {
  WALL.with_borrow(|it| it.is_some())
}

pub fn set_wall() -> CancellationToken {
  let token = CancellationToken::new();
  WALL.with_borrow_mut(|it| {
    if let Some(old_token) = it.take() {
      old_token.cancel();
    }
    *it = Some(token.clone());
  });
  token
}

/// Equivalent to [`tokio::task::spawn`], but does not require the future to be [`Send`]. Must only be
/// used on a [`RuntimeFlavor::CurrentThread`] executor, though this is only checked when running with
/// debug assertions.
#[inline(always)]
pub fn spawn<F: Future<Output = R> + 'static, R: 'static>(
  f: F,
) -> JoinHandle<R> {
  debug_assert!(
    Handle::current().runtime_flavor() == RuntimeFlavor::CurrentThread
  );
  // SAFETY: we know this is a current-thread executor
  let token = WALL.with_borrow(|it| it.clone());
  let future = unsafe { MaskFutureAsSend::new(f) };
  JoinHandle {
    handle: tokio::task::spawn(async move {
      if let Some(token) = token {
        token.cancelled().await;
      }
      future.await
    }),
    _r: Default::default(),
  }
}

/// Equivalent to [`tokio::task::spawn_blocking`]. Currently a thin wrapper around the tokio API, but this
/// may change in the future.
#[inline(always)]
pub fn spawn_blocking<
  F: (FnOnce() -> R) + Send + 'static,
  R: Send + 'static,
>(
  f: F,
) -> JoinHandle<R> {
  let handle = tokio::task::spawn_blocking(|| MaskResultAsSend { result: f() });
  JoinHandle {
    handle,
    _r: Default::default(),
  }
}

#[repr(transparent)]
#[doc(hidden)]
pub struct MaskResultAsSend<R> {
  result: R,
}

/// SAFETY: We ensure that Send bounds are only faked when tokio is running on a current-thread executor
unsafe impl<R> Send for MaskResultAsSend<R> {}

impl<R> MaskResultAsSend<R> {
  #[inline(always)]
  pub fn into_inner(self) -> R {
    self.result
  }
}

#[repr(transparent)]
pub struct MaskFutureAsSend<F> {
  future: F,
}

impl<F> MaskFutureAsSend<F> {
  /// Mark a non-`Send` future as `Send`. This is a trick to be able to use
  /// `tokio::spawn()` (which requires `Send` futures) in a current thread
  /// runtime.
  ///
  /// # Safety
  ///
  /// You must ensure that the future is actually used on the same
  /// thread, ie. always use current thread runtime flavor from Tokio.
  #[inline(always)]
  pub unsafe fn new(future: F) -> Self {
    Self { future }
  }
}

// SAFETY: we are cheating here - this struct is NOT really Send,
// but we need to mark it Send so that we can use `spawn()` in Tokio.
unsafe impl<F> Send for MaskFutureAsSend<F> {}

impl<F: Future> Future for MaskFutureAsSend<F> {
  type Output = MaskResultAsSend<F::Output>;

  fn poll(
    self: Pin<&mut Self>,
    cx: &mut Context<'_>,
  ) -> Poll<MaskResultAsSend<F::Output>> {
    // SAFETY: We are sure that future is valid here
    unsafe {
      let me: &mut MaskFutureAsSend<F> = Pin::into_inner_unchecked(self);
      let future = Pin::new_unchecked(&mut me.future);
      match future.poll(cx) {
        Poll::Pending => Poll::Pending,
        Poll::Ready(result) => Poll::Ready(MaskResultAsSend { result }),
      }
    }
  }
}
