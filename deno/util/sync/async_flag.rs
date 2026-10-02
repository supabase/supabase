// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use tokio_util::sync::CancellationToken;

#[derive(Debug, Default, Clone)]
pub struct AsyncFlag(CancellationToken);

impl AsyncFlag {
  pub fn raise(&self) {
    self.0.cancel();
  }

  pub fn is_raised(&self) -> bool {
    self.0.is_cancelled()
  }

  pub fn wait_raised(&self) -> impl std::future::Future<Output = ()> + '_ {
    self.0.cancelled()
  }
}
