#![allow(clippy::result_large_err)] // Public errors are defined by the pinned Deno crates.

use std::collections::HashMap;
use std::env;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;

use anyhow::Context;
use args::discover_npmrc_from_workspace;
use args::resolve_node_modules_folder;
use args::CliLockfile;
use args::NpmCachingStrategy;
use args::TypeCheckMode;
use cache::DenoDirProvider;
use deno_config::deno_json::NodeModulesDirMode;
use deno_config::deno_json::TsConfigForEmit;
use deno_config::deno_json::TsConfigType;
use deno_config::workspace::CreateResolverOptions;
use deno_config::workspace::PackageJsonDepResolution;
use deno_config::workspace::VendorEnablement;
use deno_config::workspace::WorkspaceDirectory;
use deno_config::workspace::WorkspaceDirectoryEmptyOptions;
use deno_config::workspace::WorkspaceDiscoverOptions;
use deno_config::workspace::WorkspaceDiscoverStart;
use deno_config::workspace::WorkspaceResolver;
use deno_core::error::AnyError;
use deno_core::ModuleSpecifier;
use deno_npm::npm_rc::ResolvedNpmRc;
use deno_path_util::normalize_path;
use dotenvy::from_filename;
use file_fetcher::FileFetcher;
use import_map::load_import_map;

pub mod args;
pub mod auth_tokens;
pub mod cache;
pub mod emit;
pub mod errors;
pub mod file_fetcher;
pub mod graph_util;
pub mod http_util;
pub mod import_map;
pub mod node;
pub mod npm;
pub mod npmrc;
pub mod resolver;
pub mod runtime;
pub mod standalone;
pub mod tools;
pub mod util;
pub mod versions;

pub use deno_ast;
pub use deno_cache_dir;
pub use deno_config;

pub use deno_crypto;
pub use deno_fetch;
pub use deno_fs;
pub use deno_graph;
pub use deno_http;
pub use deno_io;
pub use deno_lockfile;
pub use deno_net;
pub use deno_npm;
pub use deno_package_json;
pub use deno_path_util;
pub use deno_permissions;
pub use deno_semver;
pub use deno_telemetry;
pub use deno_tls;
pub use deno_url;
pub use deno_web;
pub use deno_webidl;
pub use deno_websocket;
pub use deno_webstorage;

pub use deno_resolver;
pub use node_resolver;

pub use deno_permissions::PermissionsContainer;
pub use versions::edge_runtime_version;

pub fn version() -> &'static str {
  env!("CARGO_PKG_VERSION")
}

pub struct DenoOptions {
  initial_cwd: PathBuf,
  maybe_node_modules_folder: Option<PathBuf>,
  npmrc: Arc<ResolvedNpmRc>,
  maybe_lockfile: Option<Arc<CliLockfile>>,
  pub start_dir: Arc<WorkspaceDirectory>,
  pub deno_dir_provider: Arc<DenoDirProvider>,
  builder: DenoOptionsBuilder,
}

impl DenoOptions {
  pub fn initial_cwd(&self) -> &Path {
    &self.initial_cwd
  }

  pub fn npmrc(&self) -> &Arc<ResolvedNpmRc> {
    &self.npmrc
  }

  pub fn workspace(&self) -> &Arc<deno_config::workspace::Workspace> {
    &self.start_dir.workspace
  }

  pub fn node_modules_dir_path(&self) -> Option<&PathBuf> {
    self.maybe_node_modules_folder.as_ref()
  }

  pub fn entrypoint(&self) -> Option<&PathBuf> {
    self.builder.entrypoint.as_ref()
  }

  pub fn unstable_detect_cjs(&self) -> bool {
    self.builder.unstable_detect_cjs.unwrap_or_default()
  }

  pub fn unstable_sloppy_imports(&self) -> bool {
    self.workspace().has_unstable("sloppy-imports")
  }

  fn byonm_enabled(&self) -> bool {
    self.node_modules_dir().ok().flatten() == Some(NodeModulesDirMode::Manual)
  }

  pub fn use_byonm(&self) -> bool {
    if self.node_modules_dir().ok().flatten().is_none()
      && self.maybe_node_modules_folder.is_some()
      && self
        .workspace()
        .config_folders()
        .values()
        .any(|it| it.pkg_json.is_some())
    {
      return true;
    }

    self.byonm_enabled()
  }

  pub fn is_node_main(&self) -> bool {
    false
  }

  pub fn type_check_mode(&self) -> TypeCheckMode {
    self.builder.type_check_mode.unwrap_or(TypeCheckMode::None)
  }

  pub fn check_js(&self) -> bool {
    self.workspace().check_js()
  }

  pub fn default_npm_caching_strategy(&self) -> NpmCachingStrategy {
    NpmCachingStrategy::Eager
  }

  pub fn resolve_file_header_overrides(
    &self,
  ) -> HashMap<ModuleSpecifier, HashMap<String, String>> {
    HashMap::new()
  }

  pub fn maybe_lockfile(&self) -> Option<&Arc<CliLockfile>> {
    self.maybe_lockfile.as_ref()
  }

  pub fn to_compiler_option_types(
    &self,
  ) -> Result<Vec<deno_graph::ReferrerImports>, AnyError> {
    self
      .workspace()
      .to_compiler_option_types()
      .map(|maybe_imports| {
        maybe_imports
          .into_iter()
          .map(|(referrer, imports)| deno_graph::ReferrerImports {
            referrer,
            imports,
          })
          .collect()
      })
  }

  pub fn node_modules_dir(
    &self,
  ) -> Result<Option<NodeModulesDirMode>, AnyError> {
    self.workspace().node_modules_dir().map_err(Into::into)
  }

  pub fn vendor_dir_path(&self) -> Option<&PathBuf> {
    self.workspace().vendor_dir_path()
  }

  pub fn detect_cjs(&self) -> bool {
    self.workspace().package_jsons().next().is_some() || self.is_node_main()
  }

  pub fn create_workspace_resolver(
    &self,
    _file_fetcher: &FileFetcher,
    pkg_json_dep_resolution: PackageJsonDepResolution,
  ) -> Result<WorkspaceResolver, AnyError> {
    Ok(self.workspace().create_resolver(
      CreateResolverOptions {
        pkg_json_dep_resolution,
        specified_import_map: load_import_map(
          self.builder.import_map_path.as_deref(),
        )?,
      },
      |path| Ok(std::fs::read_to_string(path)?),
    )?)
  }

  pub fn resolve_ts_config_for_emit(
    &self,
    config_type: TsConfigType,
  ) -> Result<TsConfigForEmit, AnyError> {
    self.workspace().resolve_ts_config_for_emit(config_type)
  }
}

impl DenoOptions {
  fn from_builder(builder: DenoOptionsBuilder) -> Result<Self, AnyError> {
    let config = builder.config.clone().unwrap_or(ConfigMode::Discover);
    let no_npm = builder.no_npm.unwrap_or_default();
    let initial_cwd =
      std::env::current_dir().with_context(|| "failed getting cwd")?;
    let entrypoint = builder
      .entrypoint
      .clone()
      .map(|it| {
        if it.is_dir() {
          Ok(it)
        } else {
          it.parent()
            .with_context(|| "failed getting parent directory of entrypoint")
            .map(Path::to_path_buf)
        }
      })
      .transpose()?;

    let maybe_vendor_override = builder.vendor.map(|it| match it {
      true => VendorEnablement::Enable { cwd: &initial_cwd },
      false => VendorEnablement::Disable,
    });
    let config_parse_options =
      deno_config::deno_json::ConfigParseOptions::default();
    let discover_pkg_json = config != ConfigMode::Disabled
      && !no_npm
      && !has_flag_env_var("DENO_NO_PACKAGE_JSON");
    if !discover_pkg_json {
      log::debug!("package.json auto-discovery is disabled");
    }
    let workspace_discover_options = WorkspaceDiscoverOptions {
      fs: Default::default(),
      deno_json_cache: None,
      pkg_json_cache: Some(&node_resolver::PackageJsonThreadLocalCache),
      workspace_cache: None,
      config_parse_options,
      additional_config_file_names: &[],
      discover_pkg_json,
      maybe_vendor_override,
    };
    let resolve_empty_options = || WorkspaceDirectoryEmptyOptions {
      root_dir: Arc::new(
        ModuleSpecifier::from_directory_path(&initial_cwd).unwrap(),
      ),
      use_vendor_dir: maybe_vendor_override
        .unwrap_or(VendorEnablement::Disable),
    };

    let has_entrypoint = entrypoint.is_some();
    let start_dir = if let Some(entrypoint) = entrypoint {
      match &config {
        ConfigMode::Discover => {
          let config_path = normalize_path(initial_cwd.join(&entrypoint));
          WorkspaceDirectory::discover(
            WorkspaceDiscoverStart::Paths(&[config_path]),
            &workspace_discover_options,
          )?
        }
        ConfigMode::Path(path) => {
          let config_path = normalize_path(initial_cwd.join(path));
          WorkspaceDirectory::discover(
            WorkspaceDiscoverStart::ConfigFile(&config_path),
            &workspace_discover_options,
          )?
        }
        ConfigMode::Disabled => {
          WorkspaceDirectory::empty(resolve_empty_options())
        }
      }
    } else {
      WorkspaceDirectory::empty(resolve_empty_options())
    };

    for dignostic in start_dir.workspace.diagnostics() {
      log::warn!("{} {}", "Warning", dignostic);
    }

    let (npmrc, _) = discover_npmrc_from_workspace(&start_dir.workspace)?;

    let maybe_lockfile = has_entrypoint
      .then(|| CliLockfile::discover(&builder, &start_dir.workspace))
      .transpose()?
      .flatten();

    log::debug!("Finished config loading.");

    let maybe_lockfile = maybe_lockfile
      .filter(|_| !builder.force_global_cache.unwrap_or_default());
    let deno_dir_provider = Arc::new(DenoDirProvider::new(None));
    let maybe_node_modules_folder = resolve_node_modules_folder(
      &initial_cwd,
      &builder,
      &start_dir.workspace,
      &deno_dir_provider,
    )
    .with_context(|| "resolving node_modules folder")?;

    load_env_variables_from_env_file(builder.env_file.as_ref());

    Ok(Self {
      initial_cwd,
      maybe_node_modules_folder,
      npmrc,
      maybe_lockfile: maybe_lockfile.map(Arc::new),
      start_dir: Arc::new(start_dir),
      deno_dir_provider,
      builder,
    })
  }
}

fn load_env_variables_from_env_file(filename: Option<&Vec<String>>) {
  let Some(env_file_names) = filename else {
    return;
  };

  for env_file_name in env_file_names.iter().rev() {
    match from_filename(env_file_name) {
      Ok(_) => (),
      Err(error) => {
        match error {
          dotenvy::Error::LineParse(line, index) => log::info!("{} Parsing failed within the specified environment file: {} at index: {} of the value: {}", "Warning", env_file_name, index, line),
          dotenvy::Error::Io(_) => log::info!("{} The `--env-file` flag was used, but the environment file specified '{}' was not found.", "Warning", env_file_name),
          dotenvy::Error::EnvVar(_) => log::info!("{} One or more of the environment variables isn't present or not unicode within the specified environment file: {}", "Warning",env_file_name),
          _ => log::info!("{} Unknown failure occurred with the specified environment file: {}", "Warning", env_file_name),
        }
      }
    }
  }
}

#[derive(Debug, Clone, Default, PartialEq)]
pub enum ConfigMode {
  Discover,
  Path(PathBuf),
  #[default]
  Disabled,
}

pub struct DenoOptionsBuilder {
  entrypoint: Option<PathBuf>,
  config: Option<ConfigMode>,
  type_check_mode: Option<TypeCheckMode>,
  unstable_detect_cjs: Option<bool>,
  use_byonm: Option<bool>,
  vendor: Option<bool>,
  no_npm: Option<bool>,
  no_lock: Option<bool>,
  lock: Option<PathBuf>,
  node_modules_dir: Option<NodeModulesDirMode>,
  env_file: Option<Vec<String>>,
  frozen_lockfile: Option<bool>,
  force_global_cache: Option<bool>,
  import_map_path: Option<String>,
}

impl Default for DenoOptionsBuilder {
  fn default() -> Self {
    Self::new()
  }
}

impl DenoOptionsBuilder {
  pub fn new() -> Self {
    Self {
      entrypoint: None,
      config: None,
      type_check_mode: None,
      unstable_detect_cjs: None,
      use_byonm: None,
      vendor: None,
      no_npm: None,
      no_lock: None,
      lock: None,
      node_modules_dir: None,
      env_file: None,
      frozen_lockfile: None,
      force_global_cache: None,
      import_map_path: None,
    }
  }

  pub fn entrypoint(mut self, value: PathBuf) -> Self {
    self.entrypoint = Some(value);
    self
  }

  pub fn set_entrypoint(&mut self, value: Option<PathBuf>) -> &mut Self {
    self.entrypoint = value;
    self
  }

  pub fn config(mut self, value: ConfigMode) -> Self {
    self.config = Some(value);
    self
  }

  pub fn set_config(&mut self, value: Option<ConfigMode>) -> &mut Self {
    self.config = value;
    self
  }

  pub fn type_check_mode(mut self, value: TypeCheckMode) -> Self {
    self.type_check_mode = Some(value);
    self
  }

  pub fn set_type_check_mode(
    &mut self,
    value: Option<TypeCheckMode>,
  ) -> &mut Self {
    self.type_check_mode = value;
    self
  }

  pub fn unstable_detect_cjs(mut self, value: bool) -> Self {
    self.unstable_detect_cjs = Some(value);
    self
  }

  pub fn set_unstable_detect_cjs(&mut self, value: Option<bool>) -> &mut Self {
    self.unstable_detect_cjs = value;
    self
  }

  pub fn use_byonm(mut self, value: bool) -> Self {
    self.unstable_detect_cjs = Some(value);
    self
  }

  pub fn set_use_byonm(&mut self, value: Option<bool>) -> &mut Self {
    self.use_byonm = value;
    self
  }

  pub fn vendor(mut self, value: bool) -> Self {
    self.vendor = Some(value);
    self
  }

  pub fn set_vendor(&mut self, value: Option<bool>) -> &mut Self {
    self.vendor = value;
    self
  }

  pub fn no_npm(mut self, value: bool) -> Self {
    self.no_npm = Some(value);
    self
  }

  pub fn set_no_npm(&mut self, value: Option<bool>) -> &mut Self {
    self.no_npm = value;
    self
  }

  pub fn no_lock(mut self, value: bool) -> Self {
    self.no_lock = Some(value);
    self
  }

  pub fn set_no_lock(&mut self, value: Option<bool>) -> &mut Self {
    self.no_lock = value;
    self
  }

  pub fn lock(mut self, value: PathBuf) -> Self {
    self.lock = Some(value);
    self
  }

  pub fn set_lock(&mut self, value: Option<PathBuf>) -> &mut Self {
    self.lock = value;
    self
  }

  pub fn node_modules_dir(mut self, value: NodeModulesDirMode) -> Self {
    self.node_modules_dir = Some(value);
    self
  }

  pub fn set_node_modules_dir(
    &mut self,
    value: Option<NodeModulesDirMode>,
  ) -> &mut Self {
    self.node_modules_dir = value;
    self
  }

  pub fn env_file(mut self, value: Vec<String>) -> Self {
    self.env_file = Some(value);
    self
  }

  pub fn set_env_file(&mut self, value: Option<Vec<String>>) -> &mut Self {
    self.env_file = value;
    self
  }

  pub fn frozen_lockfile(mut self, value: bool) -> Self {
    self.frozen_lockfile = Some(value);
    self
  }

  pub fn set_frozen_lockfile(&mut self, value: Option<bool>) -> &mut Self {
    self.frozen_lockfile = value;
    self
  }

  pub fn force_global_cache(mut self, value: bool) -> Self {
    self.force_global_cache = Some(value);
    self
  }

  pub fn set_force_global_cache(&mut self, value: Option<bool>) -> &mut Self {
    self.frozen_lockfile = value;
    self
  }

  pub fn import_map_path(mut self, value: String) -> Self {
    self.import_map_path = Some(value);
    self
  }

  pub fn set_import_map_path(&mut self, value: Option<String>) -> &mut Self {
    self.import_map_path = value;
    self
  }

  fn lockfile_skip_write(&self) -> bool {
    self.frozen_lockfile.is_none()
  }

  pub fn build(self) -> Result<DenoOptions, AnyError> {
    DenoOptions::from_builder(self)
  }
}

pub fn has_flag_env_var(name: &str) -> bool {
  let value = env::var(name);
  matches!(value.as_ref().map(|s| s.as_str()), Ok("1"))
}
