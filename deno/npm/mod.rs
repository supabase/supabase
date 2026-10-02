// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

pub mod byonm;
pub mod managed;

use std::borrow::Cow;
use std::path::Path;
use std::sync::Arc;

use byonm::CliByonmNpmResolver;
use byonm::CliByonmNpmResolverCreateOptions;
use deno_core::error::AnyError;
use deno_core::url::Url;
use deno_fs::FileSystem;
use deno_resolver::npm::ByonmInNpmPackageChecker;
use deno_resolver::npm::ByonmNpmResolver;
use deno_resolver::npm::CliNpmReqResolver;
use ext_node::NodePermissions;
use http::HeaderName;
use http::HeaderValue;
pub use managed::*;
use node_resolver::InNpmPackageChecker;
use node_resolver::NpmPackageFolderResolver;

use crate::http_util::HttpClientProvider;
use crate::util::fs::atomic_write_file_with_retries_and_fs;
use crate::util::fs::hard_link_dir_recursive;
use crate::util::fs::AtomicWriteFileFsAdapter;

pub type CliNpmTarballCache = deno_npm_cache::TarballCache<CliNpmCacheEnv>;
pub type CliNpmCache = deno_npm_cache::NpmCache<CliNpmCacheEnv>;
pub type CliNpmRegistryInfoProvider =
  deno_npm_cache::RegistryInfoProvider<CliNpmCacheEnv>;

#[derive(Debug)]
pub struct CliNpmCacheEnv {
  fs: Arc<dyn FileSystem>,
  http_client_provider: Arc<HttpClientProvider>,
}

impl CliNpmCacheEnv {
  pub fn new(
    fs: Arc<dyn FileSystem>,
    http_client_provider: Arc<HttpClientProvider>,
  ) -> Self {
    Self {
      fs,
      http_client_provider,
    }
  }
}

#[async_trait::async_trait(?Send)]
impl deno_npm_cache::NpmCacheEnv for CliNpmCacheEnv {
  fn exists(&self, path: &Path) -> bool {
    self.fs.exists_sync(path)
  }

  fn hard_link_dir_recursive(
    &self,
    from: &Path,
    to: &Path,
  ) -> Result<(), AnyError> {
    // todo(dsherret): use self.fs here instead
    hard_link_dir_recursive(from, to)
  }

  fn atomic_write_file_with_retries(
    &self,
    file_path: &Path,
    data: &[u8],
  ) -> std::io::Result<()> {
    atomic_write_file_with_retries_and_fs(
      &AtomicWriteFileFsAdapter {
        fs: self.fs.as_ref(),
        write_mode: crate::cache::CACHE_PERM,
      },
      file_path,
      data,
    )
  }

  async fn download_with_retries_on_any_tokio_runtime(
    &self,
    url: Url,
    maybe_auth_header: Option<(HeaderName, HeaderValue)>,
  ) -> Result<Option<Vec<u8>>, deno_npm_cache::DownloadError> {
    let client = self.http_client_provider.get_or_create().map_err(|err| {
      deno_npm_cache::DownloadError {
        status_code: None,
        error: err,
      }
    })?;
    client
      .download_with_progress_and_retries(url, maybe_auth_header)
      .await
      .map_err(|err| {
        use crate::http_util::DownloadError::*;
        let status_code = match &err {
          Fetch { .. }
          | UrlParse { .. }
          | HttpParse { .. }
          | Json { .. }
          | ToStr { .. }
          | NoRedirectHeader { .. }
          | TooManyRedirects => None,
          BadResponse(bad_response_error) => {
            Some(bad_response_error.status_code)
          }
        };
        deno_npm_cache::DownloadError {
          status_code,
          error: err.into(),
        }
      })
  }
}

// /// State provided to the process via an environment variable.
// #[derive(Clone, Debug, Serialize, Deserialize)]
// pub struct NpmProcessState {
//   pub kind: NpmProcessStateKind,
//   pub local_node_modules_path: Option<String>,
// }

// #[derive(Clone, Debug, Serialize, Deserialize)]
// pub enum NpmProcessStateKind {
//   Snapshot(deno_npm::resolution::SerializedNpmResolutionSnapshot),
//   Byonm,
// }

pub enum CliNpmResolverCreateOptions {
  Managed(CliManagedNpmResolverCreateOptions),
  Byonm(CliByonmNpmResolverCreateOptions),
}

pub async fn create_cli_npm_resolver(
  options: CliNpmResolverCreateOptions,
) -> Result<Arc<dyn CliNpmResolver>, AnyError> {
  use CliNpmResolverCreateOptions::*;
  match options {
    Managed(options) => managed::create_managed_npm_resolver(options).await,
    Byonm(options) => Ok(Arc::new(ByonmNpmResolver::new(options))),
  }
}

pub enum CreateInNpmPkgCheckerOptions<'a> {
  Managed(CliManagedInNpmPkgCheckerCreateOptions<'a>),
  Byonm,
}

pub fn create_in_npm_pkg_checker(
  options: CreateInNpmPkgCheckerOptions,
) -> Arc<dyn InNpmPackageChecker> {
  match options {
    CreateInNpmPkgCheckerOptions::Managed(options) => {
      create_managed_in_npm_pkg_checker(options)
    }
    CreateInNpmPkgCheckerOptions::Byonm => Arc::new(ByonmInNpmPackageChecker),
  }
}

pub enum InnerCliNpmResolverRef<'a> {
  Managed(&'a ManagedCliNpmResolver),
  #[allow(dead_code)]
  Byonm(&'a CliByonmNpmResolver),
}

pub trait CliNpmResolver: NpmPackageFolderResolver + CliNpmReqResolver {
  fn into_npm_pkg_folder_resolver(
    self: Arc<Self>,
  ) -> Arc<dyn NpmPackageFolderResolver>;
  fn into_npm_req_resolver(self: Arc<Self>) -> Arc<dyn CliNpmReqResolver>;
  fn into_maybe_byonm(self: Arc<Self>) -> Option<Arc<CliByonmNpmResolver>> {
    None
  }

  fn clone_snapshotted(&self) -> Arc<dyn CliNpmResolver>;

  fn as_inner(&self) -> InnerCliNpmResolverRef<'_>;

  fn as_managed(&self) -> Option<&ManagedCliNpmResolver> {
    match self.as_inner() {
      InnerCliNpmResolverRef::Managed(inner) => Some(inner),
      InnerCliNpmResolverRef::Byonm(_) => None,
    }
  }

  fn as_byonm(&self) -> Option<&CliByonmNpmResolver> {
    match self.as_inner() {
      InnerCliNpmResolverRef::Managed(_) => None,
      InnerCliNpmResolverRef::Byonm(inner) => Some(inner),
    }
  }

  fn root_node_modules_path(&self) -> Option<&Path>;

  fn ensure_read_permission<'a>(
    &self,
    permissions: &mut dyn NodePermissions,
    path: &'a Path,
  ) -> Result<Cow<'a, Path>, AnyError>;

  /// Returns a hash returning the state of the npm resolver
  /// or `None` if the state currently can't be determined.
  fn check_state_hash(&self) -> Option<u64>;
}
