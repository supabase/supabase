// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::borrow::Cow;
use std::path::Path;
use std::sync::Arc;

use deno_core::error::AnyError;
use deno_resolver::npm::ByonmNpmResolver;
use deno_resolver::npm::ByonmNpmResolverCreateOptions;
use deno_resolver::npm::CliNpmReqResolver;
use ext_node::DenoFsNodeResolverEnv;
use ext_node::NodePermissions;
use node_resolver::NpmPackageFolderResolver;

use crate::resolver::CliDenoResolverFs;

use super::CliNpmResolver;
use super::InnerCliNpmResolverRef;

pub type CliByonmNpmResolverCreateOptions =
  ByonmNpmResolverCreateOptions<CliDenoResolverFs, DenoFsNodeResolverEnv>;
pub type CliByonmNpmResolver =
  ByonmNpmResolver<CliDenoResolverFs, DenoFsNodeResolverEnv>;

impl CliNpmResolver for CliByonmNpmResolver {
  fn into_npm_pkg_folder_resolver(
    self: Arc<Self>,
  ) -> Arc<dyn NpmPackageFolderResolver> {
    self
  }

  fn into_npm_req_resolver(self: Arc<Self>) -> Arc<dyn CliNpmReqResolver> {
    self
  }

  fn into_maybe_byonm(self: Arc<Self>) -> Option<Arc<CliByonmNpmResolver>> {
    Some(self)
  }

  fn clone_snapshotted(&self) -> Arc<dyn CliNpmResolver> {
    Arc::new(self.clone())
  }

  fn as_inner(&self) -> InnerCliNpmResolverRef<'_> {
    InnerCliNpmResolverRef::Byonm(self)
  }

  fn root_node_modules_path(&self) -> Option<&Path> {
    self.root_node_modules_dir()
  }

  fn ensure_read_permission<'a>(
    &self,
    permissions: &mut dyn NodePermissions,
    path: &'a Path,
  ) -> Result<Cow<'a, Path>, AnyError> {
    if !path
      .components()
      .any(|c| c.as_os_str().eq_ignore_ascii_case("node_modules"))
    {
      permissions.check_read_path(path).map_err(Into::into)
    } else {
      Ok(Cow::Borrowed(path))
    }
  }

  fn check_state_hash(&self) -> Option<u64> {
    // it is very difficult to determine the check state hash for byonm
    // so we just return None to signify check caching is not supported
    None
  }
}
