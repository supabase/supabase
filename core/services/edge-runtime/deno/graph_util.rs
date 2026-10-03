// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use crate::args::config_to_deno_graph_workspace_member;
use crate::args::jsr_url;
use crate::args::CliLockfile;
pub use crate::args::NpmCachingStrategy;
use crate::args::DENO_DISABLE_PEDANTIC_NODE_WARNINGS;
use crate::cache;
use crate::cache::FetchCacher;
use crate::cache::GlobalHttpCache;
use crate::cache::ModuleInfoCache;
use crate::cache::ParsedSourceCache;
use crate::errors::get_error_class_name;
use crate::file_fetcher::FileFetcher;
use crate::npm::CliNpmResolver;
use crate::resolver::CjsTracker;
use crate::resolver::CliResolver;
use crate::resolver::CliSloppyImportsResolver;
use crate::resolver::SloppyImportsCachedFs;
use crate::util::fs::canonicalize_path;
use crate::DenoOptions;

use deno_config::deno_json::JsxImportSourceConfig;
use deno_config::workspace::JsrPackageConfig;
use deno_core::anyhow::bail;
use deno_graph::source::LoaderChecksum;
use deno_graph::source::ResolutionKind;
use deno_graph::FillFromLockfileOptions;
use deno_graph::JsrLoadError;
use deno_graph::ModuleLoadError;
use deno_graph::WorkspaceFastCheckOption;

use deno_core::error::custom_error;
use deno_core::error::AnyError;
use deno_core::ModuleSpecifier;
use deno_fs::FileSystem;
use deno_graph::source::Loader;
use deno_graph::source::ResolveError;
use deno_graph::GraphKind;
use deno_graph::ModuleError;
use deno_graph::ModuleGraph;
use deno_graph::ModuleGraphError;
use deno_graph::ResolutionError;
use deno_graph::SpecifierError;
use deno_path_util::url_to_file_path;
use deno_permissions::PermissionsContainer;
use deno_resolver::sloppy_imports::SloppyImportsResolutionKind;
use deno_semver::jsr::JsrDepPackageReq;
use deno_semver::package::PackageNv;
use import_map::ImportMapError;
use node_resolver::InNpmPackageChecker;
use std::collections::HashSet;
use std::error::Error;
use std::ops::Deref;
use std::path::PathBuf;
use std::sync::Arc;

#[derive(Clone)]
pub struct GraphValidOptions {
  pub check_js: bool,
  pub kind: GraphKind,
  /// Whether to exit the process for integrity check errors such as
  /// lockfile checksum mismatches and JSR integrity failures.
  /// Otherwise, surfaces integrity errors as errors.
  pub exit_integrity_errors: bool,
}

/// Check if `roots` and their deps are available. Returns `Ok(())` if
/// so. Returns `Err(_)` if there is a known module graph or resolution
/// error statically reachable from `roots`.
///
/// It is preferable to use this over using deno_graph's API directly
/// because it will have enhanced error message information specifically
/// for the CLI.
pub fn graph_valid(
  graph: &ModuleGraph,
  fs: &Arc<dyn FileSystem>,
  roots: &[ModuleSpecifier],
  options: GraphValidOptions,
) -> Result<(), AnyError> {
  if options.exit_integrity_errors {
    graph_exit_integrity_errors(graph);
  }

  let mut errors = graph_walk_errors(
    graph,
    fs,
    roots,
    GraphWalkErrorsOptions {
      check_js: options.check_js,
      kind: options.kind,
    },
  );
  if let Some(error) = errors.next() {
    Err(error)
  } else {
    // finally surface the npm resolution result
    if let Err(err) = &graph.npm_dep_graph_result {
      return Err(custom_error(
        get_error_class_name(err),
        format_deno_graph_error(err.as_ref().deref()),
      ));
    }
    Ok(())
  }
}

pub fn fill_graph_from_lockfile(
  graph: &mut ModuleGraph,
  lockfile: &deno_lockfile::Lockfile,
) {
  graph.fill_from_lockfile(FillFromLockfileOptions {
    redirects: lockfile
      .content
      .redirects
      .iter()
      .map(|(from, to)| (from.as_str(), to.as_str())),
    package_specifiers: lockfile
      .content
      .packages
      .specifiers
      .iter()
      .map(|(dep, id)| (dep, id.as_str())),
  });
}

#[derive(Clone)]
pub struct GraphWalkErrorsOptions {
  pub check_js: bool,
  pub kind: GraphKind,
}

/// Walks the errors found in the module graph that should be surfaced to users
/// and enhances them with CLI information.
pub fn graph_walk_errors<'a>(
  graph: &'a ModuleGraph,
  fs: &'a Arc<dyn FileSystem>,
  roots: &'a [ModuleSpecifier],
  options: GraphWalkErrorsOptions,
) -> impl Iterator<Item = AnyError> + 'a {
  graph
    .walk(
      roots.iter(),
      deno_graph::WalkOptions {
        check_js: options.check_js,
        kind: options.kind,
        follow_dynamic: false,
        prefer_fast_check_graph: false,
      },
    )
    .errors()
    .flat_map(|error| {
      let is_root = match &error {
        ModuleGraphError::ResolutionError(_)
        | ModuleGraphError::TypesResolutionError(_) => false,
        ModuleGraphError::ModuleError(error) => {
          roots.contains(error.specifier())
        }
      };
      let mut message = match &error {
        ModuleGraphError::ResolutionError(resolution_error) => {
          enhanced_resolution_error_message(resolution_error)
        }
        ModuleGraphError::TypesResolutionError(resolution_error) => {
          format!(
            "Failed resolving types. {}",
            enhanced_resolution_error_message(resolution_error)
          )
        }
        ModuleGraphError::ModuleError(error) => {
          enhanced_integrity_error_message(error)
            .or_else(|| enhanced_sloppy_imports_error_message(fs, error))
            .unwrap_or_else(|| format_deno_graph_error(error))
        }
      };

      if let Some(range) = error.maybe_range() {
        if !is_root && !range.specifier.as_str().contains("/$deno$eval") {
          message.push_str("\n    at ");
          message.push_str(&format_range_with_colors(range));
        }
      }

      if graph.graph_kind() == GraphKind::TypesOnly
        && matches!(
          error,
          ModuleGraphError::ModuleError(ModuleError::UnsupportedMediaType(..))
        )
      {
        log::debug!("Ignoring: {}", message);
        return None;
      }

      Some(custom_error(get_error_class_name(&error.into()), message))
    })
}

pub fn graph_exit_integrity_errors(graph: &ModuleGraph) {
  for error in graph.module_errors() {
    exit_for_integrity_error(error);
  }
}

fn exit_for_integrity_error(err: &ModuleError) {
  if let Some(err_message) = enhanced_integrity_error_message(err) {
    log::error!("{} {}", "error:", err_message);
    crate::runtime::exit(10);
  }
}

pub struct CreateGraphOptions<'a> {
  pub graph_kind: GraphKind,
  pub roots: Vec<ModuleSpecifier>,
  pub is_dynamic: bool,
  /// Specify `None` to use the default CLI loader.
  pub loader: Option<&'a mut dyn Loader>,
  pub npm_caching: NpmCachingStrategy,
}

pub struct ModuleGraphCreator {
  options: Arc<DenoOptions>,
  npm_resolver: Arc<dyn CliNpmResolver>,
  module_graph_builder: Arc<ModuleGraphBuilder>,
  // type_checker: Arc<TypeChecker>,
}

impl ModuleGraphCreator {
  pub fn new(
    options: Arc<DenoOptions>,
    npm_resolver: Arc<dyn CliNpmResolver>,
    module_graph_builder: Arc<ModuleGraphBuilder>,
    // type_checker: Arc<TypeChecker>,
  ) -> Self {
    Self {
      options,
      npm_resolver,
      module_graph_builder,
      //   type_checker,
    }
  }

  pub async fn create_graph(
    &self,
    graph_kind: GraphKind,
    roots: Vec<ModuleSpecifier>,
    npm_caching: NpmCachingStrategy,
  ) -> Result<deno_graph::ModuleGraph, AnyError> {
    let mut cache = self.module_graph_builder.create_graph_loader();
    self
      .create_graph_with_loader(graph_kind, roots, &mut cache, npm_caching)
      .await
  }

  pub async fn create_graph_with_loader(
    &self,
    graph_kind: GraphKind,
    roots: Vec<ModuleSpecifier>,
    loader: &mut dyn Loader,
    npm_caching: NpmCachingStrategy,
  ) -> Result<ModuleGraph, AnyError> {
    self
      .create_graph_with_options(CreateGraphOptions {
        is_dynamic: false,
        graph_kind,
        roots,
        loader: Some(loader),
        npm_caching,
      })
      .await
  }

  pub async fn create_and_validate_publish_graph(
    &self,
    package_configs: &[JsrPackageConfig],
    build_fast_check_graph: bool,
  ) -> Result<ModuleGraph, AnyError> {
    struct PublishLoader(FetchCacher);
    impl Loader for PublishLoader {
      fn load(
        &self,
        specifier: &deno_ast::ModuleSpecifier,
        options: deno_graph::source::LoadOptions,
      ) -> deno_graph::source::LoadFuture {
        if specifier.scheme() == "bun" {
          return Box::pin(std::future::ready(Ok(Some(
            deno_graph::source::LoadResponse::External {
              specifier: specifier.clone(),
            },
          ))));
        }
        self.0.load(specifier, options)
      }
    }
    // fn graph_has_external_remote(graph: &ModuleGraph) -> bool {
    //   // Earlier on, we marked external non-JSR modules as external.
    //   // If the graph contains any of those, it would cause type checking
    //   // to crash, so since publishing is going to fail anyway, skip type
    //   // checking.
    //   graph.modules().any(|module| match module {
    //     deno_graph::Module::External(external_module) => {
    //       matches!(external_module.specifier.scheme(), "http" | "https")
    //     }
    //     _ => false,
    //   })
    // }

    let mut roots = Vec::new();
    for package_config in package_configs {
      roots.extend(package_config.config_file.resolve_export_value_urls()?);
    }

    let loader = self.module_graph_builder.create_graph_loader();
    let mut publish_loader = PublishLoader(loader);
    let mut graph = self
      .create_graph_with_options(CreateGraphOptions {
        is_dynamic: false,
        graph_kind: deno_graph::GraphKind::All,
        roots,
        loader: Some(&mut publish_loader),
        npm_caching: self.options.default_npm_caching_strategy(),
      })
      .await?;
    self.graph_valid(&graph)?;
    // if self.options.type_check_mode().is_true()
    //   && !graph_has_external_remote(&graph)
    // {
    //   self.type_check_graph(graph.clone()).await?;
    // }

    if build_fast_check_graph {
      let fast_check_workspace_members = package_configs
        .iter()
        .map(|p| config_to_deno_graph_workspace_member(&p.config_file))
        .collect::<Result<Vec<_>, _>>()?;
      self.module_graph_builder.build_fast_check_graph(
        &mut graph,
        BuildFastCheckGraphOptions {
          workspace_fast_check: WorkspaceFastCheckOption::Enabled(
            &fast_check_workspace_members,
          ),
        },
      )?;
    }

    Ok(graph)
  }

  pub async fn create_graph_with_options(
    &self,
    options: CreateGraphOptions<'_>,
  ) -> Result<ModuleGraph, AnyError> {
    let mut graph = ModuleGraph::new(options.graph_kind);

    self
      .module_graph_builder
      .build_graph_with_npm_resolution(&mut graph, options)
      .await?;

    if let Some(npm_resolver) = self.npm_resolver.as_managed() {
      if graph.has_node_specifier && self.options.type_check_mode().is_true() {
        npm_resolver.inject_synthetic_types_node_package().await?;
      }
    }

    Ok(graph)
  }

  pub async fn create_graph_and_maybe_check(
    &self,
    roots: Vec<ModuleSpecifier>,
  ) -> Result<Arc<deno_graph::ModuleGraph>, AnyError> {
    let graph_kind = self.options.type_check_mode().as_graph_kind();

    let graph = self
      .create_graph_with_options(CreateGraphOptions {
        is_dynamic: false,
        graph_kind,
        roots,
        loader: None,
        npm_caching: self.options.default_npm_caching_strategy(),
      })
      .await?;

    self.graph_valid(&graph)?;

    // if self.options.type_check_mode().is_true() {
    //   // provide the graph to the type checker, then get it back after it's done
    //   let graph = self.type_check_graph(graph).await?;
    //   Ok(graph)
    // } else {
    Ok(Arc::new(graph))
    // }
  }

  pub fn graph_valid(&self, graph: &ModuleGraph) -> Result<(), AnyError> {
    self.module_graph_builder.graph_valid(graph)
  }
}

pub struct BuildFastCheckGraphOptions<'a> {
  /// Whether to do fast check on workspace members. This
  /// is mostly only useful when publishing.
  pub workspace_fast_check: deno_graph::WorkspaceFastCheckOption<'a>,
}

pub struct ModuleGraphBuilder {
  caches: Arc<cache::Caches>,
  cjs_tracker: Arc<CjsTracker>,
  options: Arc<DenoOptions>,
  file_fetcher: Arc<FileFetcher>,
  fs: Arc<dyn FileSystem>,
  global_http_cache: Arc<GlobalHttpCache>,
  in_npm_pkg_checker: Arc<dyn InNpmPackageChecker>,
  lockfile: Option<Arc<CliLockfile>>,
  module_info_cache: Arc<ModuleInfoCache>,
  npm_resolver: Arc<dyn CliNpmResolver>,
  parsed_source_cache: Arc<ParsedSourceCache>,
  resolver: Arc<CliResolver>,
  root_permissions_container: PermissionsContainer,
}

impl ModuleGraphBuilder {
  #[allow(clippy::too_many_arguments)]
  pub fn new(
    caches: Arc<cache::Caches>,
    cjs_tracker: Arc<CjsTracker>,
    options: Arc<DenoOptions>,
    file_fetcher: Arc<FileFetcher>,
    fs: Arc<dyn FileSystem>,
    global_http_cache: Arc<GlobalHttpCache>,
    in_npm_pkg_checker: Arc<dyn InNpmPackageChecker>,
    lockfile: Option<Arc<CliLockfile>>,
    module_info_cache: Arc<ModuleInfoCache>,
    npm_resolver: Arc<dyn CliNpmResolver>,
    parsed_source_cache: Arc<ParsedSourceCache>,
    resolver: Arc<CliResolver>,
    root_permissions_container: PermissionsContainer,
  ) -> Self {
    Self {
      caches,
      cjs_tracker,
      options,
      file_fetcher,
      fs,
      global_http_cache,
      in_npm_pkg_checker,
      lockfile,
      module_info_cache,
      npm_resolver,
      parsed_source_cache,
      resolver,
      root_permissions_container,
    }
  }

  pub async fn build_graph_with_npm_resolution<'a>(
    &self,
    graph: &mut ModuleGraph,
    options: CreateGraphOptions<'a>,
  ) -> Result<(), AnyError> {
    enum MutLoaderRef<'a> {
      Borrowed(&'a mut dyn Loader),
      Owned(cache::FetchCacher),
    }

    impl<'a> MutLoaderRef<'a> {
      pub fn as_mut_loader(&mut self) -> &mut dyn Loader {
        match self {
          Self::Borrowed(loader) => *loader,
          Self::Owned(loader) => loader,
        }
      }
    }

    struct LockfileLocker<'a>(&'a CliLockfile);

    impl<'a> deno_graph::source::Locker for LockfileLocker<'a> {
      fn get_remote_checksum(
        &self,
        specifier: &deno_ast::ModuleSpecifier,
      ) -> Option<LoaderChecksum> {
        self
          .0
          .lock()
          .remote()
          .get(specifier.as_str())
          .map(|s| LoaderChecksum::new(s.clone()))
      }

      fn has_remote_checksum(
        &self,
        specifier: &deno_ast::ModuleSpecifier,
      ) -> bool {
        self.0.lock().remote().contains_key(specifier.as_str())
      }

      fn set_remote_checksum(
        &mut self,
        specifier: &deno_ast::ModuleSpecifier,
        checksum: LoaderChecksum,
      ) {
        self
          .0
          .lock()
          .insert_remote(specifier.to_string(), checksum.into_string())
      }

      fn get_pkg_manifest_checksum(
        &self,
        package_nv: &PackageNv,
      ) -> Option<LoaderChecksum> {
        self
          .0
          .lock()
          .content
          .packages
          .jsr
          .get(package_nv)
          .map(|s| LoaderChecksum::new(s.integrity.clone()))
      }

      fn set_pkg_manifest_checksum(
        &mut self,
        package_nv: &PackageNv,
        checksum: LoaderChecksum,
      ) {
        // a value would only exist in here if two workers raced
        // to insert the same package manifest checksum
        self
          .0
          .lock()
          .insert_package(package_nv.clone(), checksum.into_string());
      }
    }

    let maybe_imports = if options.graph_kind.include_types() {
      self.options.to_compiler_option_types()?
    } else {
      Vec::new()
    };
    let analyzer = self.module_info_cache.as_module_analyzer();
    let mut loader = match options.loader {
      Some(loader) => MutLoaderRef::Borrowed(loader),
      None => MutLoaderRef::Owned(self.create_graph_loader()),
    };
    let cli_resolver = &self.resolver;
    let graph_resolver = self.create_graph_resolver()?;
    let graph_npm_resolver =
      cli_resolver.create_graph_npm_resolver(options.npm_caching);
    // let maybe_file_watcher_reporter = self
    //   .maybe_file_watcher_reporter
    //   .as_ref()
    //   .map(|r| r.as_reporter());
    let mut locker = self
      .lockfile
      .as_ref()
      .map(|lockfile| LockfileLocker(lockfile));
    self
      .build_graph_with_npm_resolution_and_build_options(
        graph,
        options.roots,
        loader.as_mut_loader(),
        deno_graph::BuildOptions {
          imports: maybe_imports,
          is_dynamic: options.is_dynamic,
          passthrough_jsr_specifiers: false,
          executor: Default::default(),
          file_system: &DenoGraphFsAdapter(self.fs.as_ref()),
          jsr_url_provider: &CliJsrUrlProvider,
          npm_resolver: Some(&graph_npm_resolver),
          module_analyzer: &analyzer,
          reporter: None,
          resolver: Some(&graph_resolver),
          locker: locker.as_mut().map(|l| l as _),
        },
        options.npm_caching,
      )
      .await
  }

  async fn build_graph_with_npm_resolution_and_build_options<'a>(
    &self,
    graph: &mut ModuleGraph,
    roots: Vec<ModuleSpecifier>,
    loader: &'a mut dyn deno_graph::source::Loader,
    options: deno_graph::BuildOptions<'a>,
    npm_caching: NpmCachingStrategy,
  ) -> Result<(), AnyError> {
    // ensure an "npm install" is done if the user has explicitly
    // opted into using a node_modules directory
    if self
      .options
      .node_modules_dir()?
      .map(|m| m.uses_node_modules_dir())
      .unwrap_or(false)
    {
      if let Some(npm_resolver) = self.npm_resolver.as_managed() {
        let already_done =
          npm_resolver.ensure_top_level_package_json_install().await?;
        if !already_done && matches!(npm_caching, NpmCachingStrategy::Eager) {
          npm_resolver
            .cache_packages(crate::npm::PackageCaching::All)
            .await?;
        }
      }
    }

    // fill the graph with the information from the lockfile
    let is_first_execution = graph.roots.is_empty();
    if is_first_execution {
      // populate the information from the lockfile
      if let Some(lockfile) = &self.lockfile {
        let lockfile = lockfile.lock();
        fill_graph_from_lockfile(graph, &lockfile);
      }
    }

    let initial_redirects_len = graph.redirects.len();
    let initial_package_deps_len = graph.packages.package_deps_sum();
    let initial_package_mappings_len = graph.packages.mappings().len();

    if roots.iter().any(|r| r.scheme() == "npm")
      && self.npm_resolver.as_byonm().is_some()
    {
      bail!("Resolving npm specifier entrypoints this way is currently not supported with \"nodeModules\": \"manual\". In the meantime, try with --node-modules-dir=auto instead");
    }

    graph.build(roots, loader, options).await;

    let has_redirects_changed = graph.redirects.len() != initial_redirects_len;
    let has_jsr_package_deps_changed =
      graph.packages.package_deps_sum() != initial_package_deps_len;
    let has_jsr_package_mappings_changed =
      graph.packages.mappings().len() != initial_package_mappings_len;

    if has_redirects_changed
      || has_jsr_package_deps_changed
      || has_jsr_package_mappings_changed
    {
      if let Some(lockfile) = &self.lockfile {
        let mut lockfile = lockfile.lock();
        // https redirects
        if has_redirects_changed {
          let graph_redirects = graph.redirects.iter().filter(|(from, _)| {
            !matches!(from.scheme(), "npm" | "file" | "deno")
          });
          for (from, to) in graph_redirects {
            lockfile.insert_redirect(from.to_string(), to.to_string());
          }
        }
        // jsr package mappings
        if has_jsr_package_mappings_changed {
          for (from, to) in graph.packages.mappings() {
            lockfile.insert_package_specifier(
              JsrDepPackageReq::jsr(from.clone()),
              to.version.to_string(),
            );
          }
        }
        // jsr packages
        if has_jsr_package_deps_changed {
          for (nv, deps) in graph.packages.packages_with_deps() {
            lockfile.add_package_deps(nv, deps.cloned());
          }
        }
      }
    }

    Ok(())
  }

  pub fn build_fast_check_graph(
    &self,
    graph: &mut ModuleGraph,
    options: BuildFastCheckGraphOptions,
  ) -> Result<(), AnyError> {
    if !graph.graph_kind().include_types() {
      return Ok(());
    }

    log::debug!("Building fast check graph");
    let fast_check_cache = if matches!(
      options.workspace_fast_check,
      deno_graph::WorkspaceFastCheckOption::Disabled
    ) {
      Some(cache::FastCheckCache::new(self.caches.fast_check_db()))
    } else {
      None
    };
    let parser = self.parsed_source_cache.as_capturing_parser();
    let cli_resolver = &self.resolver;
    let graph_resolver = self.create_graph_resolver()?;
    let graph_npm_resolver = cli_resolver
      .create_graph_npm_resolver(self.options.default_npm_caching_strategy());

    graph.build_fast_check_type_graph(
      deno_graph::BuildFastCheckTypeGraphOptions {
        es_parser: Some(&parser),
        fast_check_cache: fast_check_cache.as_ref().map(|c| c as _),
        fast_check_dts: false,
        jsr_url_provider: &CliJsrUrlProvider,
        resolver: Some(&graph_resolver),
        npm_resolver: Some(&graph_npm_resolver),
        workspace_fast_check: options.workspace_fast_check,
      },
    );
    Ok(())
  }

  /// Creates the default loader used for creating a graph.
  pub fn create_graph_loader(&self) -> cache::FetchCacher {
    self.create_fetch_cacher(self.root_permissions_container.clone())
  }

  pub fn create_fetch_cacher(
    &self,
    permissions: PermissionsContainer,
  ) -> cache::FetchCacher {
    cache::FetchCacher::new(
      self.file_fetcher.clone(),
      self.fs.clone(),
      self.global_http_cache.clone(),
      self.in_npm_pkg_checker.clone(),
      self.module_info_cache.clone(),
      cache::FetchCacherOptions {
        file_header_overrides: self.options.resolve_file_header_overrides(),
        permissions,
        is_deno_publish: false,
      },
    )
  }

  /// Check if `roots` and their deps are available. Returns `Ok(())` if
  /// so. Returns `Err(_)` if there is a known module graph or resolution
  /// error statically reachable from `roots` and not a dynamic import.
  pub fn graph_valid(&self, graph: &ModuleGraph) -> Result<(), AnyError> {
    self.graph_roots_valid(
      graph,
      &graph.roots.iter().cloned().collect::<Vec<_>>(),
    )
  }

  pub fn graph_roots_valid(
    &self,
    graph: &ModuleGraph,
    roots: &[ModuleSpecifier],
  ) -> Result<(), AnyError> {
    graph_valid(
      graph,
      &self.fs,
      roots,
      GraphValidOptions {
        kind: if self.options.type_check_mode().is_true() {
          GraphKind::All
        } else {
          GraphKind::CodeOnly
        },
        check_js: self.options.check_js(),
        exit_integrity_errors: true,
      },
    )
  }

  fn create_graph_resolver(&self) -> Result<CliGraphResolver<'_>, AnyError> {
    let jsx_import_source_config = self
      .options
      .workspace()
      .to_maybe_jsx_import_source_config()?;
    Ok(CliGraphResolver {
      cjs_tracker: &self.cjs_tracker,
      resolver: &self.resolver,
      jsx_import_source_config,
    })
  }
}

/// Adds more explanatory information to a resolution error.
pub fn enhanced_resolution_error_message(error: &ResolutionError) -> String {
  let mut message = format_deno_graph_error(error);

  let maybe_hint = if let Some(specifier) =
    get_resolution_error_bare_node_specifier(error)
  {
    if !*DENO_DISABLE_PEDANTIC_NODE_WARNINGS {
      Some(format!("If you want to use a built-in Node module, add a \"node:\" prefix (ex. \"node:{specifier}\")."))
    } else {
      None
    }
  } else {
    get_import_prefix_missing_error(error).map(|specifier| {
      format!(
        "If you want to use a JSR or npm package, try running `deno add jsr:{}` or `deno add npm:{}`",
        specifier, specifier
      )
    })
  };

  if let Some(hint) = maybe_hint {
    message.push_str(&format!("\n  {} {}", "hint:", hint));
  }

  message
}

fn enhanced_sloppy_imports_error_message(
  fs: &Arc<dyn FileSystem>,
  error: &ModuleError,
) -> Option<String> {
  match error {
    ModuleError::LoadingErr(specifier, _, ModuleLoadError::Loader(_)) // ex. "Is a directory" error
    | ModuleError::Missing(specifier, _) => {
      let additional_message = CliSloppyImportsResolver::new(SloppyImportsCachedFs::new(fs.clone()))
        .resolve(specifier, SloppyImportsResolutionKind::Execution)?
        .as_suggestion_message();
      Some(format!(
        // "{} {} or run with --unstable-sloppy-imports",
        "{} {}",
        error,
        additional_message,
      ))
    }
    _ => None,
  }
}

fn enhanced_integrity_error_message(err: &ModuleError) -> Option<String> {
  match err {
    ModuleError::LoadingErr(
      specifier,
      _,
      ModuleLoadError::Jsr(JsrLoadError::ContentChecksumIntegrity(
        checksum_err,
      )),
    ) => {
      Some(format!(
        concat!(
          "Integrity check failed in package. The package may have been tampered with.\n\n",
          "  Specifier: {}\n",
          "  Actual: {}\n",
          "  Expected: {}\n\n",
          "If you modified your global cache, run again with the --reload flag to restore ",
          "its state. If you want to modify dependencies locally run again with the ",
          "--vendor flag or specify `\"vendor\": true` in a deno.json then modify the contents ",
          "of the vendor/ folder."
        ),
        specifier,
        checksum_err.actual,
        checksum_err.expected,
      ))
    }
    ModuleError::LoadingErr(
      _specifier,
      _,
      ModuleLoadError::Jsr(
        JsrLoadError::PackageVersionManifestChecksumIntegrity(
          package_nv,
          checksum_err,
        ),
      ),
    ) => {
      Some(format!(
        concat!(
          "Integrity check failed for package. The source code is invalid, as it does not match the expected hash in the lock file.\n\n",
          "  Package: {}\n",
          "  Actual: {}\n",
          "  Expected: {}\n\n",
          "This could be caused by:\n",
          "  * the lock file may be corrupt\n",
          "  * the source itself may be corrupt\n\n",
          "Investigate the lockfile; delete it to regenerate the lockfile or --reload to reload the source code from the server."
        ),
        package_nv,
        checksum_err.actual,
        checksum_err.expected,
      ))
    }
    ModuleError::LoadingErr(
      specifier,
      _,
      ModuleLoadError::HttpsChecksumIntegrity(checksum_err),
    ) => {
      Some(format!(
        concat!(
          "Integrity check failed for remote specifier. The source code is invalid, as it does not match the expected hash in the lock file.\n\n",
          "  Specifier: {}\n",
          "  Actual: {}\n",
          "  Expected: {}\n\n",
          "This could be caused by:\n",
          "  * the lock file may be corrupt\n",
          "  * the source itself may be corrupt\n\n",
          "Investigate the lockfile; delete it to regenerate the lockfile or --reload to reload the source code from the server."
        ),
        specifier,
        checksum_err.actual,
        checksum_err.expected,
      ))
    }
    _ => None,
  }
}

pub fn get_resolution_error_bare_node_specifier(
  error: &ResolutionError,
) -> Option<&str> {
  get_resolution_error_bare_specifier(error)
    .filter(|specifier| ext_node::is_builtin_node_module(specifier))
}

fn get_resolution_error_bare_specifier(
  error: &ResolutionError,
) -> Option<&str> {
  if let ResolutionError::InvalidSpecifier {
    error: SpecifierError::ImportPrefixMissing { specifier, .. },
    ..
  } = error
  {
    Some(specifier.as_str())
  } else if let ResolutionError::ResolverError { error, .. } = error {
    if let ResolveError::Other(error) = (*error).as_ref() {
      if let Some(ImportMapError::UnmappedBareSpecifier(specifier, _)) =
        error.downcast_ref::<ImportMapError>()
      {
        Some(specifier.as_str())
      } else {
        None
      }
    } else {
      None
    }
  } else {
    None
  }
}

fn get_import_prefix_missing_error(error: &ResolutionError) -> Option<&str> {
  let mut maybe_specifier = None;
  if let ResolutionError::InvalidSpecifier {
    error: SpecifierError::ImportPrefixMissing { specifier, .. },
    range,
  } = error
  {
    if range.specifier.scheme() == "file" {
      maybe_specifier = Some(specifier);
    }
  } else if let ResolutionError::ResolverError { error, range, .. } = error {
    if range.specifier.scheme() == "file" {
      match error.as_ref() {
        ResolveError::Specifier(specifier_error) => {
          if let SpecifierError::ImportPrefixMissing { specifier, .. } =
            specifier_error
          {
            maybe_specifier = Some(specifier);
          }
        }
        ResolveError::Other(other_error) => {
          if let Some(SpecifierError::ImportPrefixMissing {
            specifier, ..
          }) = other_error.downcast_ref::<SpecifierError>()
          {
            maybe_specifier = Some(specifier);
          }
        }
      }
    }
  }

  // NOTE(bartlomieju): For now, return None if a specifier contains a dot or a space. This is because
  // suggesting to `deno add bad-module.ts` makes no sense and is worse than not providing
  // a suggestion at all. This should be improved further in the future
  if let Some(specifier) = maybe_specifier {
    if specifier.contains('.') || specifier.contains(' ') {
      return None;
    }
  }

  maybe_specifier.map(|s| s.as_str())
}

/// Gets if any of the specified root's "file:" dependents are in the
/// provided changed set.
pub fn has_graph_root_local_dependent_changed(
  graph: &ModuleGraph,
  root: &ModuleSpecifier,
  canonicalized_changed_paths: &HashSet<PathBuf>,
) -> bool {
  let mut dependent_specifiers = graph.walk(
    std::iter::once(root),
    deno_graph::WalkOptions {
      follow_dynamic: true,
      kind: GraphKind::All,
      prefer_fast_check_graph: true,
      check_js: true,
    },
  );
  while let Some((s, _)) = dependent_specifiers.next() {
    if let Ok(path) = url_to_file_path(s) {
      if let Ok(path) = canonicalize_path(&path) {
        if canonicalized_changed_paths.contains(&path) {
          return true;
        }
      }
    } else {
      // skip walking this remote module's dependencies
      dependent_specifiers.skip_previous_dependencies();
    }
  }
  false
}

// #[derive(Clone, Debug)]
// pub struct FileWatcherReporter {
//   watcher_communicator: Arc<WatcherCommunicator>,
//   file_paths: Arc<Mutex<Vec<PathBuf>>>,
// }

// impl FileWatcherReporter {
//   pub fn new(watcher_communicator: Arc<WatcherCommunicator>) -> Self {
//     Self {
//       watcher_communicator,
//       file_paths: Default::default(),
//     }
//   }

//   pub fn as_reporter(&self) -> &dyn deno_graph::source::Reporter {
//     self
//   }
// }

// impl deno_graph::source::Reporter for FileWatcherReporter {
//   fn on_load(
//     &self,
//     specifier: &ModuleSpecifier,
//     modules_done: usize,
//     modules_total: usize,
//   ) {
//     let mut file_paths = self.file_paths.lock();
//     if specifier.scheme() == "file" {
//       // Don't trust that the path is a valid path at this point:
//       // https://github.com/denoland/deno/issues/26209.
//       if let Ok(file_path) = specifier.to_file_path() {
//         file_paths.push(file_path);
//       }
//     }

//     if modules_done == modules_total {
//       self
//         .watcher_communicator
//         .watch_paths(file_paths.drain(..).collect())
//         .unwrap();
//     }
//   }
// }

pub struct DenoGraphFsAdapter<'a>(pub &'a dyn deno_fs::FileSystem);

impl<'a> deno_graph::source::FileSystem for DenoGraphFsAdapter<'a> {
  fn read_dir(
    &self,
    dir_url: &deno_graph::ModuleSpecifier,
  ) -> Vec<deno_graph::source::DirEntry> {
    use deno_core::anyhow;
    use deno_graph::source::DirEntry;
    use deno_graph::source::DirEntryKind;

    let dir_path = match dir_url.to_file_path() {
      Ok(path) => path,
      // ignore, treat as non-analyzable
      Err(()) => return vec![],
    };
    let entries = match self.0.read_dir_sync(&dir_path) {
      Ok(dir) => dir,
      Err(err)
        if matches!(
          err.kind(),
          std::io::ErrorKind::PermissionDenied | std::io::ErrorKind::NotFound
        ) =>
      {
        return vec![];
      }
      Err(err) => {
        return vec![DirEntry {
          kind: DirEntryKind::Error(
            anyhow::Error::from(err)
              .context("Failed to read directory.".to_string()),
          ),
          url: dir_url.clone(),
        }];
      }
    };
    let mut dir_entries = Vec::with_capacity(entries.len());
    for entry in entries {
      let entry_path = dir_path.join(&entry.name);
      dir_entries.push(if entry.is_directory {
        DirEntry {
          kind: DirEntryKind::Dir,
          url: ModuleSpecifier::from_directory_path(&entry_path).unwrap(),
        }
      } else if entry.is_file {
        DirEntry {
          kind: DirEntryKind::File,
          url: ModuleSpecifier::from_file_path(&entry_path).unwrap(),
        }
      } else if entry.is_symlink {
        DirEntry {
          kind: DirEntryKind::Symlink,
          url: ModuleSpecifier::from_file_path(&entry_path).unwrap(),
        }
      } else {
        continue;
      });
    }

    dir_entries
  }
}

pub fn format_range_with_colors(referrer: &deno_graph::Range) -> String {
  format!(
    "{}:{}:{}",
    referrer.specifier.as_str(),
    (referrer.range.start.line + 1),
    (referrer.range.start.character + 1)
  )
}

#[derive(Debug, Default, Clone, Copy)]
pub struct CliJsrUrlProvider;

impl deno_graph::source::JsrUrlProvider for CliJsrUrlProvider {
  fn url(&self) -> &'static ModuleSpecifier {
    jsr_url()
  }
}

// todo(dsherret): We should change ModuleError to use thiserror so that
// we don't need to do this.
fn format_deno_graph_error(err: &dyn Error) -> String {
  use std::fmt::Write;

  let mut message = format!("{}", err);
  let mut maybe_source = err.source();

  if maybe_source.is_some() {
    let mut past_message = message.clone();
    let mut count = 0;
    let mut display_count = 0;
    while let Some(source) = maybe_source {
      let current_message = format!("{}", source);
      maybe_source = source.source();

      // sometimes an error might be repeated due to
      // being boxed multiple times in another AnyError
      if current_message != past_message {
        write!(message, "\n    {}: ", display_count,).unwrap();
        for (i, line) in current_message.lines().enumerate() {
          if i > 0 {
            write!(message, "\n       {}", line).unwrap();
          } else {
            write!(message, "{}", line).unwrap();
          }
        }
        display_count += 1;
      }

      if count > 8 {
        write!(message, "\n    {}: ...", count).unwrap();
        break;
      }

      past_message = current_message;
      count += 1;
    }
  }

  message
}

#[derive(Debug)]
struct CliGraphResolver<'a> {
  cjs_tracker: &'a CjsTracker,
  resolver: &'a CliResolver,
  jsx_import_source_config: Option<JsxImportSourceConfig>,
}

impl<'a> deno_graph::source::Resolver for CliGraphResolver<'a> {
  fn default_jsx_import_source(&self) -> Option<String> {
    self
      .jsx_import_source_config
      .as_ref()
      .and_then(|c| c.default_specifier.clone())
  }

  fn default_jsx_import_source_types(&self) -> Option<String> {
    self
      .jsx_import_source_config
      .as_ref()
      .and_then(|c| c.default_types_specifier.clone())
  }

  fn jsx_import_source_module(&self) -> &str {
    self
      .jsx_import_source_config
      .as_ref()
      .map(|c| c.module.as_str())
      .unwrap_or(deno_graph::source::DEFAULT_JSX_IMPORT_SOURCE_MODULE)
  }

  fn resolve(
    &self,
    raw_specifier: &str,
    referrer_range: &deno_graph::Range,
    resolution_kind: ResolutionKind,
  ) -> Result<ModuleSpecifier, ResolveError> {
    self.resolver.resolve(
      raw_specifier,
      &referrer_range.specifier,
      referrer_range.range.start,
      referrer_range
        .resolution_mode
        .map(to_node_resolution_mode)
        .unwrap_or_else(|| {
          self
            .cjs_tracker
            .get_referrer_kind(&referrer_range.specifier)
        }),
      to_node_resolution_kind(resolution_kind),
    )
  }
}

pub fn to_node_resolution_kind(
  kind: ResolutionKind,
) -> node_resolver::NodeResolutionKind {
  match kind {
    ResolutionKind::Execution => node_resolver::NodeResolutionKind::Execution,
    ResolutionKind::Types => node_resolver::NodeResolutionKind::Types,
  }
}

pub fn to_node_resolution_mode(
  mode: deno_graph::source::ResolutionMode,
) -> node_resolver::ResolutionMode {
  match mode {
    deno_graph::source::ResolutionMode::Import => {
      node_resolver::ResolutionMode::Import
    }
    deno_graph::source::ResolutionMode::Require => {
      node_resolver::ResolutionMode::Require
    }
  }
}
