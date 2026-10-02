use std::borrow::Cow;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;

use anyhow::bail;
use anyhow::Context;
use deno_ast::SourceMapOption;
use deno_config::deno_json::ConfigFile;
use deno_config::workspace::FolderConfigs;
use deno_config::workspace::Workspace;
use deno_core::error::AnyError;
use deno_core::serde_json;
use deno_npm::npm_rc::NpmRc;
use deno_npm::npm_rc::ResolvedNpmRc;
use deno_npm_cache::NpmCacheSetting;
use once_cell::sync::Lazy;
use reqwest::Url;
use thiserror::Error;

use crate::cache;
use crate::cache::DenoDirProvider;
use crate::util::fs::canonicalize_path_maybe_not_exists;
use crate::DenoOptionsBuilder;

mod deno_json;
mod flags;
mod lockfile;
mod package_json;

pub use deno_config::deno_json::TsConfig;
pub use deno_config::deno_json::TsConfigType;
pub use deno_json::check_warn_tsconfig;
pub use flags::TypeCheckMode;
pub use lockfile::CliLockfile;
pub use lockfile::CliLockfileReadFromPathOptions;
pub use package_json::NpmInstallDepsProvider;
pub use package_json::PackageJsonDepValueParseWithLocationError;

pub fn npm_registry_url() -> &'static Url {
  static NPM_REGISTRY_DEFAULT_URL: Lazy<Url> = Lazy::new(|| {
    let env_var_name = "NPM_CONFIG_REGISTRY";
    if let Ok(registry_url) = std::env::var(env_var_name) {
      // ensure there is a trailing slash for the directory
      let registry_url = format!("{}/", registry_url.trim_end_matches('/'));
      match Url::parse(&registry_url) {
        Ok(url) => {
          return url;
        }
        Err(err) => {
          log::debug!(
            "Invalid {} environment variable: {:#}",
            env_var_name,
            err,
          );
        }
      }
    }

    Url::parse("https://registry.npmjs.org").unwrap()
  });

  &NPM_REGISTRY_DEFAULT_URL
}

pub static DENO_DISABLE_PEDANTIC_NODE_WARNINGS: Lazy<bool> = Lazy::new(|| {
  std::env::var("DENO_DISABLE_PEDANTIC_NODE_WARNINGS")
    .ok()
    .is_some()
});

pub fn jsr_url() -> &'static Url {
  static JSR_URL: Lazy<Url> = Lazy::new(|| {
    let env_var_name = "JSR_URL";
    if let Ok(registry_url) = std::env::var(env_var_name) {
      // ensure there is a trailing slash for the directory
      let registry_url = format!("{}/", registry_url.trim_end_matches('/'));
      match Url::parse(&registry_url) {
        Ok(url) => {
          return url;
        }
        Err(err) => {
          log::debug!(
            "Invalid {} environment variable: {:#}",
            env_var_name,
            err,
          );
        }
      }
    }

    Url::parse("https://jsr.io/").unwrap()
  });

  &JSR_URL
}

/// Indicates how cached source files should be handled.
#[derive(Debug, Clone, Eq, PartialEq)]
pub enum CacheSetting {
  /// Only the cached files should be used.  Any files not in the cache will
  /// error.  This is the equivalent of `--cached-only` in the CLI.
  Only,
  /// No cached source files should be used, and all files should be reloaded.
  /// This is the equivalent of `--reload` in the CLI.
  ReloadAll,
  /// Only some cached resources should be used.  This is the equivalent of
  /// `--reload=https://deno.land/std` or
  /// `--reload=https://deno.land/std,https://deno.land/x/example`.
  ReloadSome(Vec<String>),
  /// The usability of a cached value is determined by analyzing the cached
  /// headers and other metadata associated with a cached response, reloading
  /// any cached "non-fresh" cached responses.
  RespectHeaders,
  /// The cached source files should be used for local modules.  This is the
  /// default behavior of the CLI.
  Use,
}

impl CacheSetting {
  pub fn as_npm_cache_setting(&self) -> NpmCacheSetting {
    match self {
      CacheSetting::Only => NpmCacheSetting::Only,
      CacheSetting::ReloadAll => NpmCacheSetting::ReloadAll,
      CacheSetting::ReloadSome(values) => {
        if values.iter().any(|v| v == "npm:") {
          NpmCacheSetting::ReloadAll
        } else {
          NpmCacheSetting::ReloadSome {
            npm_package_names: values
              .iter()
              .filter_map(|v| v.strip_prefix("npm:"))
              .map(|n| n.to_string())
              .collect(),
          }
        }
      }
      CacheSetting::RespectHeaders => unreachable!(), // not supported
      CacheSetting::Use => NpmCacheSetting::Use,
    }
  }
}

pub fn config_to_deno_graph_workspace_member(
  config: &ConfigFile,
) -> Result<deno_graph::WorkspaceMember, AnyError> {
  let name = match &config.json.name {
    Some(name) => name.clone(),
    None => bail!("Missing 'name' field in config file."),
  };
  let version = match &config.json.version {
    Some(name) => Some(deno_semver::Version::parse_standard(name)?),
    None => None,
  };
  Ok(deno_graph::WorkspaceMember {
    base: config.specifier.join("./").unwrap(),
    name,
    version,
    exports: config.to_exports_config()?.into_map(),
  })
}

#[derive(Debug, Clone, Copy)]
pub enum NpmCachingStrategy {
  Eager,
  Lazy,
  Manual,
}

pub fn discover_npmrc_from_workspace(
  workspace: &Workspace,
) -> Result<(Arc<ResolvedNpmRc>, Option<PathBuf>), AnyError> {
  let root_folder = workspace.root_folder_configs();
  discover_npmrc(
    root_folder.pkg_json.as_ref().map(|p| p.path.clone()),
    root_folder.deno_json.as_ref().and_then(|cf| {
      if cf.specifier.scheme() == "file" {
        Some(cf.specifier.to_file_path().unwrap())
      } else {
        None
      }
    }),
  )
}

/// Discover `.npmrc` file - currently we only support it next to `package.json`
/// or next to `deno.json`.
///
/// In the future we will need to support it in user directory or global directory
/// as per https://docs.npmjs.com/cli/v10/configuring-npm/npmrc#files.
fn discover_npmrc(
  maybe_package_json_path: Option<PathBuf>,
  maybe_deno_json_path: Option<PathBuf>,
) -> Result<(Arc<ResolvedNpmRc>, Option<PathBuf>), AnyError> {
  const NPMRC_NAME: &str = ".npmrc";

  fn get_env_var(var_name: &str) -> Option<String> {
    std::env::var(var_name).ok()
  }

  #[derive(Debug, Error)]
  #[error("Error loading .npmrc at {}.", path.display())]
  struct NpmRcLoadError {
    path: PathBuf,
    #[source]
    source: std::io::Error,
  }

  fn try_to_read_npmrc(
    dir: &Path,
  ) -> Result<Option<(String, PathBuf)>, NpmRcLoadError> {
    let path = dir.join(NPMRC_NAME);
    let maybe_source = match std::fs::read_to_string(&path) {
      Ok(source) => Some(source),
      Err(err) if err.kind() == std::io::ErrorKind::NotFound => None,
      Err(err) => return Err(NpmRcLoadError { path, source: err }),
    };

    Ok(maybe_source.map(|source| (source, path)))
  }

  fn try_to_parse_npmrc(
    source: String,
    path: &Path,
  ) -> Result<Arc<ResolvedNpmRc>, AnyError> {
    let npmrc = NpmRc::parse(&source, &get_env_var).with_context(|| {
      format!("Failed to parse .npmrc at {}", path.display())
    })?;
    let resolved = npmrc
      .as_resolved(npm_registry_url())
      .context("Failed to resolve .npmrc options")?;
    log::debug!(".npmrc found at: '{}'", path.display());
    Ok(Arc::new(resolved))
  }

  // 1. Try `.npmrc` next to `package.json`
  if let Some(package_json_path) = maybe_package_json_path {
    if let Some(package_json_dir) = package_json_path.parent() {
      if let Some((source, path)) = try_to_read_npmrc(package_json_dir)? {
        return try_to_parse_npmrc(source, &path).map(|r| (r, Some(path)));
      }
    }
  }

  // 2. Try `.npmrc` next to `deno.json(c)`
  if let Some(deno_json_path) = maybe_deno_json_path {
    if let Some(deno_json_dir) = deno_json_path.parent() {
      if let Some((source, path)) = try_to_read_npmrc(deno_json_dir)? {
        return try_to_parse_npmrc(source, &path).map(|r| (r, Some(path)));
      }
    }
  }

  // TODO(bartlomieju): update to read both files - one in the project root and one and
  // home dir and then merge them.
  // 3. Try `.npmrc` in the user's home directory
  if let Some(home_dir) = cache::home_dir() {
    match try_to_read_npmrc(&home_dir) {
      Ok(Some((source, path))) => {
        return try_to_parse_npmrc(source, &path).map(|r| (r, Some(path)));
      }
      Ok(None) => {}
      Err(err) if err.source.kind() == std::io::ErrorKind::PermissionDenied => {
        log::debug!(
          "Skipping .npmrc in home directory due to permission denied error. {:#}",
          err
        );
      }
      Err(err) => {
        return Err(err.into());
      }
    }
  }

  log::debug!("No .npmrc file found");
  Ok((create_default_npmrc(), None))
}

pub fn create_default_npmrc() -> Arc<ResolvedNpmRc> {
  Arc::new(ResolvedNpmRc {
    default_config: deno_npm::npm_rc::RegistryConfigWithUrl {
      registry_url: npm_registry_url().clone(),
      config: Default::default(),
    },
    scopes: Default::default(),
    registry_configs: Default::default(),
  })
}

/// Resolves the path to use for a local node_modules folder.
pub fn resolve_node_modules_folder(
  cwd: &Path,
  builder: &DenoOptionsBuilder,
  workspace: &Workspace,
  deno_dir_provider: &Arc<DenoDirProvider>,
) -> Result<Option<PathBuf>, AnyError> {
  fn resolve_from_root(root_folder: &FolderConfigs, cwd: &Path) -> PathBuf {
    root_folder
      .deno_json
      .as_ref()
      .map(|c| Cow::Owned(c.dir_path()))
      .or_else(|| {
        root_folder
          .pkg_json
          .as_ref()
          .map(|c| Cow::Borrowed(c.dir_path()))
      })
      .unwrap_or(Cow::Borrowed(cwd))
      .join("node_modules")
  }

  let root_folder = workspace.root_folder_configs();
  let use_node_modules_dir = if let Some(mode) = builder.node_modules_dir {
    Some(mode.uses_node_modules_dir())
  } else {
    workspace
      .node_modules_dir()?
      .map(|m| m.uses_node_modules_dir())
      .or(builder.vendor)
      .or_else(|| root_folder.deno_json.as_ref().and_then(|c| c.json.vendor))
  };
  let path = if use_node_modules_dir == Some(false) {
    return Ok(None);
  } else if root_folder.pkg_json.is_some() {
    let node_modules_dir = resolve_from_root(root_folder, cwd);
    if let Ok(deno_dir) = deno_dir_provider.get_or_create() {
      // `deno_dir.root` can be symlink in macOS
      if let Ok(root) = canonicalize_path_maybe_not_exists(&deno_dir.root) {
        if node_modules_dir.starts_with(root) {
          // if the package.json is in deno_dir, then do not use node_modules
          // next to it as local node_modules dir
          return Ok(None);
        }
      }
    }
    node_modules_dir
  } else if use_node_modules_dir.is_none() {
    return Ok(None);
  } else {
    resolve_from_root(root_folder, cwd)
  };
  Ok(Some(canonicalize_path_maybe_not_exists(&path)?))
}

pub fn ts_config_to_transpile_and_emit_options(
  config: deno_config::deno_json::TsConfig,
) -> Result<(deno_ast::TranspileOptions, deno_ast::EmitOptions), AnyError> {
  let options: deno_config::deno_json::EmitConfigOptions =
    serde_json::from_value(config.0)
      .context("Failed to parse compilerOptions")?;
  let imports_not_used_as_values =
    match options.imports_not_used_as_values.as_str() {
      "preserve" => deno_ast::ImportsNotUsedAsValues::Preserve,
      "error" => deno_ast::ImportsNotUsedAsValues::Error,
      _ => deno_ast::ImportsNotUsedAsValues::Remove,
    };
  let (transform_jsx, jsx_automatic, jsx_development, precompile_jsx) =
    match options.jsx.as_str() {
      "react" => (true, false, false, false),
      "react-jsx" => (true, true, false, false),
      "react-jsxdev" => (true, true, true, false),
      "precompile" => (false, false, false, true),
      _ => (false, false, false, false),
    };
  let source_map = if options.inline_source_map {
    SourceMapOption::Inline
  } else if options.source_map {
    SourceMapOption::Separate
  } else {
    SourceMapOption::None
  };
  Ok((
    deno_ast::TranspileOptions {
      use_ts_decorators: options.experimental_decorators,
      use_decorators_proposal: !options.experimental_decorators,
      emit_metadata: options.emit_decorator_metadata,
      imports_not_used_as_values,
      jsx_automatic,
      jsx_development,
      jsx_factory: options.jsx_factory,
      jsx_fragment_factory: options.jsx_fragment_factory,
      jsx_import_source: options.jsx_import_source,
      precompile_jsx,
      precompile_jsx_skip_elements: options.jsx_precompile_skip_elements,
      precompile_jsx_dynamic_props: None,
      transform_jsx,
      var_decl_imports: false,
      // todo(dsherret): support verbatim_module_syntax here properly
      verbatim_module_syntax: false,
    },
    deno_ast::EmitOptions {
      inline_sources: options.inline_sources,
      remove_comments: false,
      source_map,
      source_map_base: None,
      source_map_file: None,
    },
  ))
}
