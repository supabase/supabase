// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::collections::HashSet;
use std::path::PathBuf;

use deno_config::deno_json::ConfigFile;
use deno_config::workspace::Workspace;
use deno_core::anyhow::Context;
use deno_core::error::AnyError;
use deno_core::parking_lot::Mutex;
use deno_core::parking_lot::MutexGuard;
use deno_lockfile::WorkspaceMemberConfig;
use deno_package_json::PackageJsonDepValue;
use deno_semver::jsr::JsrDepPackageReq;
use ext_node::PackageJson;

use crate::cache;
use crate::util::fs::atomic_write_file_with_retries;
use crate::DenoOptionsBuilder;

use deno_lockfile::Lockfile;

#[derive(Debug)]
pub struct CliLockfileReadFromPathOptions {
  pub file_path: PathBuf,
  pub frozen: bool,
  /// Causes the lockfile to only be read from, but not written to.
  pub skip_write: bool,
}

#[derive(Debug)]
pub struct CliLockfile {
  lockfile: Mutex<Lockfile>,
  pub filename: PathBuf,
  frozen: bool,
  skip_write: bool,
}

pub struct Guard<'a, T> {
  guard: MutexGuard<'a, T>,
}

impl<'a, T> std::ops::Deref for Guard<'a, T> {
  type Target = T;

  fn deref(&self) -> &Self::Target {
    &self.guard
  }
}

impl<'a, T> std::ops::DerefMut for Guard<'a, T> {
  fn deref_mut(&mut self) -> &mut Self::Target {
    &mut self.guard
  }
}

impl CliLockfile {
  /// Get the inner deno_lockfile::Lockfile.
  pub fn lock(&self) -> Guard<'_, Lockfile> {
    Guard {
      guard: self.lockfile.lock(),
    }
  }

  pub fn set_workspace_config(
    &self,
    options: deno_lockfile::SetWorkspaceConfigOptions,
  ) {
    self.lockfile.lock().set_workspace_config(options);
  }

  pub fn overwrite(&self) -> bool {
    self.lockfile.lock().overwrite
  }

  pub fn write_if_changed(&self) -> Result<(), AnyError> {
    if self.skip_write {
      return Ok(());
    }

    self.error_if_changed()?;
    let mut lockfile = self.lockfile.lock();
    let Some(bytes) = lockfile.resolve_write_bytes() else {
      return Ok(()); // nothing to do
    };
    // do an atomic write to reduce the chance of multiple deno
    // processes corrupting the file
    atomic_write_file_with_retries(
      &lockfile.filename,
      bytes,
      cache::CACHE_PERM,
    )
    .context("Failed writing lockfile.")?;
    lockfile.has_content_changed = false;
    Ok(())
  }

  pub fn discover(
    builder: &DenoOptionsBuilder,
    workspace: &Workspace,
  ) -> Result<Option<CliLockfile>, AnyError> {
    fn pkg_json_deps(
      maybe_pkg_json: Option<&PackageJson>,
    ) -> HashSet<JsrDepPackageReq> {
      let Some(pkg_json) = maybe_pkg_json else {
        return Default::default();
      };
      let deps = pkg_json.resolve_local_package_json_deps();

      deps
        .dependencies
        .values()
        .chain(deps.dev_dependencies.values())
        .filter_map(|dep| dep.as_ref().ok())
        .filter_map(|dep| match dep {
          PackageJsonDepValue::Req(req) => {
            Some(JsrDepPackageReq::npm(req.clone()))
          }
          PackageJsonDepValue::Workspace(_) => None,
        })
        .collect()
    }

    fn deno_json_deps(
      maybe_deno_json: Option<&ConfigFile>,
    ) -> HashSet<JsrDepPackageReq> {
      maybe_deno_json
        .map(crate::args::deno_json::deno_json_deps)
        .unwrap_or_default()
    }

    if builder.no_lock.unwrap_or_default() {
      return Ok(None);
    }

    let file_path = match builder.lock.clone() {
      Some(ref lock) => PathBuf::from(lock),
      None => match workspace.resolve_lockfile_path()? {
        Some(path) => path,
        None => return Ok(None),
      },
    };

    let root_folder = workspace.root_folder_configs();
    // CLI flag takes precedence over the config
    let frozen = builder.frozen_lockfile.unwrap_or_else(|| {
      root_folder
        .deno_json
        .as_ref()
        .and_then(|c| c.to_lock_config().ok().flatten().map(|c| c.frozen()))
        .unwrap_or(false)
    });

    let lockfile = Self::read_from_path(CliLockfileReadFromPathOptions {
      file_path,
      frozen,
      skip_write: builder.lockfile_skip_write(),
    })?;

    // initialize the lockfile with the workspace's configuration
    let root_url = workspace.root_dir();
    let config = deno_lockfile::WorkspaceConfig {
      root: WorkspaceMemberConfig {
        package_json_deps: pkg_json_deps(root_folder.pkg_json.as_deref()),
        dependencies: deno_json_deps(root_folder.deno_json.as_deref()),
      },
      members: workspace
        .config_folders()
        .iter()
        .filter(|(folder_url, _)| *folder_url != root_url)
        .filter_map(|(folder_url, folder)| {
          Some((
            {
              // should never be None here, but just ignore members that
              // do fail for this
              let mut relative_path = root_url.make_relative(folder_url)?;
              if relative_path.ends_with('/') {
                // make it slightly cleaner by removing the trailing slash
                relative_path.pop();
              }
              relative_path
            },
            {
              let config = WorkspaceMemberConfig {
                package_json_deps: pkg_json_deps(folder.pkg_json.as_deref()),
                dependencies: deno_json_deps(folder.deno_json.as_deref()),
              };
              if config.package_json_deps.is_empty()
                && config.dependencies.is_empty()
              {
                // exclude empty workspace members
                return None;
              }
              config
            },
          ))
        })
        .collect(),
    };
    lockfile.set_workspace_config(deno_lockfile::SetWorkspaceConfigOptions {
      no_npm: builder.no_npm.unwrap_or_default(),
      no_config: builder
        .config
        .clone()
        .unwrap_or(crate::ConfigMode::Disabled)
        == crate::ConfigMode::Disabled,
      config,
    });

    Ok(Some(lockfile))
  }

  pub fn read_from_path(
    opts: CliLockfileReadFromPathOptions,
  ) -> Result<CliLockfile, AnyError> {
    let lockfile = match std::fs::read_to_string(&opts.file_path) {
      Ok(text) => {
        let text = downgrade_lockfile_v5_to_v4_if_needed(text);
        Lockfile::new(deno_lockfile::NewLockfileOptions {
          file_path: opts.file_path,
          content: &text,
          overwrite: false,
        })?
      }
      Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
        Lockfile::new_empty(opts.file_path, false)
      }
      Err(err) => {
        return Err(err).with_context(|| {
          format!("Failed reading lockfile '{}'", opts.file_path.display())
        });
      }
    };
    Ok(CliLockfile {
      filename: lockfile.filename.clone(),
      lockfile: Mutex::new(lockfile),
      frozen: opts.frozen,
      skip_write: opts.skip_write,
    })
  }

  pub fn error_if_changed(&self) -> Result<(), AnyError> {
    if !self.frozen {
      return Ok(());
    }
    let lockfile = self.lockfile.lock();
    if lockfile.has_content_changed {
      let contents =
        std::fs::read_to_string(&lockfile.filename).unwrap_or_default();
      let new_contents = lockfile.as_json_string();
      let diff = crate::util::diff::diff(&contents, &new_contents);
      // has an extra newline at the end
      let diff = diff.trim_end();
      Err(deno_core::anyhow::anyhow!(
        "The lockfile is out of date. Run `deno install --frozen=false`, or rerun with `--frozen=false` to update it.\nchanges:\n{diff}"
      ))
    } else {
      Ok(())
    }
  }
}

fn downgrade_lockfile_v5_to_v4_if_needed(text: String) -> String {
  let Ok(mut json) =
    serde_json::from_str::<serde_json::Map<String, serde_json::Value>>(&text)
  else {
    return text;
  };
  if json.get("version").and_then(|v| v.as_str()) != Some("5") {
    return text;
  }

  json.insert(
    "version".to_string(),
    serde_json::Value::String("4".to_string()),
  );

  if let Some(serde_json::Value::Object(npm)) = json.get_mut("npm") {
    for pkg in npm.values_mut() {
      let serde_json::Value::Object(pkg_obj) = pkg else {
        continue;
      };
      let mut all_deps: Vec<serde_json::Value> = Vec::new();
      if let Some(serde_json::Value::Array(deps)) =
        pkg_obj.remove("dependencies")
      {
        all_deps.extend(deps);
      }
      if let Some(serde_json::Value::Array(opt_deps)) =
        pkg_obj.remove("optionalDependencies")
      {
        all_deps.extend(opt_deps);
      }
      pkg_obj.remove("optionalPeers");
      pkg_obj.remove("os");
      pkg_obj.remove("cpu");
      pkg_obj.remove("tarball");
      pkg_obj.remove("deprecated");
      pkg_obj.remove("scripts");
      pkg_obj.remove("bin");
      if !all_deps.is_empty() {
        pkg_obj.insert(
          "dependencies".to_string(),
          serde_json::Value::Array(all_deps),
        );
      }
    }
  }

  serde_json::to_string_pretty(&json).unwrap_or(text)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_v4_passthrough() {
    let v4 = r#"{
  "version": "4",
  "npm": {
    "hono@4.12.7": {
      "integrity": "sha512-abc",
      "dependencies": []
    }
  }
}"#
      .to_string();
    let result = downgrade_lockfile_v5_to_v4_if_needed(v4.clone());
    assert_eq!(result, v4);
  }

  #[test]
  fn test_v5_basic_downgrade() {
    let v5 = r#"{
  "version": "5",
  "npm": {
    "hono@4.12.7": {
      "integrity": "sha512-abc"
    }
  }
}"#
      .to_string();
    let result = downgrade_lockfile_v5_to_v4_if_needed(v5);
    let json: serde_json::Value = serde_json::from_str(&result).unwrap();
    assert_eq!(json["version"], "4");
  }

  // Mirrors real esbuild v5 lockfile structure with os/cpu/optionalDependencies/scripts/bin
  #[test]
  fn test_v5_esbuild_like_downgrade() {
    let v5 = r#"{
  "version": "5",
  "specifiers": {
    "npm:esbuild@0.25": "0.25.12"
  },
  "npm": {
    "@esbuild/linux-arm64@0.25.12": {
      "integrity": "sha512-arm64",
      "os": ["linux"],
      "cpu": ["arm64"]
    },
    "@esbuild/darwin-arm64@0.25.12": {
      "integrity": "sha512-darwin",
      "os": ["darwin"],
      "cpu": ["arm64"]
    },
    "esbuild@0.25.12": {
      "integrity": "sha512-esbuild",
      "optionalDependencies": [
        "@esbuild/linux-arm64",
        "@esbuild/darwin-arm64"
      ],
      "scripts": true,
      "bin": true
    }
  }
}"#
      .to_string();

    let result = downgrade_lockfile_v5_to_v4_if_needed(v5);
    let json: serde_json::Value = serde_json::from_str(&result).unwrap();

    assert_eq!(json["version"], "4");

    // optionalDependencies should be merged into dependencies
    let esbuild_deps = &json["npm"]["esbuild@0.25.12"]["dependencies"];
    assert!(esbuild_deps.is_array());
    let deps: Vec<&str> = esbuild_deps
      .as_array()
      .unwrap()
      .iter()
      .map(|v| v.as_str().unwrap())
      .collect();
    assert!(deps.contains(&"@esbuild/linux-arm64"));
    assert!(deps.contains(&"@esbuild/darwin-arm64"));

    // v5-only fields should be removed
    assert!(json["npm"]["esbuild@0.25.12"]["scripts"].is_null());
    assert!(json["npm"]["esbuild@0.25.12"]["bin"].is_null());
    assert!(json["npm"]["esbuild@0.25.12"]["optionalDependencies"].is_null());
    assert!(json["npm"]["@esbuild/linux-arm64@0.25.12"]["os"].is_null());
    assert!(json["npm"]["@esbuild/linux-arm64@0.25.12"]["cpu"].is_null());
  }

  // Both dependencies and optionalDependencies should be merged into a single array
  #[test]
  fn test_v5_merge_deps_and_optional_deps() {
    let v5 = r#"{
  "version": "5",
  "npm": {
    "pkg@1.0.0": {
      "integrity": "sha512-xyz",
      "dependencies": ["dep-a"],
      "optionalDependencies": ["opt-b", "opt-c"]
    }
  }
}"#
      .to_string();

    let result = downgrade_lockfile_v5_to_v4_if_needed(v5);
    let json: serde_json::Value = serde_json::from_str(&result).unwrap();

    let deps: Vec<&str> = json["npm"]["pkg@1.0.0"]["dependencies"]
      .as_array()
      .unwrap()
      .iter()
      .map(|v| v.as_str().unwrap())
      .collect();
    assert_eq!(deps, vec!["dep-a", "opt-b", "opt-c"]);
  }

  // Packages with no deps should not have a dependencies field at all
  #[test]
  fn test_v5_no_deps_field_when_empty() {
    let v5 = r#"{
  "version": "5",
  "npm": {
    "pkg@1.0.0": {
      "integrity": "sha512-xyz",
      "bin": true
    }
  }
}"#
      .to_string();

    let result = downgrade_lockfile_v5_to_v4_if_needed(v5);
    let json: serde_json::Value = serde_json::from_str(&result).unwrap();

    assert!(json["npm"]["pkg@1.0.0"]["dependencies"].is_null());
    assert!(json["npm"]["pkg@1.0.0"]["bin"].is_null());
  }
}
