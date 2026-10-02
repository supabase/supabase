// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::future::Future;
use std::time::Duration;

pub fn retry<
  F: FnMut() -> Fut,
  T,
  E,
  Fut: Future<Output = Result<T, E>>,
  ShouldRetry: FnMut(&E) -> bool,
>(
  mut f: F,
  mut should_retry: ShouldRetry,
) -> impl Future<Output = Result<T, E>> {
  const WAITS: [Duration; 3] = [
    Duration::from_millis(100),
    Duration::from_millis(250),
    Duration::from_millis(500),
  ];

  let mut waits = WAITS.into_iter();
  async move {
    let mut first_result = None;
    loop {
      let result = f().await;
      match result {
        Ok(r) => return Ok(r),
        Err(e) if !should_retry(&e) => return Err(e),
        _ => {}
      }
      if first_result.is_none() {
        first_result = Some(result);
      }
      let Some(wait) = waits.next() else {
        return first_result.unwrap();
      };
      tokio::time::sleep(wait).await;
    }
  }
}
