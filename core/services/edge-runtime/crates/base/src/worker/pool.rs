use std::collections::HashMap;
use std::collections::HashSet;
use std::convert::Infallible;
use std::future::pending;
use std::str::FromStr;
use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::time::Duration;

use anyhow::anyhow;
use anyhow::bail;
use anyhow::Context;
use anyhow::Error;
use base_mem_check::WorkerHeapStatisticsWithServicePath;
use deno::util::sync::AtomicFlag;
use either::Either::Left;
use enum_as_inner::EnumAsInner;
use ext_event_worker::events::WorkerEventWithMetadata;
use ext_runtime::SharedMetricSource;
use ext_runtime::SharedRateLimitTable;
use ext_runtime::TraceRateLimiterConfig;
use ext_workers::context::CreateUserWorkerResult;
use ext_workers::context::SendRequestResult;
use ext_workers::context::Timing;
use ext_workers::context::TimingStatus;
use ext_workers::context::UserWorkerMsgs;
use ext_workers::context::UserWorkerProfile;
use ext_workers::context::WorkerContextInitOpts;
use ext_workers::context::WorkerRuntimeOpts;
use ext_workers::errors::WorkerError;
use futures_util::future::join_all;
use http_v02::Request;
use hyper_v014::Body;
use log::error;
use tokio::sync::mpsc;
use tokio::sync::mpsc::UnboundedSender;
use tokio::sync::oneshot;
use tokio::sync::oneshot::Sender;
use tokio::sync::Notify;
use tokio::sync::OwnedSemaphorePermit;
use tokio::sync::Semaphore;
use tokio::sync::TryAcquireError;
use tokio::time::timeout;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

use super::termination_token::TerminationToken;
use super::utils::send_user_worker_request;

use crate::inspector_server::Inspector;
use crate::server::ServerFlags;
use crate::worker::WorkerSurfaceBuilder;

#[derive(Debug, Clone, Copy, EnumAsInner, Default)]
pub enum SupervisorPolicy {
  #[default]
  PerWorker,
  PerRequest {
    oneshot: bool,
  },
}

impl FromStr for SupervisorPolicy {
  type Err = Infallible;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    match s {
      "per_worker" => Ok(Self::PerWorker),
      "per_request" => Ok(Self::PerRequest { oneshot: false }),
      "oneshot" => Ok(Self::PerRequest { oneshot: true }),
      _ => unreachable!(),
    }
  }
}

impl SupervisorPolicy {
  pub fn oneshot() -> Self {
    Self::PerRequest { oneshot: true }
  }

  pub fn is_oneshot(&self) -> bool {
    matches!(self, Self::PerRequest { oneshot: true })
  }
}

#[derive(Clone)]
pub struct WorkerPoolPolicy {
  supervisor_policy: SupervisorPolicy,
  max_parallelism: usize,
  request_wait_timeout_ms: u64,
}

impl Default for WorkerPoolPolicy {
  fn default() -> Self {
    let available_parallelism = std::thread::available_parallelism()
      .ok()
      .map(|it| it.get())
      .unwrap_or(1);

    Self {
      supervisor_policy: SupervisorPolicy::default(),
      max_parallelism: available_parallelism,
      request_wait_timeout_ms: 10000,
    }
  }
}

impl WorkerPoolPolicy {
  pub fn new(
    supervisor: impl Into<Option<SupervisorPolicy>>,
    max_parallelism: impl Into<Option<usize>>,
    server_flags: ServerFlags,
  ) -> Self {
    let default = Self::default();

    Self {
      supervisor_policy: supervisor.into().unwrap_or(default.supervisor_policy),
      max_parallelism: max_parallelism
        .into()
        .unwrap_or(default.max_parallelism),
      request_wait_timeout_ms: server_flags
        .request_wait_timeout_ms
        .unwrap_or(default.request_wait_timeout_ms),
    }
  }
}

#[derive(Clone, Copy)]
struct WorkerId(Uuid, bool);

impl Eq for WorkerId {}

impl PartialEq for WorkerId {
  fn eq(&self, other: &Self) -> bool {
    self.0 == other.0
  }
}

impl std::borrow::Borrow<Uuid> for WorkerId {
  fn borrow(&self) -> &Uuid {
    &self.0
  }
}

impl std::hash::Hash for WorkerId {
  fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
    self.0.hash(state);
  }
}

// Simple implementation of Round Robin for the Active Workers
pub struct ActiveWorkerRegistry {
  workers: HashSet<WorkerId>,
  next: Option<usize>,
  notify_pair: (flume::Sender<Option<Uuid>>, flume::Receiver<Option<Uuid>>),
  sem: Arc<Semaphore>,
}

impl ActiveWorkerRegistry {
  fn new(max_parallelism: usize) -> Self {
    Self {
      workers: HashSet::default(),
      next: Option::default(),
      notify_pair: flume::unbounded(),
      sem: Arc::new(Semaphore::const_new(max_parallelism)),
    }
  }

  fn mark_used_and_try_advance(
    &mut self,
    policy: SupervisorPolicy,
  ) -> Option<&Uuid> {
    if self.workers.is_empty() {
      let _ = self.next.take();
      return None;
    }

    let len = self.workers.len();
    let idx = self
      .next
      .map(|it| if it + 1 > len { 0 } else { it })
      .unwrap_or(0);

    match self.workers.iter().nth(idx).cloned() {
      Some(WorkerId(key, true)) => match policy {
        SupervisorPolicy::PerWorker => {
          self.next = Some(idx + 1);
          self.workers.get(&key).map(|it| &it.0)
        }

        SupervisorPolicy::PerRequest { .. } => {
          let key = self.workers.replace(WorkerId(key, false)).and_then(
            |WorkerId(ref key, _)| self.workers.get(key).map(|it| &it.0),
          );

          self.next = self.workers.iter().position(|it| it.1);
          key
        }
      },

      _ => {
        let _ = self.next.take();
        None
      }
    }
  }

  fn mark_idle(&mut self, key: &Uuid, policy: SupervisorPolicy) {
    if let Some(WorkerId(key, mark)) = self.workers.get(key).cloned() {
      if policy.is_per_request() {
        if mark {
          return;
        }

        let _ = self.workers.replace(WorkerId(key, true));
      }

      let (notify_tx, _) = self.notify_pair.clone();
      let _ = notify_tx.send(Some(key));
    }
  }
}

// every new worker gets a new UUID (can reuse execution_id)
// user_workers - maintain a hashmap of (uuid - workerProfile (include service path))
// active_workers - hashmap of (pool_key - uuid)
// retire removed entry for uuid from active
// shutdown removes uuid from both active and user_workers
// create_worker returns true if an active_worker is available for service_path (force create
// retires current one adds new one)
// send_request is called with UUID
pub struct WorkerPool {
  pub flags: Arc<ServerFlags>,
  pub policy: WorkerPoolPolicy,
  pub metric_src: SharedMetricSource,
  pub shared_rate_limit_table: SharedRateLimitTable,
  pub user_workers: HashMap<Uuid, UserWorkerProfile>,
  pub active_workers: HashMap<String, ActiveWorkerRegistry>,
  pub worker_pool_msgs_tx: mpsc::UnboundedSender<UserWorkerMsgs>,
  pub maybe_inspector: Option<Inspector>,

  // TODO: refactor this out of worker pool
  pub worker_event_sender:
    Option<mpsc::UnboundedSender<WorkerEventWithMetadata>>,
}

impl WorkerPool {
  pub(crate) fn new(
    flags: Arc<ServerFlags>,
    policy: WorkerPoolPolicy,
    metric_src: SharedMetricSource,
    worker_event_sender: Option<UnboundedSender<WorkerEventWithMetadata>>,
    worker_pool_msgs_tx: mpsc::UnboundedSender<UserWorkerMsgs>,
    inspector: Option<Inspector>,
    cancel: CancellationToken,
  ) -> Self {
    let shared_rate_limit_table = SharedRateLimitTable::default();
    shared_rate_limit_table.spawn_cleanup_task(
      Duration::from_secs(flags.rate_limit_cleanup_interval_sec),
      cancel,
    );

    Self {
      flags,
      policy,
      metric_src,
      shared_rate_limit_table,
      worker_event_sender,
      user_workers: HashMap::new(),
      active_workers: HashMap::new(),
      maybe_inspector: inspector,
      worker_pool_msgs_tx,
    }
  }

  pub fn create_user_worker(
    &mut self,
    mut worker_options: WorkerContextInitOpts,
    tx: Sender<Result<CreateUserWorkerResult, Error>>,
    termination_token: Option<TerminationToken>,
  ) {
    let service_path = worker_options
      .service_path
      .to_str()
      .unwrap_or("")
      .to_string();

    let worker_pool_key = worker_options
      .pool_key
      .to_owned()
      .unwrap_or(service_path.clone());

    let is_oneshot_policy = self.policy.supervisor_policy.is_oneshot();
    let inspector = self.maybe_inspector.clone();
    let force_create = worker_options
      .conf
      .as_user_worker()
      .is_some_and(|it| !is_oneshot_policy && it.force_create);

    if let Some(ref active_worker_uuid) =
      self.maybe_active_worker(&worker_pool_key, force_create)
    {
      if tx
        .send(Ok(CreateUserWorkerResult {
          key: *active_worker_uuid,
          reused: true,
        }))
        .is_err()
      {
        error!("main worker receiver dropped")
      }
      return;
    }

    enum FlowAfterFence {
      Stop,
      Resend(Sender<Result<CreateUserWorkerResult, Error>>),
      Create(
        Option<OwnedSemaphorePermit>,
        Sender<Result<CreateUserWorkerResult, Error>>,
      ),
    }

    let wait_fence_fut = {
      let registry = self
        .active_workers
        .entry(worker_pool_key.clone())
        .or_insert_with(|| {
          ActiveWorkerRegistry::new(self.policy.max_parallelism)
        });

      let sem = registry.sem.clone();
      let (_, notify_rx) = registry.notify_pair.clone();
      let wait_timeout = tokio::time::sleep(Duration::from_millis(
        self.policy.request_wait_timeout_ms,
      ));

      async move {
        use FlowAfterFence::*;

        match sem.clone().try_acquire_owned() {
          Ok(permit) => return Create(Some(permit), tx),
          Err(TryAcquireError::NoPermits) if force_create => {
            // NOTE(Nyannyacha): Do we need to consider counting the permit
            // count (that means it affects maximum parallelism) if in the force
            // creation mode?
            return Create(None, tx);
          }

          _ => {}
        }

        tokio::pin!(wait_timeout);
        loop {
          tokio::select! {
            maybe_key = notify_rx.recv_async() => {
              match maybe_key {
                Err(x) => {
                  if
                    tx
                      .send(Err(anyhow!(
                        "worker channel is no longer valid: {}", x
                      )))
                      .is_err()
                  {
                    error!("main worker receiver dropped");
                  }
                  return Stop;
                }

                Ok(Some(_)) => return Resend(tx),
                Ok(None) => {
                  if let Ok(permit) = sem.clone().try_acquire_owned() {
                    return Create(Some(permit), tx);
                  }
                }
              }
            },

            () = &mut wait_timeout => {
              if
                tx
                  .send(Err(anyhow!("worker did not respond in time")))
                  .is_err()
              {
                error!("main worker receiver dropped");
              }
              return Stop;
            }
          }
        }
      }
    };

    let flags = self.flags.clone();
    let worker_pool_msgs_tx = self.worker_pool_msgs_tx.clone();
    let events_msg_tx = self.worker_event_sender.clone();
    let supervisor_policy = self.policy.supervisor_policy;
    let shared_rate_limit_table = self.shared_rate_limit_table.clone();

    drop(tokio::spawn(async move {
      let (permit, tx) = match wait_fence_fut.await {
        FlowAfterFence::Stop => return,
        FlowAfterFence::Resend(tx) => {
          let WorkerContextInitOpts {
            pool_key: worker_pool_key,
            service_path,
            no_module_cache,
            no_npm,
            env_vars,
            conf,
            maybe_eszip,
            maybe_module_code,
            maybe_entrypoint,
            maybe_s3_fs_config,
            maybe_tmp_fs_config,
            static_patterns,
            maybe_otel_config: otel_config,
            ..
          } = worker_options;

          if worker_pool_msgs_tx
            .send(UserWorkerMsgs::Create(
              WorkerContextInitOpts {
                pool_key: worker_pool_key,
                service_path,
                no_module_cache,
                no_npm,
                env_vars,
                timing: None,
                conf,
                maybe_eszip,
                maybe_module_code,
                maybe_entrypoint,
                static_patterns,

                maybe_s3_fs_config,
                maybe_tmp_fs_config,
                maybe_otel_config: otel_config,
              },
              tx,
            ))
            .is_err()
          {
            error!("main worker receiver dropped");
          }

          return;
        }

        FlowAfterFence::Create(permit, tx) => (permit, tx),
      };

      let Ok(mut user_worker_rt_opts) = worker_options.conf.into_user_worker()
      else {
        return;
      };

      let uuid = uuid::Uuid::new_v4();
      let cancel = CancellationToken::new();
      let (req_start_timing_tx, req_start_timing_rx) =
        mpsc::unbounded_channel::<Arc<Notify>>();

      let status = TimingStatus {
        demand: Arc::new(AtomicUsize::new(0)),
        is_retired: Arc::new(AtomicFlag::default()),
      };

      let (early_drop_tx, early_drop_rx) = mpsc::unbounded_channel();
      let (req_end_timing_tx, req_end_timing_rx) =
        mpsc::unbounded_channel::<()>();

      user_worker_rt_opts.service_path = Some(service_path.clone());
      user_worker_rt_opts.key = Some(uuid);

      user_worker_rt_opts.pool_msg_tx = Some(worker_pool_msgs_tx.clone());
      user_worker_rt_opts.events_msg_tx = events_msg_tx;
      user_worker_rt_opts.cancel = Some(cancel.clone());

      if let ext_runtime::RateLimiterOpts::Rules { rules, global_key } =
        std::mem::take(&mut user_worker_rt_opts.rate_limiter)
      {
        user_worker_rt_opts.rate_limiter =
          ext_runtime::RateLimiterOpts::Configured(TraceRateLimiterConfig {
            table: shared_rate_limit_table,
            rules,
            global_key: Some(global_key),
          });
      }

      worker_options.timing = Some(Timing {
        early_drop_rx,
        status: status.clone(),
        req: (req_start_timing_rx, req_end_timing_rx),
      });

      worker_options.conf = WorkerRuntimeOpts::UserWorker(user_worker_rt_opts);

      let mut builder = WorkerSurfaceBuilder::new()
        .init_opts(worker_options)
        .policy(supervisor_policy)
        .sever_flags(Left(flags));

      builder
        .set_termination_token(termination_token.clone())
        .set_inspector(inspector)
        .set_eager_module_init(true);

      match builder.build().await {
        Ok(surface) => {
          let profile = UserWorkerProfile {
            pool_key: worker_pool_key,
            worker_request_msg_tx: surface.msg_tx,
            early_drop_tx,
            timing_tx_pair: (req_start_timing_tx, req_end_timing_tx),
            service_path,
            permit: permit.map(Arc::new),
            status: status.clone(),
            exit: surface.exit,
            mem_check: surface.mem_check.clone(),
            cancel,
          };

          if worker_pool_msgs_tx
            .send(UserWorkerMsgs::Created(uuid, profile))
            .is_err()
          {
            error!("user worker msgs receiver dropped")
          }
          if tx
            .send(Ok(CreateUserWorkerResult {
              key: uuid,
              reused: false,
            }))
            .is_err()
          {
            error!("main worker receiver dropped")
          };
        }
        Err(err) => {
          error!("{err:#}");
          if tx.send(Err(err)).is_err() {
            error!("main worker receiver dropped")
          }
        }
      }
    }));
  }

  pub fn add_user_worker(&mut self, key: Uuid, profile: UserWorkerProfile) {
    let registry = self
      .active_workers
      .entry(profile.pool_key.clone())
      .or_insert_with(|| {
        ActiveWorkerRegistry::new(self.policy.max_parallelism)
      });

    registry
      .workers
      .insert(WorkerId(key, self.policy.supervisor_policy.is_per_worker()));

    self.user_workers.insert(key, profile);
    self.metric_src.incl_active_user_workers();
  }

  pub fn send_request(
    &self,
    key: &Uuid,
    req: Request<Body>,
    res_tx: Sender<Result<SendRequestResult, Error>>,
    conn_token: Option<CancellationToken>,
  ) {
    let _: Result<(), Error> = match self.user_workers.get(key) {
      Some(worker) => {
        let policy = self.policy.supervisor_policy;
        let profile = worker.clone();
        let exit = worker.exit.clone();
        let cancel = worker.cancel.clone();
        let (req_start_tx, req_end_tx) = profile.timing_tx_pair.clone();

        if profile.status.is_retired.is_raised() {
          if res_tx
            .send(Err(anyhow!(WorkerError::WorkerAlreadyRetired)))
            .is_err()
          {
            error!("main worker receiver dropped");
          }
        } else {
          profile.status.demand.fetch_add(1, Ordering::Release);

          // Create a closure to handle the request and send the response
          let request_handler = async move {
            if !policy.is_per_worker() {
              if cancel.is_cancelled() {
                bail!(exit.error().await.unwrap_or(anyhow!(
                  WorkerError::RequestCancelledBySupervisor
                )))
              }

              let fence = Arc::new(Notify::const_new());

              if let Err(ex) = req_start_tx.send(fence.clone()) {
                // NOTE(Nyannyacha): The only way to be trapped in this branch
                // is if the supervisor associated with the isolate has been
                // terminated for some reason, such as a wall-clock timeout.
                //
                // It can be expected enough if many isolates are created at
                // once due to requests rapidly increasing.
                //
                // To prevent this, we must give a wall-clock time limit enough
                // to each supervisor.
                error!("failed to notify the fence to the supervisor");
                return Err(ex).with_context(|| {
                  "failed to notify the fence to the supervisor"
                });
              }

              tokio::select! {
                _ = fence.notified() => {}
                _ = cancel.cancelled() => {
                  bail!(
                    exit
                      .error()
                      .await
                      .unwrap_or(
                        anyhow!(WorkerError::RequestCancelledBySupervisor)
                      )
                  )
                }
              }
            }

            let result = send_user_worker_request(
              profile.worker_request_msg_tx,
              req,
              cancel,
              exit,
              conn_token,
            )
            .await;

            match result {
              Ok(req) => Ok((req, req_end_tx)),
              Err(err) => {
                let _ = req_end_tx.send(());
                error!(
                  "failed to send request to user worker: {}",
                  err.to_string()
                );
                Err(err)
              }
            }
          };

          // Spawn the closure as an async task
          tokio::task::spawn(async move {
            if res_tx.send(request_handler.await).is_err() {
              error!("main worker receiver dropped")
            }
          });
        }

        Ok(())
      }

      None => {
        if res_tx
          .send(Err(anyhow!("user worker not available")))
          .is_err()
        {
          error!("main worker receiver dropped")
        }

        Err(anyhow!("user worker not available"))
      }
    };
  }

  pub fn idle(&mut self, key: &Uuid) {
    if let Some(registry) = self
      .user_workers
      .get_mut(key)
      .and_then(|it| self.active_workers.get_mut(&it.pool_key))
    {
      registry.mark_idle(key, self.policy.supervisor_policy);
    }
  }

  pub fn shutdown(&mut self, key: &Uuid) {
    self.retire(key);

    let Some((notify_tx, _)) = self
      .user_workers
      .remove(key)
      .and_then(|it| self.active_workers.get(&it.pool_key))
      .map(|it| it.notify_pair.clone())
    else {
      return;
    };

    let _ = notify_tx.send(None);

    self.metric_src.decl_active_user_workers();
  }

  async fn try_cleanup_idle_workers(&mut self, timeout_ms: usize) -> usize {
    let mut rxs = vec![];
    for profile in self.user_workers.values_mut() {
      let (tx, rx) = oneshot::channel();
      if profile.early_drop_tx.send(tx).is_ok() {
        rxs.push(timeout(Duration::from_millis(timeout_ms as u64), rx));
      }
    }

    join_all(rxs)
      .await
      .into_iter()
      .filter_map(|it| it.ok())
      .map(|it| it.unwrap_or_default())
      .filter(|it| *it)
      .count()
  }

  fn retire(&mut self, key: &Uuid) {
    if let Some(profile) = self.user_workers.get_mut(key) {
      let registry = self
        .active_workers
        .get_mut(&profile.pool_key)
        .expect("registry must be initialized at this point");

      let _ = profile.permit.take();
      let (notify_tx, _) = registry.notify_pair.clone();

      for _ in 0..notify_tx.receiver_count() {
        let _ = notify_tx.send(None);
      }

      if registry.workers.contains(key) {
        registry.workers.remove(key);
        self.metric_src.incl_retired_user_worker();
      }
    }
  }

  fn maybe_active_worker(
    &mut self,
    pool_key: &String,
    force_create: bool,
  ) -> Option<Uuid> {
    if force_create {
      return None;
    }

    let registry = self.active_workers.get_mut(pool_key)?;
    let policy = self.policy.supervisor_policy;

    let mut advance_fn =
      move || registry.mark_used_and_try_advance(policy).copied();
    let worker_uuid = advance_fn()?;

    match self
      .user_workers
      .get(&worker_uuid)
      .map(|it| it.status.is_retired.clone())
    {
      Some(is_retired) if !is_retired.is_raised() => Some(worker_uuid),

      _ => {
        self.retire(&worker_uuid);
        self.maybe_active_worker(pool_key, force_create)
      }
    }
  }

  fn memory_usage(
    &self,
    tx: Sender<HashMap<Uuid, WorkerHeapStatisticsWithServicePath>>,
  ) {
    let mem_checks = self
      .user_workers
      .iter()
      .map(|it| (*it.0, (it.1.service_path.clone(), it.1.mem_check.clone())))
      .collect::<Vec<_>>();

    drop(tokio::task::spawn_blocking(move || {
      let mut results = HashMap::new();
      for (uuid, (service_path, mem_check)) in mem_checks {
        results.insert(
          uuid,
          WorkerHeapStatisticsWithServicePath {
            service_path,
            stats: mem_check.read().ok().map(|it| it.current),
          },
        );
      }

      let _ = tx.send(results);
    }));
  }
}

pub async fn create_user_worker_pool(
  flags: Arc<ServerFlags>,
  policy: WorkerPoolPolicy,
  worker_event_sender: Option<mpsc::UnboundedSender<WorkerEventWithMetadata>>,
  termination_token: Option<TerminationToken>,
  static_patterns: Vec<String>,
  inspector: Option<Inspector>,
) -> Result<(SharedMetricSource, mpsc::UnboundedSender<UserWorkerMsgs>), Error>
{
  let metric_src = SharedMetricSource::default();
  let (user_worker_msgs_tx, mut user_worker_msgs_rx) =
    mpsc::unbounded_channel::<UserWorkerMsgs>();

  let user_worker_msgs_tx_clone = user_worker_msgs_tx.clone();

  let _handle: tokio::task::JoinHandle<Result<(), Error>> = tokio::spawn({
    let metric_src_inner = metric_src.clone();
    async move {
      let token = termination_token.as_ref();
      let mut termination_requested = false;
      let cleanup_cancel = token.map(|t| t.inbound.clone()).unwrap_or_default();
      let mut worker_pool = WorkerPool::new(
        flags,
        policy,
        metric_src_inner,
        worker_event_sender,
        user_worker_msgs_tx_clone,
        inspector,
        cleanup_cancel,
      );

      // Note: Keep this loop non-blocking. Spawn a task to run blocking calls.
      // Handle errors within tasks and log them - do not bubble up errors.
      loop {
        tokio::select! {
          _ = async {
            if let Some(token) = token {
                token.inbound.cancelled().await;
            } else {
                pending::<()>().await;
            }
          }, if !termination_requested => {
            termination_requested = true;

            if worker_pool.user_workers.is_empty() {
                if let Some(token) = token {
                    token.outbound.cancel();
                }

                break;
            }
          }

          msg = user_worker_msgs_rx.recv() => {
            match msg {
              None => break,
              Some(UserWorkerMsgs::Create(worker_options, tx)) => {
                worker_pool.create_user_worker(WorkerContextInitOpts {
                  static_patterns: [worker_options.static_patterns, static_patterns.clone()].concat(),
                  ..worker_options
                }, tx, token.map(TerminationToken::child_token));
              }

              Some(UserWorkerMsgs::Created(key, profile)) => {
                worker_pool.add_user_worker(key, profile);
              }

              Some(UserWorkerMsgs::SendRequest(key, req, res_tx, conn_token)) => {
                worker_pool.send_request(&key, req, res_tx, conn_token);
              }

              Some(UserWorkerMsgs::Idle(key)) => {
                worker_pool.idle(&key);
              }

              Some(UserWorkerMsgs::Shutdown(key)) => {
                worker_pool.shutdown(&key);

                if
                  termination_requested
                    && worker_pool.user_workers.is_empty()
                {
                  if let Some(token) = token {
                    token.outbound.cancel();
                  }

                  break;
                }
              }

              Some(UserWorkerMsgs::TryCleanupIdleWorkers(timeout_ms, res_tx)) => {
                let _ = res_tx.send(worker_pool.try_cleanup_idle_workers(timeout_ms).await);
              }

              Some(UserWorkerMsgs::InqueryMemoryUsage(tx)) => {
                worker_pool.memory_usage(tx);
              }
            }
          }
        }
      }

      worker_pool.worker_event_sender.take();

      Ok(())
    }
  });

  Ok((metric_src, user_worker_msgs_tx))
}
