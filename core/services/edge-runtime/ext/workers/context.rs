use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::AtomicUsize;
use std::sync::Arc;
use std::sync::RwLock;

use anyhow::anyhow;
use anyhow::Error;
use base_mem_check::MemCheckState;
use base_mem_check::WorkerHeapStatisticsWithServicePath;
use deno::deno_permissions::PermissionsOptions;
use deno_core::unsync::sync::AtomicFlag;
use deno_core::FastString;
use deno_facade::EszipPayloadKind;
use deno_telemetry::OtelConfig;
use enum_as_inner::EnumAsInner;
use ext_event_worker::events::UncaughtExceptionEvent;
use ext_event_worker::events::WorkerEventWithMetadata;
use ext_runtime::MetricSource;
use ext_runtime::RateLimiterOpts;
use ext_runtime::SharedMetricSource;
use fs::s3_fs::S3FsConfig;
use fs::tmp_fs::TmpFsConfig;
use hyper_v014::Body;
use hyper_v014::Request;
use hyper_v014::Response;
use tokio::sync::mpsc;
use tokio::sync::mpsc::unbounded_channel;
use tokio::sync::oneshot;
use tokio::sync::Mutex;
use tokio::sync::Notify;
use tokio::sync::OwnedSemaphorePermit;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

#[derive(Debug, Clone, Default)]
pub enum WorkerExitStatus {
  #[default]
  Normal,
  WithUncaughtException(UncaughtExceptionEvent),
}

#[derive(Debug, Clone, Default)]
pub struct WorkerExit(Arc<Mutex<WorkerExitStatus>>);

impl WorkerExit {
  pub async fn error(&self) -> Option<anyhow::Error> {
    match &*self.0.lock().await {
      WorkerExitStatus::Normal => None,
      WorkerExitStatus::WithUncaughtException(UncaughtExceptionEvent {
        exception,
        ..
      }) => Some(anyhow!("{exception}")),
    }
  }

  pub async fn set(&self, exit_status: WorkerExitStatus) {
    *self.0.lock().await = exit_status;
  }
}

#[derive(Debug, Clone)]
pub struct UserWorkerRuntimeOpts {
  pub service_path: Option<String>,
  pub key: Option<Uuid>,

  pub pool_msg_tx: Option<mpsc::UnboundedSender<UserWorkerMsgs>>,
  pub events_msg_tx: Option<mpsc::UnboundedSender<WorkerEventWithMetadata>>,
  pub cancel: Option<CancellationToken>,

  pub memory_limit_mb: u64,
  pub low_memory_multiplier: u64,

  /// Wall clock limit
  pub worker_timeout_ms: u64,

  pub cpu_time_max_budget_per_task_ms: Option<u64>,
  pub cpu_time_soft_limit_ms: u64,
  pub cpu_time_hard_limit_ms: u64,

  pub beforeunload_wall_clock_pct: Option<u8>,
  pub beforeunload_cpu_pct: Option<u8>,
  pub beforeunload_memory_pct: Option<u8>,

  pub force_create: bool,
  pub allow_remote_modules: bool,
  pub custom_module_root: Option<String>,
  pub permissions: Option<PermissionsOptions>,

  pub context: Option<crate::JsonMap>,
  pub rate_limiter: RateLimiterOpts,
}

impl Default for UserWorkerRuntimeOpts {
  fn default() -> UserWorkerRuntimeOpts {
    UserWorkerRuntimeOpts {
      service_path: None,
      key: None,

      pool_msg_tx: None,
      events_msg_tx: None,
      cancel: None,

      memory_limit_mb: env!("SUPABASE_RESOURCE_LIMIT_MEM_MB").parse().unwrap(),
      low_memory_multiplier: env!("SUPABASE_RESOURCE_LIMIT_LOW_MEM_MULTIPLIER")
        .parse()
        .unwrap(),

      worker_timeout_ms: env!("SUPABASE_RESOURCE_LIMIT_TIMEOUT_MS")
        .parse()
        .unwrap(),

      cpu_time_max_budget_per_task_ms: if cfg!(debug_assertions) {
        Some(100)
      } else {
        Some(1)
      },
      cpu_time_soft_limit_ms: env!("SUPABASE_RESOURCE_LIMIT_CPU_SOFT_MS")
        .parse()
        .unwrap(),
      cpu_time_hard_limit_ms: env!("SUPABASE_RESOURCE_LIMIT_CPU_HARD_MS")
        .parse()
        .unwrap(),

      beforeunload_wall_clock_pct: None,
      beforeunload_cpu_pct: None,
      beforeunload_memory_pct: None,

      force_create: false,
      allow_remote_modules: true,
      custom_module_root: None,
      permissions: None,

      context: None,
      rate_limiter: RateLimiterOpts::Disabled,
    }
  }
}

#[derive(Debug, Clone)]
pub struct UserWorkerProfile {
  pub worker_request_msg_tx: mpsc::UnboundedSender<WorkerRequestMsg>,
  pub early_drop_tx: mpsc::UnboundedSender<oneshot::Sender<bool>>,
  pub timing_tx_pair: (
    mpsc::UnboundedSender<Arc<Notify>>,
    mpsc::UnboundedSender<()>,
  ),
  pub pool_key: String,
  pub service_path: String,
  pub permit: Option<Arc<OwnedSemaphorePermit>>,
  pub cancel: CancellationToken,
  pub status: TimingStatus,
  pub exit: WorkerExit,
  pub mem_check: Arc<RwLock<MemCheckState>>,
}

#[derive(Debug, Clone)]
pub struct MainWorkerRuntimeOpts {
  pub worker_pool_tx: mpsc::UnboundedSender<UserWorkerMsgs>,
  pub shared_metric_src: Option<SharedMetricSource>,
  pub event_worker_metric_src: Option<MetricSource>,
  pub context: Option<crate::JsonMap>,
}

#[derive(Debug)]
pub struct EventWorkerRuntimeOpts {
  pub events_msg_rx: Option<mpsc::UnboundedReceiver<WorkerEventWithMetadata>>,
  pub event_worker_exit_deadline_sec: Option<u64>,
  pub context: Option<crate::JsonMap>,
}

#[derive(Debug, EnumAsInner)]
#[allow(clippy::large_enum_variant)] // Boxing would change the worker construction API.
pub enum WorkerRuntimeOpts {
  UserWorker(UserWorkerRuntimeOpts),
  MainWorker(MainWorkerRuntimeOpts),
  EventsWorker(EventWorkerRuntimeOpts),
}

impl WorkerRuntimeOpts {
  pub fn to_worker_kind(&self) -> WorkerKind {
    match self {
      Self::UserWorker(_) => WorkerKind::UserWorker,
      Self::MainWorker(_) => WorkerKind::MainWorker,
      Self::EventsWorker(_) => WorkerKind::EventsWorker,
    }
  }

  pub fn context(&self) -> Option<&crate::JsonMap> {
    match self {
      Self::UserWorker(user_worker_runtime_opts) => {
        user_worker_runtime_opts.context.as_ref()
      }
      Self::MainWorker(main_worker_runtime_opts) => {
        main_worker_runtime_opts.context.as_ref()
      }
      Self::EventsWorker(event_worker_runtime_opts) => {
        event_worker_runtime_opts.context.as_ref()
      }
    }
  }
}

#[derive(Debug, Clone, Copy, EnumAsInner, PartialEq, Eq)]
pub enum WorkerKind {
  UserWorker,
  MainWorker,
  EventsWorker,
}

impl std::fmt::Display for WorkerKind {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      WorkerKind::UserWorker => write!(f, "user"),
      WorkerKind::MainWorker => write!(f, "main"),
      WorkerKind::EventsWorker => write!(f, "event"),
    }
  }
}

impl From<&WorkerRuntimeOpts> for WorkerKind {
  fn from(value: &WorkerRuntimeOpts) -> Self {
    value.to_worker_kind()
  }
}

#[derive(Debug, Clone, Default)]
pub struct TimingStatus {
  pub demand: Arc<AtomicUsize>,
  pub is_retired: Arc<AtomicFlag>,
}

#[derive(Debug)]
pub struct Timing {
  pub early_drop_rx: mpsc::UnboundedReceiver<oneshot::Sender<bool>>,
  pub status: TimingStatus,
  pub req: (
    mpsc::UnboundedReceiver<Arc<Notify>>,
    mpsc::UnboundedReceiver<()>,
  ),
}

impl Default for Timing {
  fn default() -> Self {
    let (_, dumb_early_drop_rx) = unbounded_channel();
    let (_, dumb_start_rx) = unbounded_channel::<Arc<Notify>>();
    let (_, dumb_end_rx) = unbounded_channel::<()>();

    Self {
      early_drop_rx: dumb_early_drop_rx,
      status: TimingStatus::default(),
      req: (dumb_start_rx, dumb_end_rx),
    }
  }
}

// TODO: Refactor this. Some members remove the `Default` trait bounds,
// increasing complexity.
#[derive(Debug)]
pub struct WorkerContextInitOpts {
  pub pool_key: Option<String>,
  pub service_path: PathBuf,
  pub no_module_cache: bool,
  pub no_npm: Option<bool>,
  pub env_vars: HashMap<String, String>,
  pub conf: WorkerRuntimeOpts,
  pub static_patterns: Vec<String>,
  pub timing: Option<Timing>,
  pub maybe_eszip: Option<EszipPayloadKind>,
  pub maybe_module_code: Option<FastString>,
  pub maybe_entrypoint: Option<String>,
  pub maybe_s3_fs_config: Option<S3FsConfig>,
  pub maybe_tmp_fs_config: Option<TmpFsConfig>,
  pub maybe_otel_config: Option<OtelConfig>,
}

#[derive(Debug)]
#[allow(clippy::large_enum_variant)] // This is a low-frequency control channel; avoid API churn.
pub enum UserWorkerMsgs {
  Create(
    WorkerContextInitOpts,
    oneshot::Sender<Result<CreateUserWorkerResult, Error>>,
  ),
  Created(Uuid, UserWorkerProfile),
  SendRequest(
    Uuid,
    Request<Body>,
    oneshot::Sender<Result<SendRequestResult, Error>>,
    Option<CancellationToken>,
  ),
  Idle(Uuid),
  Shutdown(Uuid),
  TryCleanupIdleWorkers(usize, oneshot::Sender<usize>),
  InqueryMemoryUsage(
    oneshot::Sender<HashMap<Uuid, WorkerHeapStatisticsWithServicePath>>,
  ),
}

pub type SendRequestResult = (Response<Body>, mpsc::UnboundedSender<()>);

#[derive(Debug)]
pub struct CreateUserWorkerResult {
  pub key: Uuid,
  pub reused: bool,
}

#[derive(Debug)]
pub struct WorkerRequestMsg {
  pub req: Request<Body>,
  pub res_tx: oneshot::Sender<Result<Response<Body>, hyper_v014::Error>>,
  pub conn_token: Option<CancellationToken>,
  pub idle_timed_out: Arc<AtomicBool>,
}
