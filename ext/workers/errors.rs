use thiserror::Error;

#[derive(Error, Debug)]
pub enum WorkerError {
  #[error("request has been cancelled by supervisor")]
  RequestCancelledBySupervisor,
  #[error("request cannot be handled because the worker has already retired")]
  WorkerAlreadyRetired,
  #[error("request timed out")]
  RequestIdleTimeout,
}
