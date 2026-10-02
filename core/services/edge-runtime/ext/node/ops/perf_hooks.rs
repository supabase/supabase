// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use deno_core::op2;
use deno_core::GarbageCollected;

use std::cell::Cell;

#[derive(Debug, thiserror::Error)]
pub enum PerfHooksError {
  #[error(transparent)]
  TokioEld(#[from] tokio_eld::Error),
}

pub struct EldHistogram {
  eld: tokio_eld::EldHistogram<u64>,
  started: Cell<bool>,
}

impl GarbageCollected for EldHistogram {}

#[op2]
impl EldHistogram {
  // Creates an interval EldHistogram object that samples and reports the event
  // loop delay over time.
  //
  // The delays will be reported in nanoseconds.
  #[constructor]
  #[cppgc]
  pub fn new(#[smi] resolution: u32) -> Result<EldHistogram, PerfHooksError> {
    Ok(EldHistogram {
      eld: tokio_eld::EldHistogram::new(resolution as usize)?,
      started: Cell::new(false),
    })
  }

  // Disables the update interval timer.
  //
  // Returns true if the timer was stopped, false if it was already stopped.
  #[fast]
  fn enable(&self) -> bool {
    if self.started.get() {
      return false;
    }

    self.eld.start();
    self.started.set(true);

    true
  }

  // Enables the update interval timer.
  //
  // Returns true if the timer was started, false if it was already started.
  #[fast]
  fn disable(&self) -> bool {
    if !self.started.get() {
      return false;
    }

    self.eld.stop();
    self.started.set(false);

    true
  }

  // Returns the value at the given percentile.
  //
  // `percentile` ∈ (0, 100]
  #[fast]
  #[number]
  fn percentile(&self, percentile: f64) -> u64 {
    self.eld.value_at_percentile(percentile)
  }

  // Returns the value at the given percentile as a bigint.
  #[fast]
  #[bigint]
  fn percentile_big_int(&self, percentile: f64) -> u64 {
    self.eld.value_at_percentile(percentile)
  }

  // The number of samples recorded by the histogram.
  #[getter]
  #[number]
  fn count(&self) -> u64 {
    self.eld.len()
  }

  // The number of samples recorded by the histogram as a bigint.
  #[getter]
  #[bigint]
  fn count_big_int(&self) -> u64 {
    self.eld.len()
  }

  // The maximum recorded event loop delay.
  #[getter]
  #[number]
  fn max(&self) -> u64 {
    self.eld.max()
  }

  // The maximum recorded event loop delay as a bigint.
  #[getter]
  #[bigint]
  fn max_big_int(&self) -> u64 {
    self.eld.max()
  }

  // The mean of the recorded event loop delays.
  #[getter]
  fn mean(&self) -> f64 {
    self.eld.mean()
  }

  // The minimum recorded event loop delay.
  #[getter]
  #[number]
  fn min(&self) -> u64 {
    self.eld.min()
  }

  // The minimum recorded event loop delay as a bigint.
  #[getter]
  #[bigint]
  fn min_big_int(&self) -> u64 {
    self.eld.min()
  }

  // The standard deviation of the recorded event loop delays.
  #[getter]
  fn stddev(&self) -> f64 {
    self.eld.stdev()
  }
}
