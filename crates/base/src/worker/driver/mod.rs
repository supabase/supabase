use std::future::Future;
use std::sync::Arc;

use anyhow::Context;
use anyhow::Error;
use ext_event_worker::events::BootFailureEvent;
use ext_event_worker::events::WorkerEvents;
use ext_workers::context::WorkerContextInitOpts;
use ext_workers::context::WorkerKind;
use futures_util::FutureExt;
use tokio::sync::mpsc;
use tokio::sync::oneshot;
use tokio::task::JoinError;
use tokio_util::task::LocalPoolHandle;

use crate::runtime::DenoRuntime;
use crate::worker::DuplexStreamEntry;
use crate::worker::WorkerCx;

mod managed;
mod user;

struct BaseCx {
  network_tx: mpsc::UnboundedSender<DuplexStreamEntry>,
  network_rx: Option<mpsc::UnboundedReceiver<DuplexStreamEntry>>,
  termination_event_tx: Option<oneshot::Sender<WorkerEvents>>,
  termination_event_rx: Option<oneshot::Receiver<WorkerEvents>>,
}

impl Default for BaseCx {
  fn default() -> Self {
    let (network_tx, network_rx) = mpsc::unbounded_channel();
    let (termination_event_tx, termination_event_rx) = oneshot::channel();

    Self {
      network_tx,
      network_rx: Some(network_rx),
      termination_event_tx: Some(termination_event_tx),
      termination_event_rx: Some(termination_event_rx),
    }
  }
}

impl BaseCx {
  fn get_network_sender(&self) -> mpsc::UnboundedSender<DuplexStreamEntry> {
    self.network_tx.clone()
  }

  fn take_network_receiver(
    &mut self,
  ) -> Result<mpsc::UnboundedReceiver<DuplexStreamEntry>, Error> {
    self
      .network_rx
      .take()
      .context("network_rx already been consumed")
  }

  fn take_termination_event_sender(
    &mut self,
  ) -> Result<oneshot::Sender<WorkerEvents>, Error> {
    self
      .termination_event_tx
      .take()
      .context("termination_event_tx already been consumed")
  }

  fn take_termination_event_receiver(
    &mut self,
  ) -> Result<oneshot::Receiver<WorkerEvents>, Error> {
    self
      .termination_event_rx
      .take()
      .context("termination_event_rx already been consumed")
  }
}

#[derive(Clone)]
pub(crate) enum WorkerDriverImpl {
  User(user::User),
  Managed(managed::Managed),
}

impl WorkerDriver for WorkerDriverImpl {
  async fn on_boot_error(&self, error: Error) -> Result<WorkerEvents, Error> {
    match self {
      Self::User(user) => user.on_boot_error(error).await,
      Self::Managed(managed) => managed.on_boot_error(error).await,
    }
  }

  fn on_created<'l>(
    &self,
    runtime: &'l mut DenoRuntime,
  ) -> impl Future<Output = Result<WorkerEvents, Error>> + 'l {
    let this = self.clone();
    async move {
      match this {
        Self::User(user) => user.on_created(runtime).await,
        Self::Managed(managed) => managed.on_created(runtime).await,
      }
    }
  }

  fn supervise(
    &self,
    runtime: &mut DenoRuntime,
  ) -> Option<impl Future<Output = Result<(), JoinError>> + 'static> {
    match self {
      Self::User(user) => user.supervise(runtime).map(FutureExt::boxed),
      Self::Managed(managed) => {
        managed.supervise(runtime).map(FutureExt::boxed)
      }
    }
  }

  fn runtime_handle(&self) -> &'static LocalPoolHandle {
    match self {
      Self::User(user) => user.runtime_handle(),
      Self::Managed(managed) => managed.runtime_handle(),
    }
  }

  async fn network_sender(&self) -> mpsc::UnboundedSender<DuplexStreamEntry> {
    match self {
      Self::User(user) => user.network_sender().await,
      Self::Managed(managed) => managed.network_sender().await,
    }
  }
}

impl WorkerDriverImpl {
  pub fn new(
    init_opts: &mut WorkerContextInitOpts,
    inner: Arc<WorkerCx>,
  ) -> Self {
    match init_opts.conf.to_worker_kind() {
      WorkerKind::UserWorker => Self::User(user::User::new(init_opts, inner)),
      WorkerKind::MainWorker | WorkerKind::EventsWorker => {
        Self::Managed(managed::Managed::new(inner))
      }
    }
  }
}

pub(super) trait WorkerDriver: Send {
  fn on_boot_error(
    &self,
    error: Error,
  ) -> impl Future<Output = Result<WorkerEvents, Error>> {
    async move {
      log::error!("{}", format!("{error:#}"));
      Ok(WorkerEvents::BootFailure(BootFailureEvent {
        msg: format!("{error:#}"),
      }))
    }
  }

  fn on_created<'l>(
    &self,
    runtime: &'l mut DenoRuntime,
  ) -> impl Future<Output = Result<WorkerEvents, Error>> + 'l;

  fn supervise(
    &self,
    runtime: &mut DenoRuntime,
  ) -> Option<impl Future<Output = Result<(), JoinError>> + 'static>;

  fn runtime_handle(&self) -> &'static LocalPoolHandle;
  fn network_sender(
    &self,
  ) -> impl Future<Output = mpsc::UnboundedSender<DuplexStreamEntry>>;
}
