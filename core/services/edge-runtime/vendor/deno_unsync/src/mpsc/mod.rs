// Copyright 2018-2024 the Deno authors. MIT license.

use std::cell::RefCell;
use std::fmt::Formatter;
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use std::task::Context;
use std::task::Poll;

mod chunked_queue;

use crate::UnsyncWaker;
use chunked_queue::ChunkedQueue;

pub struct SendError<T>(pub T);

impl<T> std::fmt::Debug for SendError<T>
where
  T: std::fmt::Debug,
{
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    f.debug_tuple("SendError").field(&self.0).finish()
  }
}

pub struct Sender<T> {
  shared: Rc<RefCell<Shared<T>>>,
}

impl<T> Sender<T> {
  pub fn send(&self, value: T) -> Result<(), SendError<T>> {
    let mut shared = self.shared.borrow_mut();
    if shared.closed {
      return Err(SendError(value));
    }
    shared.queue.push_back(value);
    shared.waker.wake();
    Ok(())
  }
}

impl<T> Drop for Sender<T> {
  fn drop(&mut self) {
    let mut shared = self.shared.borrow_mut();
    shared.closed = true;
    shared.waker.wake();
  }
}

pub struct Receiver<T> {
  shared: Rc<RefCell<Shared<T>>>,
}

impl<T> Drop for Receiver<T> {
  fn drop(&mut self) {
    let mut shared = self.shared.borrow_mut();
    shared.closed = true;
  }
}

impl<T> Receiver<T> {
  /// Receives a value from the channel, returning `None` if there
  /// are no more items and the channel is closed.
  pub async fn recv(&mut self) -> Option<T> {
    // note: this is `&mut self` so that it can't be polled
    // concurrently. DO NOT change this to `&self` because
    // then futures will lose their wakers.
    RecvFuture {
      shared: &self.shared,
    }
    .await
  }

  /// Number of pending unread items.
  pub fn len(&self) -> usize {
    self.shared.borrow().queue.len()
  }

  /// If the receiver has no pending items.
  pub fn is_empty(&self) -> bool {
    self.len() == 0
  }
}

struct RecvFuture<'a, T> {
  shared: &'a RefCell<Shared<T>>,
}

impl<T> Future for RecvFuture<'_, T> {
  type Output = Option<T>;

  fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
    let mut shared = self.shared.borrow_mut();
    if let Some(value) = shared.queue.pop_front() {
      Poll::Ready(Some(value))
    } else if shared.closed {
      Poll::Ready(None)
    } else {
      shared.waker.register(cx.waker());
      Poll::Pending
    }
  }
}

struct Shared<T> {
  queue: ChunkedQueue<T>,
  waker: UnsyncWaker,
  closed: bool,
}

/// A ![`Sync`] and ![`Sync`] equivalent to `tokio::sync::unbounded_channel`.
pub fn unbounded_channel<T>() -> (Sender<T>, Receiver<T>) {
  let shared = Rc::new(RefCell::new(Shared {
    queue: ChunkedQueue::default(),
    waker: UnsyncWaker::default(),
    closed: false,
  }));
  (
    Sender {
      shared: shared.clone(),
    },
    Receiver { shared },
  )
}

#[cfg(test)]
mod test {
  use tokio::join;

  use super::*;

  #[tokio::test(flavor = "current_thread")]
  async fn sends_receives_exits() {
    let (sender, mut receiver) = unbounded_channel::<usize>();
    sender.send(1).unwrap();
    assert_eq!(receiver.recv().await, Some(1));
    sender.send(2).unwrap();
    assert_eq!(receiver.recv().await, Some(2));
    drop(sender);
    assert_eq!(receiver.recv().await, None);
  }

  #[tokio::test(flavor = "current_thread")]
  async fn sends_multiple_then_drop() {
    let (sender, mut receiver) = unbounded_channel::<usize>();
    sender.send(1).unwrap();
    sender.send(2).unwrap();
    drop(sender);
    assert_eq!(receiver.len(), 2);
    assert!(!receiver.is_empty());
    assert_eq!(receiver.recv().await, Some(1));
    assert_eq!(receiver.recv().await, Some(2));
    assert_eq!(receiver.recv().await, None);
    assert_eq!(receiver.len(), 0);
    assert!(receiver.is_empty());
  }

  #[tokio::test(flavor = "current_thread")]
  async fn receiver_dropped_sending() {
    let (sender, receiver) = unbounded_channel::<usize>();
    drop(receiver);
    let err = sender.send(1).unwrap_err();
    assert_eq!(err.0, 1);
  }

  #[tokio::test(flavor = "current_thread")]
  async fn receiver_recv_then_drop_sender() {
    let (sender, mut receiver) = unbounded_channel::<usize>();
    let future = crate::spawn(async move {
      let value = receiver.recv().await;
      value.is_none()
    });
    let future2 = crate::spawn(async move {
      drop(sender);
      true
    });
    let (first, second) = join!(future, future2);
    assert!(first.unwrap());
    assert!(second.unwrap());
  }

  #[tokio::test(flavor = "current_thread")]
  async fn multiple_senders_divided_work() {
    for receiver_ticks in [None, Some(1), Some(10)] {
      for sender_ticks in [None, Some(1), Some(10)] {
        for sender_count in [1000, 100, 10, 2, 1] {
          let (sender, mut receiver) = unbounded_channel::<usize>();
          let future = crate::spawn(async move {
            let mut values = Vec::with_capacity(1000);
            for _ in 0..1000 {
              if let Some(ticks) = receiver_ticks {
                for _ in 0..ticks {
                  tokio::task::yield_now().await;
                }
              }
              let value = receiver.recv().await;
              values.push(value.unwrap());
            }
            // both senders should be dropped at this point
            let value = receiver.recv().await;
            assert!(value.is_none());

            values.sort();
            // ensure we received these values
            #[allow(clippy::needless_range_loop)]
            for i in 0..1000 {
              assert_eq!(values[i], i);
            }
          });

          let mut futures = Vec::with_capacity(1 + sender_count);
          futures.push(future);
          let sender = Rc::new(sender);
          for sender_index in 0..sender_count {
            let sender = sender.clone();
            let batch_count = 1000 / sender_count;
            futures.push(crate::spawn(async move {
              for i in 0..batch_count {
                if let Some(ticks) = sender_ticks {
                  for _ in 0..ticks {
                    tokio::task::yield_now().await;
                  }
                }
                sender.send(batch_count * sender_index + i).unwrap();
              }
            }));
          }
          drop(sender);

          // wait all futures
          for future in futures {
            future.await.unwrap();
          }
        }
      }
    }
  }
}
