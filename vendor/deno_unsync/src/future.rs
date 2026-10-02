// Copyright 2018-2024 the Deno authors. MIT license.

use parking_lot::Mutex;
use std::cell::RefCell;
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use std::sync::Arc;
use std::task::Context;
use std::task::Wake;
use std::task::Waker;

use crate::sync::AtomicFlag;

impl<T: ?Sized> LocalFutureExt for T where T: Future {}

pub trait LocalFutureExt: std::future::Future {
  fn shared_local(self) -> SharedLocal<Self>
  where
    Self: Sized,
    Self::Output: Clone,
  {
    SharedLocal::new(self)
  }
}

enum FutureOrOutput<TFuture: Future> {
  Future(TFuture),
  Output(TFuture::Output),
}

impl<TFuture: Future> std::fmt::Debug for FutureOrOutput<TFuture>
where
  TFuture::Output: std::fmt::Debug,
{
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Future(_) => f.debug_tuple("Future").field(&"<pending>").finish(),
      Self::Output(arg0) => f.debug_tuple("Result").field(arg0).finish(),
    }
  }
}

struct SharedLocalData<TFuture: Future> {
  future_or_output: FutureOrOutput<TFuture>,
}

impl<TFuture: Future> std::fmt::Debug for SharedLocalData<TFuture>
where
  TFuture::Output: std::fmt::Debug,
{
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("SharedLocalData")
      .field("future_or_output", &self.future_or_output)
      .finish()
  }
}

struct SharedLocalInner<TFuture: Future> {
  data: RefCell<SharedLocalData<TFuture>>,
  child_waker_state: Arc<ChildWakerState>,
}

impl<TFuture: Future> std::fmt::Debug for SharedLocalInner<TFuture>
where
  TFuture::Output: std::fmt::Debug,
{
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("SharedLocalInner")
      .field("data", &self.data)
      .field("child_waker_state", &self.child_waker_state)
      .finish()
  }
}

/// A !Send-friendly future whose result can be awaited multiple times.
#[must_use = "futures do nothing unless you `.await` or poll them"]
pub struct SharedLocal<TFuture: Future>(Rc<SharedLocalInner<TFuture>>);

impl<TFuture: Future> Clone for SharedLocal<TFuture>
where
  TFuture::Output: Clone,
{
  fn clone(&self) -> Self {
    Self(self.0.clone())
  }
}

impl<TFuture: Future> std::fmt::Debug for SharedLocal<TFuture>
where
  TFuture::Output: std::fmt::Debug,
{
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_tuple("SharedLocal").field(&self.0).finish()
  }
}

impl<TFuture: Future> SharedLocal<TFuture>
where
  TFuture::Output: Clone,
{
  pub fn new(future: TFuture) -> Self {
    SharedLocal(Rc::new(SharedLocalInner {
      data: RefCell::new(SharedLocalData {
        future_or_output: FutureOrOutput::Future(future),
      }),
      child_waker_state: Arc::new(ChildWakerState {
        can_poll: AtomicFlag::raised(),
        wakers: Default::default(),
      }),
    }))
  }
}

impl<TFuture: Future> std::future::Future for SharedLocal<TFuture>
where
  TFuture::Output: Clone,
{
  type Output = TFuture::Output;

  fn poll(
    self: std::pin::Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> std::task::Poll<Self::Output> {
    use std::task::Poll;

    let mut inner = self.0.data.borrow_mut();
    match &mut inner.future_or_output {
      FutureOrOutput::Future(fut) => {
        self.0.child_waker_state.wakers.push(cx.waker().clone());
        if self.0.child_waker_state.can_poll.lower() {
          let child_waker = Waker::from(self.0.child_waker_state.clone());
          let mut child_cx = Context::from_waker(&child_waker);
          let fut = unsafe { Pin::new_unchecked(fut) };
          match fut.poll(&mut child_cx) {
            Poll::Ready(result) => {
              inner.future_or_output = FutureOrOutput::Output(result.clone());
              drop(inner); // stop borrow_mut
              let wakers = self.0.child_waker_state.wakers.take_all();
              for waker in wakers {
                waker.wake();
              }
              Poll::Ready(result)
            }
            Poll::Pending => Poll::Pending,
          }
        } else {
          Poll::Pending
        }
      }
      FutureOrOutput::Output(result) => Poll::Ready(result.clone()),
    }
  }
}

#[derive(Debug, Default)]
struct WakerStore(Mutex<Vec<Waker>>);

impl WakerStore {
  pub fn take_all(&self) -> Vec<Waker> {
    let mut wakers = self.0.lock();
    std::mem::take(&mut *wakers)
  }

  pub fn clone_all(&self) -> Vec<Waker> {
    self.0.lock().clone()
  }

  pub fn push(&self, waker: Waker) {
    self.0.lock().push(waker);
  }
}

#[derive(Debug)]
struct ChildWakerState {
  can_poll: AtomicFlag,
  wakers: WakerStore,
}

impl Wake for ChildWakerState {
  fn wake(self: Arc<Self>) {
    self.can_poll.raise();
    let wakers = self.wakers.take_all();

    for waker in wakers {
      waker.wake();
    }
  }

  fn wake_by_ref(self: &Arc<Self>) {
    self.can_poll.raise();
    let wakers = self.wakers.clone_all();

    for waker in wakers {
      waker.wake_by_ref();
    }
  }
}

#[cfg(test)]
mod test {
  use std::sync::Arc;

  use tokio::sync::Notify;

  use super::LocalFutureExt;

  #[tokio::test(flavor = "current_thread")]
  async fn test_shared_local_future() {
    let shared = super::SharedLocal::new(Box::pin(async { 42 }));
    assert_eq!(shared.clone().await, 42);
    assert_eq!(shared.await, 42);
  }

  #[tokio::test(flavor = "current_thread")]
  async fn test_shared_local() {
    let shared = async { 42 }.shared_local();
    assert_eq!(shared.clone().await, 42);
    assert_eq!(shared.await, 42);
  }

  #[tokio::test(flavor = "current_thread")]
  async fn multiple_tasks_waiting() {
    let notify = Arc::new(Notify::new());

    let shared = {
      let notify = notify.clone();
      async move {
        tokio::task::yield_now().await;
        notify.notified().await;
        tokio::task::yield_now().await;
        tokio::task::yield_now().await;
      }
      .shared_local()
    };
    let mut tasks = Vec::new();
    for _ in 0..10 {
      tasks.push(crate::spawn(shared.clone()));
    }

    crate::spawn(async move {
      notify.notify_one();
      for task in tasks {
        task.await.unwrap();
      }
    })
    .await
    .unwrap()
  }
}
