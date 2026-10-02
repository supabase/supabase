// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::collections::BTreeMap;

use deno_config::workspace::PackageJsonDepResolution;
use deno_core::serde_json;
use deno_semver::Version;
use indexmap::IndexMap;
use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum NodeModules {
  Managed {
    /// Relative path for the node_modules directory in the vfs.
    node_modules_dir: Option<String>,
  },
  Byonm {
    root_node_modules_dir: Option<String>,
  },
}

#[derive(Deserialize, Serialize)]
pub struct SerializedWorkspaceResolverImportMap {
  pub specifier: String,
  pub json: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SerializedResolverWorkspaceJsrPackage {
  pub relative_base: String,
  pub name: String,
  pub version: Option<Version>,
  pub exports: IndexMap<String, String>,
}

#[derive(Default, Deserialize, Serialize)]
pub struct SerializedWorkspaceResolver {
  pub import_map: Option<SerializedWorkspaceResolverImportMap>,
  pub jsr_pkgs: Vec<SerializedResolverWorkspaceJsrPackage>,
  pub package_jsons: BTreeMap<String, serde_json::Value>,
  pub pkg_json_resolution: PackageJsonDepResolution,
}
