// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::collections::HashMap;
use std::collections::HashSet;
use std::sync::Arc;

use deno_core::error::AnyError;
use deno_lockfile::NpmPackageDependencyLockfileInfo;
use deno_lockfile::NpmPackageLockfileInfo;
use deno_npm::registry::NpmRegistryApi;
use deno_npm::resolution::AddPkgReqsOptions;
use deno_npm::resolution::NpmPackagesPartitioned;
use deno_npm::resolution::NpmResolutionError;
use deno_npm::resolution::NpmResolutionSnapshot;
use deno_npm::resolution::PackageCacheFolderIdNotFoundError;
use deno_npm::resolution::PackageNotFoundFromReferrerError;
use deno_npm::resolution::PackageNvNotFoundError;
use deno_npm::resolution::PackageReqNotFoundError;
use deno_npm::resolution::ValidSerializedNpmResolutionSnapshot;
use deno_npm::NpmPackageCacheFolderId;
use deno_npm::NpmPackageId;
use deno_npm::NpmResolutionPackage;
use deno_npm::NpmSystemInfo;
use deno_semver::jsr::JsrDepPackageReq;
use deno_semver::package::PackageNv;
use deno_semver::package::PackageReq;
use deno_semver::VersionReq;

use crate::args::CliLockfile;
use crate::npm::CliNpmRegistryInfoProvider;
use crate::util::sync::SyncReadAsyncWriteLock;

pub struct AddPkgReqsResult {
  /// Results from adding the individual packages.
  ///
  /// The indexes of the results correspond to the indexes of the provided
  /// package requirements.
  pub results: Vec<Result<PackageNv, NpmResolutionError>>,
  /// The final result of resolving and caching all the package requirements.
  pub dependencies_result: Result<(), AnyError>,
}

/// Handles updating and storing npm resolution in memory where the underlying
/// snapshot can be updated concurrently. Additionally handles updating the lockfile
/// based on changes to the resolution.
///
/// This does not interact with the file system.
pub struct NpmResolution {
  api: Arc<CliNpmRegistryInfoProvider>,
  snapshot: SyncReadAsyncWriteLock<NpmResolutionSnapshot>,
  maybe_lockfile: Option<Arc<CliLockfile>>,
}

impl std::fmt::Debug for NpmResolution {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    let snapshot = self.snapshot.read();
    f.debug_struct("NpmResolution")
      .field("snapshot", &snapshot.as_valid_serialized().as_serialized())
      .finish()
  }
}

impl NpmResolution {
  pub fn from_serialized(
    api: Arc<CliNpmRegistryInfoProvider>,
    initial_snapshot: Option<ValidSerializedNpmResolutionSnapshot>,
    maybe_lockfile: Option<Arc<CliLockfile>>,
  ) -> Self {
    let snapshot =
      NpmResolutionSnapshot::new(initial_snapshot.unwrap_or_default());
    Self::new(api, snapshot, maybe_lockfile)
  }

  pub fn new(
    api: Arc<CliNpmRegistryInfoProvider>,
    initial_snapshot: NpmResolutionSnapshot,
    maybe_lockfile: Option<Arc<CliLockfile>>,
  ) -> Self {
    Self {
      api,
      snapshot: SyncReadAsyncWriteLock::new(initial_snapshot),
      maybe_lockfile,
    }
  }

  pub async fn add_package_reqs(
    &self,
    package_reqs: &[PackageReq],
  ) -> AddPkgReqsResult {
    // only allow one thread in here at a time
    let snapshot_lock = self.snapshot.acquire().await;
    let result = add_package_reqs_to_snapshot(
      &self.api,
      package_reqs,
      self.maybe_lockfile.clone(),
      || snapshot_lock.read().clone(),
    )
    .await;

    AddPkgReqsResult {
      results: result.results,
      dependencies_result: match result.dep_graph_result {
        Ok(snapshot) => {
          *snapshot_lock.write() = snapshot;
          Ok(())
        }
        Err(err) => Err(err.into()),
      },
    }
  }

  pub async fn set_package_reqs(
    &self,
    package_reqs: &[PackageReq],
  ) -> Result<(), AnyError> {
    // only allow one thread in here at a time
    let snapshot_lock = self.snapshot.acquire().await;

    let reqs_set = package_reqs.iter().collect::<HashSet<_>>();
    let snapshot = add_package_reqs_to_snapshot(
      &self.api,
      package_reqs,
      self.maybe_lockfile.clone(),
      || {
        let snapshot = snapshot_lock.read().clone();
        let has_removed_package = !snapshot
          .package_reqs()
          .keys()
          .all(|req| reqs_set.contains(req));
        // if any packages were removed, we need to completely recreate the npm resolution snapshot
        if has_removed_package {
          snapshot.into_empty()
        } else {
          snapshot
        }
      },
    )
    .await
    .into_result()?;

    *snapshot_lock.write() = snapshot;

    Ok(())
  }

  pub fn resolve_pkg_cache_folder_id_from_pkg_id(
    &self,
    id: &NpmPackageId,
  ) -> Option<NpmPackageCacheFolderId> {
    self
      .snapshot
      .read()
      .package_from_id(id)
      .map(|p| p.get_package_cache_folder_id())
  }

  pub fn resolve_pkg_id_from_pkg_cache_folder_id(
    &self,
    id: &NpmPackageCacheFolderId,
  ) -> Result<NpmPackageId, PackageCacheFolderIdNotFoundError> {
    self
      .snapshot
      .read()
      .resolve_pkg_from_pkg_cache_folder_id(id)
      .map(|pkg| pkg.id.clone())
  }

  pub fn resolve_package_from_package(
    &self,
    name: &str,
    referrer: &NpmPackageCacheFolderId,
  ) -> Result<NpmResolutionPackage, Box<PackageNotFoundFromReferrerError>> {
    self
      .snapshot
      .read()
      .resolve_package_from_package(name, referrer)
      .cloned()
  }

  /// Resolve a node package from a deno module.
  pub fn resolve_pkg_id_from_pkg_req(
    &self,
    req: &PackageReq,
  ) -> Result<NpmPackageId, PackageReqNotFoundError> {
    self
      .snapshot
      .read()
      .resolve_pkg_from_pkg_req(req)
      .map(|pkg| pkg.id.clone())
  }

  pub fn resolve_pkg_reqs_from_pkg_id(
    &self,
    id: &NpmPackageId,
  ) -> Vec<PackageReq> {
    let snapshot = self.snapshot.read();
    let mut pkg_reqs = snapshot
      .package_reqs()
      .iter()
      .filter(|(_, nv)| *nv == &id.nv)
      .map(|(req, _)| req.clone())
      .collect::<Vec<_>>();
    pkg_reqs.sort(); // be deterministic
    pkg_reqs
  }

  pub fn resolve_pkg_id_from_deno_module(
    &self,
    id: &PackageNv,
  ) -> Result<NpmPackageId, PackageNvNotFoundError> {
    self
      .snapshot
      .read()
      .resolve_package_from_deno_module(id)
      .map(|pkg| pkg.id.clone())
  }

  pub fn package_reqs(&self) -> HashMap<PackageReq, PackageNv> {
    self.snapshot.read().package_reqs().clone()
  }

  pub fn all_system_packages(
    &self,
    system_info: &NpmSystemInfo,
  ) -> Vec<NpmResolutionPackage> {
    self.snapshot.read().all_system_packages(system_info)
  }

  pub fn all_system_packages_partitioned(
    &self,
    system_info: &NpmSystemInfo,
  ) -> NpmPackagesPartitioned {
    self
      .snapshot
      .read()
      .all_system_packages_partitioned(system_info)
  }

  pub fn snapshot(&self) -> NpmResolutionSnapshot {
    self.snapshot.read().clone()
  }

  pub fn serialized_valid_snapshot(
    &self,
  ) -> ValidSerializedNpmResolutionSnapshot {
    self.snapshot.read().as_valid_serialized()
  }

  pub fn serialized_valid_snapshot_for_system(
    &self,
    system_info: &NpmSystemInfo,
  ) -> ValidSerializedNpmResolutionSnapshot {
    self
      .snapshot
      .read()
      .as_valid_serialized_for_system(system_info)
  }

  pub fn subset(&self, package_reqs: &[PackageReq]) -> NpmResolutionSnapshot {
    self.snapshot.read().subset(package_reqs)
  }
}

async fn add_package_reqs_to_snapshot(
  registry_info_provider: &Arc<CliNpmRegistryInfoProvider>,
  package_reqs: &[PackageReq],
  maybe_lockfile: Option<Arc<CliLockfile>>,
  get_new_snapshot: impl Fn() -> NpmResolutionSnapshot,
) -> deno_npm::resolution::AddPkgReqsResult {
  let snapshot = get_new_snapshot();
  if package_reqs
    .iter()
    .all(|req| snapshot.package_reqs().contains_key(req))
  {
    log::debug!("Snapshot already up to date. Skipping npm resolution.");
    return deno_npm::resolution::AddPkgReqsResult {
      results: package_reqs
        .iter()
        .map(|req| Ok(snapshot.package_reqs().get(req).unwrap().clone()))
        .collect(),
      dep_graph_result: Ok(snapshot),
    };
  }
  log::debug!(
    /* this string is used in tests */
    "Running npm resolution."
  );
  let npm_registry_api = registry_info_provider.as_npm_registry_api();
  let result = snapshot
    .add_pkg_reqs(&npm_registry_api, get_add_pkg_reqs_options(package_reqs))
    .await;
  let result = match &result.dep_graph_result {
    Err(NpmResolutionError::Resolution(err))
      if npm_registry_api.mark_force_reload() =>
    {
      log::debug!("{err:#}");
      log::debug!("npm resolution failed. Trying again...");

      // try again with forced reloading
      let snapshot = get_new_snapshot();
      snapshot
        .add_pkg_reqs(&npm_registry_api, get_add_pkg_reqs_options(package_reqs))
        .await
    }
    _ => result,
  };

  registry_info_provider.clear_memory_cache();

  if let Ok(snapshot) = &result.dep_graph_result {
    if let Some(lockfile) = maybe_lockfile {
      populate_lockfile_from_snapshot(&lockfile, snapshot);
    }
  }

  result
}

fn get_add_pkg_reqs_options(
  package_reqs: &[PackageReq],
) -> AddPkgReqsOptions<'_> {
  AddPkgReqsOptions {
    package_reqs,
    // WARNING: When bumping this version, check if anything needs to be
    // updated in the `setNodeOnlyGlobalNames` call in 99_main_compiler.js
    types_node_version_req: Some(
      VersionReq::parse_from_npm("22.0.0 - 22.5.4").unwrap(),
    ),
  }
}

fn populate_lockfile_from_snapshot(
  lockfile: &CliLockfile,
  snapshot: &NpmResolutionSnapshot,
) {
  let mut lockfile = lockfile.lock();
  for (package_req, nv) in snapshot.package_reqs() {
    let id = &snapshot.resolve_package_from_deno_module(nv).unwrap().id;
    lockfile.insert_package_specifier(
      JsrDepPackageReq::npm(package_req.clone()),
      format!("{}{}", id.nv.version, id.peer_deps_serialized()),
    );
  }
  for package in snapshot.all_packages_for_every_system() {
    lockfile.insert_npm_package(npm_package_to_lockfile_info(package));
  }
}

fn npm_package_to_lockfile_info(
  pkg: &NpmResolutionPackage,
) -> NpmPackageLockfileInfo {
  let dependencies = pkg
    .dependencies
    .iter()
    .map(|(name, id)| NpmPackageDependencyLockfileInfo {
      name: name.clone(),
      id: id.as_serialized(),
    })
    .collect();

  NpmPackageLockfileInfo {
    serialized_id: pkg.id.as_serialized(),
    integrity: pkg.dist.integrity().for_lockfile(),
    dependencies,
  }
}
