// Copyright 2018-2024 the Deno authors. MIT license.

use std::cell::Cell;

/// A flag with interior mutability that can be raised or lowered.
/// Useful for indicating if an event has occurred.
#[derive(Debug, Default)]
pub struct Flag(Cell<bool>);

impl Flag {
  /// Creates a new flag that's lowered.
  pub const fn lowered() -> Self {
    Self(Cell::new(false))
  }

  /// Creates a new flag that's raised.
  pub const fn raised() -> Self {
    Self(Cell::new(true))
  }

  /// Raises the flag returning if raised.
  pub fn raise(&self) -> bool {
    !self.0.replace(true)
  }

  /// Lowers the flag returning if lowered.
  pub fn lower(&self) -> bool {
    self.0.replace(false)
  }

  /// Gets if the flag is raised.
  pub fn is_raised(&self) -> bool {
    self.0.get()
  }
}

#[cfg(test)]
mod test {
  use super::*;

  #[test]
  fn test_raise_lower() {
    let flag = Flag::default();
    assert!(!flag.is_raised());
    assert!(flag.raise());
    assert!(flag.is_raised());
    assert!(!flag.raise());
    assert!(flag.is_raised());
    assert!(flag.lower());
    assert!(!flag.is_raised());
    assert!(!flag.lower());
    assert!(!flag.is_raised());
  }
}
