use std::sync::Arc;

use deno_core::unsync::sync::AtomicFlag;

#[derive(Debug, Clone, Default)]
pub struct RuntimeState {
  pub init: Arc<AtomicFlag>,
  pub evaluating_mod: Arc<AtomicFlag>,
  pub event_loop_completed: Arc<AtomicFlag>,
  pub terminated: Arc<AtomicFlag>,
  pub found_inspector_session: Arc<AtomicFlag>,
  pub mem_reached_half: Arc<AtomicFlag>,
}

impl RuntimeState {
  pub fn is_init(&self) -> bool {
    self.init.is_raised()
  }

  pub fn is_evaluating_mod(&self) -> bool {
    self.evaluating_mod.is_raised()
  }

  pub fn is_event_loop_completed(&self) -> bool {
    self.event_loop_completed.is_raised()
  }

  pub fn is_terminated(&self) -> bool {
    self.terminated.is_raised()
  }

  pub fn is_found_inspector_session(&self) -> bool {
    self.found_inspector_session.is_raised()
  }
}
