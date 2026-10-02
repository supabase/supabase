// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::borrow::Cow;
use std::collections::HashMap;
use std::io::ErrorKind;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Mutex;

use async_trait::async_trait;
use deno_ast::ModuleSpecifier;
use deno_core::anyhow::Context;
use deno_core::error::AnyError;
use deno_core::futures;
use deno_core::futures::StreamExt;
use deno_fs::FileSystem;
use deno_npm::NpmPackageCacheFolderId;
use deno_npm::NpmPackageId;
use deno_npm::NpmResolutionPackage;

use ext_node::NodePermissions;
use node_resolver::errors::PackageFolderResolveError;

use crate::npm::CliNpmTarballCache;
use crate::npm::PackageCaching;

/// Part of the resolution that interacts with the file system.
#[async_trait(?Send)]
pub trait NpmPackageFsResolver: Send + Sync {
  /// The local node_modules folder if it is applicable to the implementation.
  fn node_modules_path(&self) -> Option<&Path>;

  fn maybe_package_folder(&self, package_id: &NpmPackageId) -> Option<PathBuf>;

  fn package_folder(
    &self,
    package_id: &NpmPackageId,
  ) -> Result<PathBuf, AnyError> {
    self.maybe_package_folder(package_id).ok_or_else(|| {
      deno_core::anyhow::anyhow!(
        "Package folder not found for '{}'",
        package_id.as_serialized()
      )
    })
  }

  fn resolve_package_folder_from_package(
    &self,
    name: &str,
    referrer: &ModuleSpecifier,
  ) -> Result<PathBuf, PackageFolderResolveError>;

  fn resolve_package_cache_folder_id_from_specifier(
    &self,
    specifier: &ModuleSpecifier,
  ) -> Result<Option<NpmPackageCacheFolderId>, AnyError>;

  async fn cache_packages<'a>(
    &self,
    caching: PackageCaching<'a>,
  ) -> Result<(), AnyError>;

  fn ensure_read_permission<'a>(
    &self,
    permissions: &mut dyn NodePermissions,
    path: &'a Path,
  ) -> Result<Cow<'a, Path>, AnyError>;
}

#[derive(Debug)]
pub struct RegistryReadPermissionChecker {
  fs: Arc<dyn FileSystem>,
  cache: Mutex<HashMap<PathBuf, PathBuf>>,
  registry_path: PathBuf,
}

impl RegistryReadPermissionChecker {
  pub fn new(fs: Arc<dyn FileSystem>, registry_path: PathBuf) -> Self {
    Self {
      fs,
      registry_path,
      cache: Default::default(),
    }
  }

  pub fn ensure_registry_read_permission<'a>(
    &self,
    permissions: &mut dyn NodePermissions,
    path: &'a Path,
  ) -> Result<Cow<'a, Path>, AnyError> {
    if permissions.query_read_all() {
      return Ok(Cow::Borrowed(path)); // skip permissions checks below
    }

    // allow reading if it's in the node_modules
    let is_path_in_node_modules = path.starts_with(&self.registry_path)
      && path
        .components()
        .all(|c| !matches!(c, std::path::Component::ParentDir));

    if is_path_in_node_modules {
      let mut cache = self.cache.lock().unwrap();
      let mut canonicalize =
        |path: &Path| -> Result<Option<PathBuf>, AnyError> {
          match cache.get(path) {
            Some(canon) => Ok(Some(canon.clone())),
            None => match self.fs.realpath_sync(path) {
              Ok(canon) => {
                cache.insert(path.to_path_buf(), canon.clone());
                Ok(Some(canon))
              }
              Err(e) => {
                if e.kind() == ErrorKind::NotFound {
                  return Ok(None);
                }
                Err(AnyError::from(e)).with_context(|| {
                  format!("failed canonicalizing '{}'", path.display())
                })
              }
            },
          }
        };
      if let Some(registry_path_canon) = canonicalize(&self.registry_path)? {
        if let Some(path_canon) = canonicalize(path)? {
          if path_canon.starts_with(registry_path_canon) {
            return Ok(Cow::Owned(path_canon));
          }
        } else if path.starts_with(registry_path_canon)
          || path.starts_with(&self.registry_path)
        {
          return Ok(Cow::Borrowed(path));
        }
      }
    }

    permissions.check_read_path(path).map_err(Into::into)
  }
}

/// Caches all the packages in parallel.
pub async fn cache_packages(
  packages: &[NpmResolutionPackage],
  tarball_cache: &Arc<CliNpmTarballCache>,
) -> Result<(), AnyError> {
  let mut futures_unordered = futures::stream::FuturesUnordered::new();
  for package in packages {
    futures_unordered.push(async move {
      tarball_cache
        .ensure_package(&package.id.nv, &package.dist)
        .await
    });
  }
  while let Some(result) = futures_unordered.next().await {
    // surface the first error
    result?;
  }
  Ok(())
}
