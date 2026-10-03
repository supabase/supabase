use std::collections::HashMap;
use std::convert::Infallible;

use base_mem_check::MemCheckState;
use enum_as_inner::EnumAsInner;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug)]
pub struct BootEvent {
  pub boot_time: usize,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct BootFailureEvent {
  pub msg: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct WorkerMemoryUsed {
  pub total: usize,
  pub heap: usize,
  pub external: usize,
  pub mem_check_captured: MemCheckState,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub enum ShutdownReason {
  EventLoopCompleted,
  WallClockTime,
  CPUTime,
  Memory,
  EarlyDrop,
  TerminationRequested,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ShutdownEvent {
  pub reason: ShutdownReason,
  pub cpu_time_used: usize,
  pub memory_used: WorkerMemoryUsed,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UncaughtExceptionEvent {
  pub exception: String,
  pub cpu_time_used: usize,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LogEvent {
  pub msg: String,
  pub level: LogLevel,
}

#[derive(Serialize, Deserialize, Debug, Default, PartialEq, Eq)]
#[repr(u8)]
pub enum LogLevel {
  #[default]
  Debug,
  Info,
  Warning,
  Error,
}

#[allow(clippy::infallible_try_from)] // Keep the fallible API expected by event deserialization callers.
impl TryFrom<u8> for LogLevel {
  type Error = Infallible;

  fn try_from(value: u8) -> Result<Self, Infallible> {
    match value {
      0 => Ok(Self::Debug),
      1 => Ok(Self::Info),
      2 => Ok(Self::Warning),
      3 => Ok(Self::Error),
      _ => Ok(Self::Debug),
    }
  }
}

#[derive(Serialize, Deserialize, Debug, EnumAsInner)]
pub enum WorkerEvents {
  Boot(BootEvent),
  BootFailure(BootFailureEvent),
  UncaughtException(UncaughtExceptionEvent),
  Shutdown(ShutdownEvent),
  Log(LogEvent),
}

impl WorkerEvents {
  pub fn with_cpu_time_used(mut self, cpu_time_used_ms: usize) -> Self {
    match &mut self {
      Self::UncaughtException(UncaughtExceptionEvent {
        cpu_time_used, ..
      })
      | Self::Shutdown(ShutdownEvent { cpu_time_used, .. }) => {
        *cpu_time_used = cpu_time_used_ms;
      }

      _ => {}
    }

    self
  }
}

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct EventMetadata {
  pub service_path: Option<String>,
  pub execution_id: Option<Uuid>,
  pub otel_attributes: Option<HashMap<String, String>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct WorkerEventWithMetadata {
  pub event: WorkerEvents,
  pub metadata: EventMetadata,
}

#[derive(Serialize, Deserialize)]
pub enum RawEvent {
  Event(Box<WorkerEventWithMetadata>),
  Done,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IncomingEvent {
  event_type: Option<String>,
  data: Option<Vec<u8>>,
  done: bool,
}
