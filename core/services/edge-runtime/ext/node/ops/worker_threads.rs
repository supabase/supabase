// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use deno_core::op2;
use deno_core::url::Url;
use deno_core::OpState;
use deno_fs::FileSystemRc;
use deno_permissions::PermissionsContainer;
use std::borrow::Cow;
use std::path::Path;
use std::path::PathBuf;

use crate::NodePermissions;
use crate::NodeRequireLoaderRc;

#[must_use = "the resolved return value to mitigate time-of-check to time-of-use issues"]
fn ensure_read_permission<'a, P>(
  state: &mut OpState,
  file_path: &'a Path,
) -> Result<Cow<'a, Path>, deno_core::error::AnyError>
where
  P: NodePermissions + 'static,
{
  let loader = state.borrow::<NodeRequireLoaderRc>().clone();
  let permissions = state.borrow_mut::<P>();
  loader.ensure_read_permission(permissions, file_path)
}

#[derive(Debug, thiserror::Error)]
pub enum WorkerThreadsFilenameError {
  #[error(transparent)]
  Permission(deno_core::error::AnyError),
  #[error("{0}")]
  UrlParse(#[from] url::ParseError),
  #[error("Relative path entries must start with '.' or '..'")]
  InvalidRelativeUrl,
  #[error("URL from Path-String")]
  UrlFromPathString,
  #[error("URL to Path-String")]
  UrlToPathString,
  #[error("URL to Path")]
  UrlToPath,
  #[error("File not found [{0:?}]")]
  FileNotFound(PathBuf),
  #[error(transparent)]
  Fs(#[from] deno_io::fs::FsError),
}

// todo(dsherret): we should remove this and do all this work inside op_create_worker
#[op2(stack_trace)]
#[string]
pub fn op_worker_threads_filename<P>(
  state: &mut OpState,
  #[string] specifier: String,
) -> Result<String, WorkerThreadsFilenameError>
where
  P: NodePermissions + 'static,
{
  state
    .borrow_mut::<PermissionsContainer>()
    .check_run_all("node:v8")
    .map_err(deno_core::error::AnyError::from)
    .map_err(WorkerThreadsFilenameError::Permission)?;

  if specifier.starts_with("data:") {
    return Ok(specifier);
  }
  let url: Url = if specifier.starts_with("file:") {
    Url::parse(&specifier)?
  } else {
    let path = PathBuf::from(&specifier);
    if path.is_relative() && !specifier.starts_with('.') {
      return Err(WorkerThreadsFilenameError::InvalidRelativeUrl);
    }
    let path = ensure_read_permission::<P>(state, &path)
      .map_err(WorkerThreadsFilenameError::Permission)?;
    let fs = state.borrow::<FileSystemRc>();
    let canonicalized_path =
      deno_path_util::strip_unc_prefix(fs.realpath_sync(&path)?);
    Url::from_file_path(canonicalized_path)
      .map_err(|_| WorkerThreadsFilenameError::UrlFromPathString)?
  };
  let url_path = url
    .to_file_path()
    .map_err(|_| WorkerThreadsFilenameError::UrlToPathString)?;
  let url_path = ensure_read_permission::<P>(state, &url_path)
    .map_err(WorkerThreadsFilenameError::Permission)?;
  let fs = state.borrow::<FileSystemRc>();
  if !fs.exists_sync(&url_path) {
    return Err(WorkerThreadsFilenameError::FileNotFound(
      url_path.to_path_buf(),
    ));
  }
  Ok(url.to_string())
}
