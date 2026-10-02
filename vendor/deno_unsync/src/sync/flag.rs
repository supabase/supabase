// Copyright 2018-2024 the Deno authors. MIT license.

use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;

/// Simplifies the use of an atomic boolean as a flag.
#[derive(Debug, Default)]
pub struct AtomicFlag(AtomicBool);

impl AtomicFlag {
  /// Creates a new flag that's lowered.
  pub const fn lowered() -> AtomicFlag {
    Self(AtomicBool::new(false))
  }

  /// Creates a new flag that's raised.
  pub const fn raised() -> AtomicFlag {
    Self(AtomicBool::new(true))
  }

  /// Raises the flag returning if the raise was successful.
  pub fn raise(&self) -> bool {
    !self.0.swap(true, Ordering::SeqCst)
  }

  /// Lowers the flag returning if the lower was successful.
  pub fn lower(&self) -> bool {
    self.0.swap(false, Ordering::SeqCst)
  }

  /// Gets if the flag is raised.
  pub fn is_raised(&self) -> bool {
    self.0.load(Ordering::SeqCst)
  }
}

#[cfg(test)]
mod test {
  use super::*;

  #[test]
  fn atomic_flag_raises_lowers() {
    let flag = AtomicFlag::default();
    assert!(!flag.is_raised()); // false by default
    assert!(flag.raise());
    assert!(flag.is_raised());
    assert!(!flag.raise());
    assert!(flag.is_raised());
    assert!(flag.lower());
    assert!(flag.raise());
    assert!(flag.lower());
    assert!(!flag.lower());
    let flag = AtomicFlag::raised();
    assert!(flag.is_raised());
    assert!(flag.lower());
  }
}
