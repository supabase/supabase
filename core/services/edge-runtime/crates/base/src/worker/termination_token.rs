use tokio_util::sync::CancellationToken;

#[derive(Clone)]
pub struct TerminationToken {
  pub inbound: CancellationToken,
  pub outbound: CancellationToken,
}

impl std::fmt::Debug for TerminationToken {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("TerminationToken").finish()
  }
}

impl Default for TerminationToken {
  fn default() -> Self {
    Self::new()
  }
}

impl TerminationToken {
  pub fn new() -> Self {
    Self {
      inbound: CancellationToken::default(),
      outbound: CancellationToken::default(),
    }
  }

  pub fn child_token(&self) -> Self {
    Self {
      inbound: self.inbound.child_token(),
      outbound: self.outbound.child_token(),
    }
  }

  pub fn cancel(&self) {
    self.inbound.cancel();
  }

  pub async fn cancel_and_wait(&self) {
    if self.outbound.is_cancelled() {
      return;
    }

    self.cancel();
    self.outbound.cancelled().await;
  }
}
