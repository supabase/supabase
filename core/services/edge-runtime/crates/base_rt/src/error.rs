use std::sync::Arc;

use deno_core::anyhow;

#[derive(Clone)]
pub struct CloneableError {
  inner: Arc<anyhow::Error>,
}

impl From<anyhow::Error> for CloneableError {
  fn from(value: anyhow::Error) -> Self {
    Self {
      inner: Arc::new(value),
    }
  }
}

impl std::fmt::Display for CloneableError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    self.inner.fmt(f)
  }
}

impl std::fmt::Debug for CloneableError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    self.inner.fmt(f)
  }
}

impl std::error::Error for CloneableError {
  fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
    self.inner.source()
  }
}
