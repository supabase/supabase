use std::future::Future;
use std::sync::Arc;

use anyhow::Context;
use deno::args::check_warn_tsconfig;
use deno::args::CacheSetting;
use deno::args::TsConfigType;
use deno::cache::Caches;
use deno::cache::DenoCacheEnvFsAdapter;
use deno::cache::DenoDir;
use deno::cache::DenoDirProvider;
use deno::cache::EmitCache;
use deno::cache::GlobalHttpCache;
use deno::cache::ModuleInfoCache;
use deno::cache::ParsedSourceCache;
use deno::deno_ast::EmitOptions;
use deno::deno_ast::SourceMapOption;
use deno::deno_cache_dir::npm::NpmCacheDir;
use deno::deno_cache_dir::HttpCache;
use deno::deno_config::workspace::PackageJsonDepResolution;
use deno::deno_config::workspace::WorkspaceResolver;
use deno::deno_npm::npm_rc::ResolvedNpmRc;
use deno::deno_permissions::Permissions;
use deno::deno_permissions::PermissionsOptions;
use deno::deno_resolver::cjs::IsCjsResolutionMode;
use deno::deno_resolver::npm::NpmReqResolverOptions;
use deno::deno_resolver::DenoResolverOptions;
use deno::deno_resolver::NodeAndNpmReqResolver;
use deno::emit::Emitter;
use deno::file_fetcher::FileFetcher;
use deno::graph_util::ModuleGraphBuilder;
use deno::graph_util::ModuleGraphCreator;
use deno::http_util::HttpClientProvider;
use deno::node_resolver::InNpmPackageChecker;
use deno::npm::byonm::CliByonmNpmResolverCreateOptions;
use deno::npm::create_cli_npm_resolver;
use deno::npm::create_in_npm_pkg_checker;
use deno::npm::CliManagedInNpmPkgCheckerCreateOptions;
use deno::npm::CliManagedNpmResolverCreateOptions;
use deno::npm::CliNpmResolver;
use deno::npm::CliNpmResolverCreateOptions;
use deno::npm::CliNpmResolverManagedSnapshotOption;
use deno::npm::CreateInNpmPkgCheckerOptions;
use deno::resolver::CjsTracker;
use deno::resolver::CliDenoResolver;
use deno::resolver::CliDenoResolverFs;
use deno::resolver::CliNpmReqResolver;
use deno::resolver::CliResolver;
use deno::resolver::CliResolverOptions;
use deno::resolver::CliSloppyImportsResolver;
use deno::resolver::SloppyImportsCachedFs;
use deno::util::fs::canonicalize_path_maybe_not_exists;
use deno::DenoOptions;
use deno::PermissionsContainer;
use deno_core::error::AnyError;
use deno_core::futures::FutureExt;
use ext_node::DenoFsNodeResolverEnv;
use ext_node::NodeResolver;
use ext_node::PackageJsonResolver;

use crate::cert_provider::get_root_cert_store_provider;
use crate::permissions::RuntimePermissionDescriptorParser;

struct Deferred<T>(once_cell::unsync::OnceCell<T>);

impl<T> Default for Deferred<T> {
  fn default() -> Self {
    Self(once_cell::unsync::OnceCell::default())
  }
}

impl<T> Deferred<T> {
  #[allow(dead_code)]
  pub fn get_or_try_init(
    &self,
    create: impl FnOnce() -> Result<T, anyhow::Error>,
  ) -> Result<&T, anyhow::Error> {
    self.0.get_or_try_init(create)
  }

  pub fn get_or_init(&self, create: impl FnOnce() -> T) -> &T {
    self.0.get_or_init(create)
  }

  #[allow(dead_code)]
  pub async fn get_or_try_init_async(
    &self,
    create: impl Future<Output = Result<T, anyhow::Error>>,
  ) -> Result<&T, anyhow::Error> {
    if self.0.get().is_none() {
      // todo(dsherret): it would be more ideal if this enforced a
      // single executor and then we could make some initialization
      // concurrent
      let val = create.await?;
      _ = self.0.set(val);
    }
    Ok(self.0.get().unwrap())
  }
}

pub struct EmitterFactory {
  caches: Deferred<Arc<Caches>>,
  cjs_tracker: Deferred<Arc<CjsTracker>>,
  deno_resolver: Deferred<Arc<CliDenoResolver>>,
  emitter: Deferred<Arc<Emitter>>,
  file_fetcher: Deferred<Arc<FileFetcher>>,
  global_http_cache: Deferred<Arc<GlobalHttpCache>>,
  http_client_provider: Deferred<Arc<HttpClientProvider>>,
  in_npm_pkg_checker: Deferred<Arc<dyn InNpmPackageChecker>>,
  module_graph_builder: Deferred<Arc<ModuleGraphBuilder>>,
  module_graph_creator: Deferred<Arc<ModuleGraphCreator>>,
  module_info_cache: Deferred<Arc<ModuleInfoCache>>,
  node_resolver: Deferred<Arc<NodeResolver>>,
  npm_cache_dir: Deferred<Arc<NpmCacheDir>>,
  npm_req_resolver: Deferred<Arc<CliNpmReqResolver>>,
  npm_resolver: Deferred<Arc<dyn CliNpmResolver>>,
  permission_desc_parser: Deferred<Arc<RuntimePermissionDescriptorParser>>,
  pkg_json_resolver: Deferred<Arc<PackageJsonResolver>>,
  resolved_npm_rc: Deferred<Arc<ResolvedNpmRc>>,
  resolver: Deferred<Arc<CliResolver>>,
  root_permissions_container: Deferred<PermissionsContainer>,
  sloppy_imports_resolver: Deferred<Option<Arc<CliSloppyImportsResolver>>>,
  workspace_resolver: Deferred<Arc<WorkspaceResolver>>,

  cache_strategy: Option<CacheSetting>,
  deno_dir: DenoDir,
  deno_options: Option<Arc<DenoOptions>>,
  file_fetcher_allow_remote: bool,
  permissions_options: Option<PermissionsOptions>,
}

impl Default for EmitterFactory {
  fn default() -> Self {
    Self::new()
  }
}

impl EmitterFactory {
  pub fn new() -> Self {
    let deno_dir = DenoDir::new(None).unwrap();

    Self {
      caches: Default::default(),
      cjs_tracker: Default::default(),
      deno_resolver: Default::default(),
      emitter: Default::default(),
      file_fetcher: Default::default(),
      global_http_cache: Default::default(),
      http_client_provider: Default::default(),
      in_npm_pkg_checker: Default::default(),
      module_graph_builder: Default::default(),
      module_graph_creator: Default::default(),
      module_info_cache: Default::default(),
      node_resolver: Default::default(),
      npm_cache_dir: Default::default(),
      npm_req_resolver: Default::default(),
      npm_resolver: Default::default(),
      permission_desc_parser: Default::default(),
      pkg_json_resolver: Default::default(),
      resolved_npm_rc: Default::default(),
      resolver: Default::default(),
      root_permissions_container: Default::default(),
      sloppy_imports_resolver: Default::default(),
      workspace_resolver: Default::default(),

      cache_strategy: None,
      deno_dir,
      deno_options: None,
      file_fetcher_allow_remote: true,
      permissions_options: None,
    }
  }

  pub fn deno_options(&self) -> Result<&Arc<DenoOptions>, AnyError> {
    self
      .deno_options
      .as_ref()
      .context("options must be specified")
  }

  pub fn set_deno_options(&mut self, value: DenoOptions) -> &mut Self {
    self.deno_options = Some(Arc::new(value));
    self
  }

  pub fn set_cache_strategy(
    &mut self,
    value: Option<CacheSetting>,
  ) -> &mut Self {
    self.cache_strategy = value;
    self
  }

  pub fn set_file_fetcher_allow_remote(&mut self, value: bool) -> &mut Self {
    self.file_fetcher_allow_remote = value;
    self
  }

  pub fn permissions_options(&self) -> &Option<PermissionsOptions> {
    &self.permissions_options
  }

  pub fn set_permissions_options(
    &mut self,
    value: Option<PermissionsOptions>,
  ) -> &mut Self {
    self.permissions_options = value;
    self
  }

  pub fn deno_dir_provider(&self) -> Arc<DenoDirProvider> {
    Arc::new(DenoDirProvider::new(None))
  }

  pub fn caches(&self) -> Result<&Arc<Caches>, anyhow::Error> {
    Ok(self.caches.get_or_init(|| {
      let caches = Arc::new(Caches::new(self.deno_dir_provider()));
      let _ = caches.dep_analysis_db();
      let _ = caches.node_analysis_db();
      caches
    }))
  }

  pub fn module_info_cache(
    &self,
  ) -> Result<&Arc<ModuleInfoCache>, anyhow::Error> {
    self.module_info_cache.get_or_try_init(|| {
      Ok(Arc::new(ModuleInfoCache::new(
        self.caches()?.dep_analysis_db(),
        self.parsed_source_cache()?,
      )))
    })
  }

  pub fn emit_cache(&self) -> Result<EmitCache, anyhow::Error> {
    Ok(EmitCache::new(self.deno_dir.gen_cache.clone()))
  }

  pub fn parsed_source_cache(
    &self,
  ) -> Result<Arc<ParsedSourceCache>, anyhow::Error> {
    let source_cache = Arc::new(ParsedSourceCache::default());
    Ok(source_cache)
  }

  pub fn emit_options(&self) -> EmitOptions {
    EmitOptions {
      inline_sources: true,
      source_map: SourceMapOption::Inline,
      ..Default::default()
    }
  }

  pub fn emitter(&self) -> Result<&Arc<Emitter>, anyhow::Error> {
    self.emitter.get_or_try_init(|| {
      let options = self.deno_options()?;
      let ts_config_result =
        options.resolve_ts_config_for_emit(TsConfigType::Emit)?;
      check_warn_tsconfig(&ts_config_result);
      let emit_options = self.emit_options();
      let (transpile_options, _) =
        deno::args::ts_config_to_transpile_and_emit_options(
          ts_config_result.ts_config,
        )?;
      Ok(Arc::new(Emitter::new(
        self.cjs_tracker()?.clone(),
        Arc::new(self.emit_cache()?),
        self.parsed_source_cache()?,
        transpile_options,
        emit_options,
      )))
    })
  }

  pub fn global_http_cache(&self) -> &Arc<GlobalHttpCache> {
    self.global_http_cache.get_or_init(|| {
      Arc::new(GlobalHttpCache::new(
        self.deno_dir.remote_folder_path(),
        deno::cache::RealDenoCacheEnv,
      ))
    })
  }

  pub fn http_cache(&self) -> Arc<dyn HttpCache> {
    self.global_http_cache().clone()
  }

  pub fn http_client_provider(&self) -> &Arc<HttpClientProvider> {
    self.http_client_provider.get_or_init(|| {
      Arc::new(HttpClientProvider::new(
        get_root_cert_store_provider().ok(),
        None,
      ))
    })
  }

  pub fn fs(&self) -> Arc<dyn deno::deno_fs::FileSystem> {
    Arc::new(deno::deno_fs::RealFs)
  }

  pub fn cjs_tracker(&self) -> Result<&Arc<CjsTracker>, anyhow::Error> {
    self.cjs_tracker.get_or_try_init(|| {
      let options = self.deno_options()?;
      Ok(Arc::new(CjsTracker::new(
        self.in_npm_pkg_checker()?.clone(),
        self.pkg_json_resolver().clone(),
        if options.is_node_main() || options.unstable_detect_cjs() {
          IsCjsResolutionMode::ImplicitTypeCommonJs
        } else if options.detect_cjs() {
          IsCjsResolutionMode::ExplicitTypeCommonJs
        } else {
          IsCjsResolutionMode::Disabled
        },
      )))
    })
  }

  pub fn in_npm_pkg_checker(
    &self,
  ) -> Result<&Arc<dyn InNpmPackageChecker>, anyhow::Error> {
    self.in_npm_pkg_checker.get_or_try_init(|| {
      let options = self.deno_options()?;
      let options = if options.use_byonm() {
        CreateInNpmPkgCheckerOptions::Byonm
      } else {
        CreateInNpmPkgCheckerOptions::Managed(
          CliManagedInNpmPkgCheckerCreateOptions {
            root_cache_dir_url: self.npm_cache_dir()?.root_dir_url(),
            maybe_node_modules_path: options
              .node_modules_dir_path()
              .map(|p| p.as_path()),
          },
        )
      };
      Ok(create_in_npm_pkg_checker(options))
    })
  }

  pub async fn npm_resolver(
    &self,
  ) -> Result<&Arc<dyn CliNpmResolver>, anyhow::Error> {
    self
      .npm_resolver
      .get_or_try_init_async(
        async {
          let fs = self.fs();
          let options = self.deno_options()?;
          create_cli_npm_resolver(if options.use_byonm() {
            CliNpmResolverCreateOptions::Byonm(
              CliByonmNpmResolverCreateOptions {
                fs: CliDenoResolverFs(fs),
                pkg_json_resolver: self.pkg_json_resolver().clone(),
                root_node_modules_dir: Some(
                  match options.node_modules_dir_path() {
                    Some(node_modules_path) => node_modules_path.to_path_buf(),
                    None => {
                      canonicalize_path_maybe_not_exists(options.initial_cwd())?
                        .join("node_modules")
                    }
                  },
                ),
              },
            )
          } else {
            CliNpmResolverCreateOptions::Managed(
              CliManagedNpmResolverCreateOptions {
                snapshot: if let Some(lockfile) =
                  options.maybe_lockfile().cloned()
                {
                  CliNpmResolverManagedSnapshotOption::ResolveFromLockfile(
                    lockfile,
                  )
                } else {
                  CliNpmResolverManagedSnapshotOption::Specified(None)
                },
                maybe_lockfile: options.maybe_lockfile().cloned(),
                fs,
                http_client_provider: self.http_client_provider().clone(),
                npm_cache_dir: self.npm_cache_dir()?.clone(),
                cache_setting: self
                  .cache_strategy
                  .clone()
                  .unwrap_or(CacheSetting::Use),
                maybe_node_modules_path: None,
                npm_system_info: Default::default(),
                npm_install_deps_provider: Default::default(),
                npmrc: self.resolved_npm_rc()?.clone(),
              },
            )
          })
          .await
        }
        .boxed_local(),
      )
      .await
  }

  pub async fn npm_req_resolver(
    &self,
  ) -> Result<&Arc<CliNpmReqResolver>, AnyError> {
    self
      .npm_req_resolver
      .get_or_try_init_async(async {
        let npm_resolver = self.npm_resolver().await?;
        Ok(Arc::new(CliNpmReqResolver::new(NpmReqResolverOptions {
          byonm_resolver: (npm_resolver.clone()).into_maybe_byonm(),
          fs: CliDenoResolverFs(self.fs()),
          in_npm_pkg_checker: self.in_npm_pkg_checker()?.clone(),
          node_resolver: self.node_resolver().await?.clone(),
          npm_req_resolver: npm_resolver.clone().into_npm_req_resolver(),
        })))
      })
      .await
  }

  pub async fn deno_resolver(&self) -> Result<&Arc<CliDenoResolver>, AnyError> {
    self
      .deno_resolver
      .get_or_try_init_async(async {
        let options = self.deno_options()?;
        Ok(Arc::new(CliDenoResolver::new(DenoResolverOptions {
          in_npm_pkg_checker: self.in_npm_pkg_checker()?.clone(),
          node_and_req_resolver: Some(NodeAndNpmReqResolver {
            node_resolver: self.node_resolver().await?.clone(),
            npm_req_resolver: self.npm_req_resolver().await?.clone(),
          }),
          sloppy_imports_resolver: self.sloppy_imports_resolver()?.cloned(),
          workspace_resolver: self.workspace_resolver()?.clone(),
          is_byonm: options.use_byonm(),
          maybe_vendor_dir: options.vendor_dir_path(),
        })))
      })
      .await
  }

  pub async fn resolver(&self) -> Result<&Arc<CliResolver>, AnyError> {
    self
      .resolver
      .get_or_try_init_async(
        async {
          Ok(Arc::new(CliResolver::new(CliResolverOptions {
            npm_resolver: Some(self.npm_resolver().await?.clone()),
            bare_node_builtins_enabled: false,
            deno_resolver: self.deno_resolver().await?.clone(),
          })))
        }
        .boxed_local(),
      )
      .await
  }

  pub fn npm_cache_dir(&self) -> Result<&Arc<NpmCacheDir>, anyhow::Error> {
    self.npm_cache_dir.get_or_try_init(|| {
      let fs = self.fs();
      let global_path = self.deno_dir.npm_folder_path();
      let options = self.deno_options()?;
      Ok(Arc::new(NpmCacheDir::new(
        &DenoCacheEnvFsAdapter(fs.as_ref()),
        global_path,
        options.npmrc().get_all_known_registries_urls(),
      )))
    })
  }

  pub fn resolved_npm_rc(&self) -> Result<&Arc<ResolvedNpmRc>, anyhow::Error> {
    self
      .resolved_npm_rc
      .get_or_try_init(|| Ok(self.deno_options()?.npmrc().clone()))
  }

  pub async fn node_resolver(
    &self,
  ) -> Result<&Arc<NodeResolver>, anyhow::Error> {
    self
      .node_resolver
      .get_or_try_init_async(
        async {
          Ok(Arc::new(NodeResolver::new(
            DenoFsNodeResolverEnv::new(self.fs().clone()),
            self.in_npm_pkg_checker()?.clone(),
            self
              .npm_resolver()
              .await?
              .clone()
              .into_npm_pkg_folder_resolver(),
            self.pkg_json_resolver().clone(),
          )))
        }
        .boxed_local(),
      )
      .await
  }

  pub fn pkg_json_resolver(&self) -> &Arc<PackageJsonResolver> {
    self.pkg_json_resolver.get_or_init(|| {
      Arc::new(PackageJsonResolver::new(DenoFsNodeResolverEnv::new(
        self.fs().clone(),
      )))
    })
  }

  pub fn permission_desc_parser(
    &self,
  ) -> Result<&Arc<RuntimePermissionDescriptorParser>, anyhow::Error> {
    self.permission_desc_parser.get_or_try_init(|| {
      let fs = self.fs();
      Ok(Arc::new(RuntimePermissionDescriptorParser::new(fs)))
    })
  }

  pub fn root_permissions_container(
    &self,
  ) -> Result<&PermissionsContainer, anyhow::Error> {
    self.root_permissions_container.get_or_try_init(|| {
      let desc_parser = self.permission_desc_parser()?.clone();
      let options = if let Some(options) = self.permissions_options.as_ref() {
        options
      } else {
        &PermissionsOptions::default()
      };
      let permissions =
        Permissions::from_options(desc_parser.as_ref(), options)?;
      Ok(PermissionsContainer::new(desc_parser, permissions))
    })
  }

  pub fn sloppy_imports_resolver(
    &self,
  ) -> Result<Option<&Arc<CliSloppyImportsResolver>>, AnyError> {
    self
      .sloppy_imports_resolver
      .get_or_try_init(|| {
        Ok(self.deno_options()?.unstable_sloppy_imports().then(|| {
          Arc::new(CliSloppyImportsResolver::new(SloppyImportsCachedFs::new(
            self.fs().clone(),
          )))
        }))
      })
      .map(|maybe| maybe.as_ref())
  }

  pub fn workspace_resolver(
    &self,
  ) -> Result<&Arc<WorkspaceResolver>, anyhow::Error> {
    self.workspace_resolver.get_or_try_init(|| {
      let options = self.deno_options()?;
      let resolver = options.create_workspace_resolver(
        self.file_fetcher()?,
        if options.use_byonm() {
          PackageJsonDepResolution::Disabled
        } else {
          // todo(dsherret): this should be false for nodeModulesDir: true
          PackageJsonDepResolution::Enabled
        },
      )?;

      if !resolver.diagnostics().is_empty() {
        log::warn!(
          "Import map diagnostics:\n{}",
          resolver
            .diagnostics()
            .iter()
            .map(|d| format!(" - {d}"))
            .collect::<Vec<_>>()
            .join("\n")
        )
      }
      Ok(Arc::new(resolver))
    })
  }

  pub fn file_fetcher(&self) -> Result<&Arc<FileFetcher>, anyhow::Error> {
    self.file_fetcher.get_or_try_init(|| {
      let http_client_provider = self.http_client_provider();
      let blob_store = Arc::new(deno::deno_web::BlobStore::default());

      Ok(Arc::new(FileFetcher::new(
        self.http_cache().clone(),
        self
          .cache_strategy
          .clone()
          .unwrap_or(CacheSetting::ReloadAll),
        self.file_fetcher_allow_remote,
        http_client_provider.clone(),
        blob_store,
      )))
    })
  }

  pub async fn module_graph_builder(
    &self,
  ) -> Result<&Arc<ModuleGraphBuilder>, AnyError> {
    self
      .module_graph_builder
      .get_or_try_init_async(async {
        let options = self.deno_options()?.clone();
        Ok(Arc::new(ModuleGraphBuilder::new(
          self.caches()?.clone(),
          self.cjs_tracker()?.clone(),
          options.clone(),
          self.file_fetcher()?.clone(),
          self.fs().clone(),
          self.global_http_cache().clone(),
          self.in_npm_pkg_checker()?.clone(),
          options.maybe_lockfile().cloned(),
          self.module_info_cache()?.clone(),
          self.npm_resolver().await?.clone(),
          self.parsed_source_cache()?.clone(),
          self.resolver().await?.clone(),
          self.root_permissions_container()?.clone(),
        )))
      })
      .await
  }

  pub async fn module_graph_creator(
    &self,
  ) -> Result<&Arc<ModuleGraphCreator>, AnyError> {
    self
      .module_graph_creator
      .get_or_try_init_async(async {
        let options = self.deno_options()?;
        Ok(Arc::new(ModuleGraphCreator::new(
          options.clone(),
          self.npm_resolver().await?.clone(),
          self.module_graph_builder().await?.clone(),
        )))
      })
      .await
  }
}
