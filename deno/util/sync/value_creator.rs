// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::sync::Arc;

use deno_core::futures::future::BoxFuture;
use deno_core::futures::future::LocalBoxFuture;
use deno_core::futures::future::Shared;
use deno_core::futures::FutureExt;
use deno_core::parking_lot::Mutex;
use tokio::task::JoinError;

type JoinResult<TResult> = Result<TResult, Arc<JoinError>>;
type CreateFutureFn<TResult> =
  Box<dyn Fn() -> LocalBoxFuture<'static, TResult> + Send + Sync>;

#[derive(Debug)]
struct State<TResult> {
  retry_index: usize,
  future: Option<Shared<BoxFuture<'static, JoinResult<TResult>>>>,
}

/// Attempts to create a shared value asynchronously on one tokio runtime while
/// many runtimes are requesting the value.
///
/// This is only useful when the value needs to get created once across
/// many runtimes.
///
/// This handles the case where the tokio runtime creating the value goes down
/// while another one is waiting on the value.
pub struct MultiRuntimeAsyncValueCreator<TResult: Send + Clone + 'static> {
  create_future: CreateFutureFn<TResult>,
  state: Mutex<State<TResult>>,
}

impl<TResult: Send + Clone + 'static> std::fmt::Debug
  for MultiRuntimeAsyncValueCreator<TResult>
{
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("MultiRuntimeAsyncValueCreator").finish()
  }
}

impl<TResult: Send + Clone + 'static> MultiRuntimeAsyncValueCreator<TResult> {
  pub fn new(create_future: CreateFutureFn<TResult>) -> Self {
    Self {
      state: Mutex::new(State {
        retry_index: 0,
        future: None,
      }),
      create_future,
    }
  }

  pub async fn get(&self) -> TResult {
    let (mut future, mut retry_index) = {
      let mut state = self.state.lock();
      let future = match &state.future {
        Some(future) => future.clone(),
        None => {
          let future = self.create_shared_future();
          state.future = Some(future.clone());
          future
        }
      };
      (future, state.retry_index)
    };

    loop {
      let result = future.await;

      match result {
        Ok(result) => return result,
        Err(join_error) => {
          if join_error.is_cancelled() {
            let mut state = self.state.lock();

            if state.retry_index == retry_index {
              // we were the first one to retry, so create a new future
              // that we'll run from the current runtime
              state.retry_index += 1;
              state.future = Some(self.create_shared_future());
            }

            retry_index = state.retry_index;
            future = state.future.as_ref().unwrap().clone();

            // just in case we're stuck in a loop
            if retry_index > 1000 {
              panic!("Something went wrong.") // should never happen
            }
          } else {
            panic!("{}", join_error);
          }
        }
      }
    }
  }

  fn create_shared_future(
    &self,
  ) -> Shared<BoxFuture<'static, JoinResult<TResult>>> {
    let future = (self.create_future)();
    deno_core::unsync::spawn(future)
      .map(|result| result.map_err(Arc::new))
      .boxed()
      .shared()
  }
}

#[cfg(test)]
mod test {
  use deno_core::unsync::spawn;

  use super::*;

  #[tokio::test]
  async fn single_runtime() {
    let value_creator = MultiRuntimeAsyncValueCreator::new(Box::new(|| {
      async { 1 }.boxed_local()
    }));
    let value = value_creator.get().await;
    assert_eq!(value, 1);
  }

  #[test]
  fn multi_runtimes() {
    let value_creator =
      Arc::new(MultiRuntimeAsyncValueCreator::new(Box::new(|| {
        async {
          tokio::task::yield_now().await;
          1
        }
        .boxed_local()
      })));
    let handles = (0..3)
      .map(|_| {
        let value_creator = value_creator.clone();
        std::thread::spawn(|| {
          create_runtime().block_on(async move { value_creator.get().await })
        })
      })
      .collect::<Vec<_>>();
    for handle in handles {
      assert_eq!(handle.join().unwrap(), 1);
    }
  }

  #[test]
  fn multi_runtimes_first_never_finishes() {
    let is_first_run = Arc::new(Mutex::new(true));
    let (tx, rx) = std::sync::mpsc::channel::<()>();
    let value_creator = Arc::new(MultiRuntimeAsyncValueCreator::new({
      let is_first_run = is_first_run.clone();
      Box::new(move || {
        let is_first_run = is_first_run.clone();
        let tx = tx.clone();
        async move {
          let is_first_run = {
            let mut is_first_run = is_first_run.lock();
            let initial_value = *is_first_run;
            *is_first_run = false;
            tx.send(()).unwrap();
            initial_value
          };
          if is_first_run {
            tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
            panic!("TIMED OUT"); // should not happen
          } else {
            tokio::task::yield_now().await;
          }
          1
        }
        .boxed_local()
      })
    }));
    std::thread::spawn({
      let value_creator = value_creator.clone();
      let is_first_run = is_first_run.clone();
      move || {
        create_runtime().block_on(async {
          let value_creator = value_creator.clone();
          // spawn a task that will never complete
          spawn(async move { value_creator.get().await });
          // wait for the task to set is_first_run to false
          while *is_first_run.lock() {
            tokio::time::sleep(std::time::Duration::from_millis(20)).await;
          }
          // now exit the runtime while the value_creator is still pending
        })
      }
    });
    let handle = {
      let value_creator = value_creator.clone();
      std::thread::spawn(|| {
        create_runtime().block_on(async move {
          let value_creator = value_creator.clone();
          rx.recv().unwrap();
          // even though the other runtime shutdown, this get() should
          // recover and still get the value
          value_creator.get().await
        })
      })
    };
    assert_eq!(handle.join().unwrap(), 1);
  }

  fn create_runtime() -> tokio::runtime::Runtime {
    tokio::runtime::Builder::new_current_thread()
      .enable_all()
      .build()
      .unwrap()
  }
}
