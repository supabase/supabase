// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

mod common;
mod global;
mod local;

use std::path::PathBuf;
use std::sync::Arc;

use deno_fs::FileSystem;
use deno_npm::NpmSystemInfo;

use crate::args::NpmInstallDepsProvider;
use crate::npm::CliNpmCache;
use crate::npm::CliNpmTarballCache;

pub use self::common::NpmPackageFsResolver;

use self::global::GlobalNpmPackageResolver;
use self::local::LocalNpmPackageResolver;

use super::resolution::NpmResolution;

#[allow(clippy::too_many_arguments)]
pub fn create_npm_fs_resolver(
  fs: Arc<dyn FileSystem>,
  npm_cache: Arc<CliNpmCache>,
  npm_install_deps_provider: &Arc<NpmInstallDepsProvider>,
  resolution: Arc<NpmResolution>,
  tarball_cache: Arc<CliNpmTarballCache>,
  maybe_node_modules_path: Option<PathBuf>,
  system_info: NpmSystemInfo,
) -> Arc<dyn NpmPackageFsResolver> {
  match maybe_node_modules_path {
    Some(node_modules_folder) => Arc::new(LocalNpmPackageResolver::new(
      npm_cache,
      fs,
      npm_install_deps_provider.clone(),
      resolution,
      tarball_cache,
      node_modules_folder,
      system_info,
    )),
    None => Arc::new(GlobalNpmPackageResolver::new(
      npm_cache,
      fs,
      tarball_cache,
      resolution,
      system_info,
    )),
  }
}
