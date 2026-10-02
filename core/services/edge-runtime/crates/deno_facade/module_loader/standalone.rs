use std::borrow::Cow;
use std::path::Path;
use std::path::PathBuf;
use std::rc::Rc;
use std::sync::Arc;

use anyhow::anyhow;
use anyhow::Context;
use base64::Engine;
use deno::args::CacheSetting;
use deno::args::NpmInstallDepsProvider;
use deno::cache::Caches;
use deno::cache::DenoCacheEnvFsAdapter;
use deno::cache::DenoDirProvider;
use deno::cache::NodeAnalysisCache;
use deno::deno_ast::MediaType;
use deno::deno_cache_dir::npm::NpmCacheDir;
use deno::deno_fs::RealFs;
use deno::deno_package_json;
use deno::deno_package_json::PackageJsonDepValue;
use deno::deno_permissions::PermissionDescriptorParser;
use deno::deno_permissions::Permissions;
use deno::deno_permissions::PermissionsOptions;
use deno::deno_resolver::cjs::IsCjsResolutionMode;
use deno::deno_resolver::npm::NpmReqResolverOptions;
use deno::deno_semver::npm::NpmPackageReqReference;
use deno::deno_tls::rustls::RootCertStore;
use deno::deno_tls::RootCertStoreProvider;
use deno::http_util::HttpClientProvider;
use deno::node::CliCjsCodeAnalyzer;
use deno::node::CliNodeCodeTranslator;
use deno::node_resolver::analyze::NodeCodeTranslator;
use deno::node_resolver::NodeResolutionKind;
use deno::node_resolver::PackageJsonResolver;
use deno::node_resolver::ResolutionMode;
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
use deno::resolver::CliDenoResolverFs;
use deno::resolver::CliNpmReqResolver;
use deno::resolver::NpmModuleLoader;
use deno::standalone::binary;
use deno::util::text_encoding::from_utf8_lossy_cow;
use deno::PermissionsContainer;
use deno_config::workspace::MappedResolution;
use deno_config::workspace::ResolverWorkspaceJsrPackage;
use deno_config::workspace::WorkspaceResolver;
use deno_core::error::type_error;
use deno_core::error::AnyError;
use deno_core::futures::FutureExt;
use deno_core::url::Url;
use deno_core::FastString;
use deno_core::ModuleLoader;
use deno_core::ModuleSourceCode;
use deno_core::ModuleSpecifier;
use deno_core::ModuleType;
use deno_core::RequestedModuleType;
use deno_core::ResolutionKind;
use eszip::deno_graph;
use eszip::EszipRelativeFileBaseUrl;
use eszip::ModuleKind;
use eszip_trait::AsyncEszipDataRead;
use ext_node::create_host_defined_options;
use ext_node::DenoFsNodeResolverEnv;
use ext_node::NodeExtInitServices;
use ext_node::NodeRequireLoader;
use ext_node::NodeResolver;
use ext_runtime::cert::get_root_cert_store;
use ext_runtime::cert::CaData;
use fs::deno_compile_fs::DenoCompileFileSystem;
use fs::virtual_fs::FileBackedVfs;
use futures_util::future::OptionFuture;
use tracing::instrument;

use crate::eszip::vfs::load_npm_vfs;
use crate::metadata::Metadata;
use crate::migrate;
use crate::migrate::MigrateOptions;
use crate::payload_to_eszip;
use crate::permissions::RuntimePermissionDescriptorParser;
use crate::EszipPayloadKind;
use crate::LazyLoadableEszip;

use super::util::arc_u8_to_arc_str;
use super::RuntimeProviders;

pub struct WorkspaceEszipModule {
  specifier: ModuleSpecifier,
  inner: eszip::Module,
}

pub struct WorkspaceEszip {
  pub eszip: LazyLoadableEszip,
  pub root_dir_url: Arc<Url>,
}

impl WorkspaceEszip {
  pub fn get_module(
    &self,
    specifier: &ModuleSpecifier,
  ) -> Option<WorkspaceEszipModule> {
    if specifier.scheme() == "file" {
      let specifier_key = EszipRelativeFileBaseUrl::new(&self.root_dir_url)
        .specifier_key(specifier);

      let module = self.eszip.ensure_module(&specifier_key)?;
      let specifier = self.root_dir_url.join(&module.specifier).unwrap();

      Some(WorkspaceEszipModule {
        specifier,
        inner: module,
      })
    } else {
      let module = self.eszip.ensure_module(specifier.as_str())?;

      Some(WorkspaceEszipModule {
        specifier: ModuleSpecifier::parse(&module.specifier).unwrap(),
        inner: module,
      })
    }
  }
}

pub struct SharedModuleLoaderState {
  pub(crate) root_path: PathBuf,
  pub(crate) eszip: WorkspaceEszip,
  pub(crate) workspace_resolver: WorkspaceResolver,
  pub(crate) cjs_tracker: Arc<CjsTracker>,
  pub(crate) node_code_translator: Arc<CliNodeCodeTranslator>,
  pub(crate) npm_module_loader: Arc<NpmModuleLoader>,
  pub(crate) npm_req_resolver: Arc<CliNpmReqResolver>,
  pub(crate) npm_resolver: Arc<dyn CliNpmResolver>,
  pub(crate) node_resolver: Arc<NodeResolver>,
  pub(crate) vfs: Arc<FileBackedVfs>,
}

#[derive(Clone)]
pub struct EmbeddedModuleLoader {
  pub(crate) shared: Arc<SharedModuleLoaderState>,
  pub(crate) include_source_map: bool,
}

fn resolve_standalone_referrer(
  referrer: &str,
  root_path: &Path,
) -> Result<ModuleSpecifier, AnyError> {
  if referrer == "." {
    return Ok(deno_core::resolve_path(".", root_path)?);
  }

  ModuleSpecifier::parse(referrer).map_err(|err| {
    type_error(format!("Referrer uses invalid specifier: {}", err))
  })
}

impl ModuleLoader for EmbeddedModuleLoader {
  #[instrument(level = "debug", skip(self))]
  fn resolve(
    &self,
    specifier: &str,
    referrer: &str,
    _kind: ResolutionKind,
  ) -> Result<ModuleSpecifier, AnyError> {
    let referrer =
      resolve_standalone_referrer(referrer, &self.shared.root_path)?;
    let referrer_kind = if self
      .shared
      .cjs_tracker
      .is_maybe_cjs(&referrer, MediaType::from_specifier(&referrer))?
    {
      ResolutionMode::Require
    } else {
      ResolutionMode::Import
    };

    if self.shared.node_resolver.in_npm_package(&referrer) {
      return Ok(
        self
          .shared
          .node_resolver
          .resolve(
            specifier,
            &referrer,
            referrer_kind,
            NodeResolutionKind::Execution,
          )?
          .into_url(),
      );
    }

    let mapped_resolution =
      self.shared.workspace_resolver.resolve(specifier, &referrer);

    match mapped_resolution {
      Ok(MappedResolution::WorkspaceJsrPackage { specifier, .. }) => {
        Ok(specifier)
      }
      Ok(MappedResolution::WorkspaceNpmPackage {
        target_pkg_json: pkg_json,
        sub_path,
        ..
      }) => Ok(
        self
          .shared
          .node_resolver
          .resolve_package_subpath_from_deno_module(
            pkg_json.dir_path(),
            sub_path.as_deref(),
            Some(&referrer),
            referrer_kind,
            NodeResolutionKind::Execution,
          )?,
      ),
      Ok(MappedResolution::PackageJson {
        dep_result,
        sub_path,
        alias,
        ..
      }) => match dep_result.as_ref().map_err(|e| AnyError::from(e.clone()))? {
        PackageJsonDepValue::Req(req) => self
          .shared
          .npm_req_resolver
          .resolve_req_with_sub_path(
            req,
            sub_path.as_deref(),
            &referrer,
            referrer_kind,
            NodeResolutionKind::Execution,
          )
          .map_err(AnyError::from),

        PackageJsonDepValue::Workspace(version_req) => {
          let pkg_folder = self
            .shared
            .workspace_resolver
            .resolve_workspace_pkg_json_folder_for_pkg_json_dep(
              alias,
              version_req,
            )?;
          Ok(
            self
              .shared
              .node_resolver
              .resolve_package_subpath_from_deno_module(
                pkg_folder,
                sub_path.as_deref(),
                Some(&referrer),
                referrer_kind,
                NodeResolutionKind::Execution,
              )?,
          )
        }
      },
      Ok(MappedResolution::Normal { specifier, .. })
      | Ok(MappedResolution::ImportMap { specifier, .. }) => {
        if let Ok(reference) =
          NpmPackageReqReference::from_specifier(&specifier)
        {
          return Ok(self.shared.npm_req_resolver.resolve_req_reference(
            &reference,
            &referrer,
            referrer_kind,
            NodeResolutionKind::Execution,
          )?);
        }

        if specifier.scheme() == "jsr" {
          if let Some(module) = self.shared.eszip.get_module(&specifier) {
            return Ok(module.specifier);
          }
        }

        Ok(
          self
            .shared
            .node_resolver
            .handle_if_in_node_modules(&specifier)
            .unwrap_or(specifier),
        )
      }
      Err(err)
        if err.is_unmapped_bare_specifier() && referrer.scheme() == "file" =>
      {
        let maybe_res = self.shared.npm_req_resolver.resolve_if_for_npm_pkg(
          specifier,
          &referrer,
          referrer_kind,
          NodeResolutionKind::Execution,
        );
        if let Ok(Some(res)) = maybe_res {
          return Ok(res.into_url());
        }
        Err(err.into())
      }
      Err(err) => Err(err.into()),
    }
  }

  fn get_host_defined_options<'s>(
    &self,
    scope: &mut deno_core::v8::HandleScope<'s>,
    name: &str,
  ) -> Option<deno_core::v8::Local<'s, deno_core::v8::Data>> {
    let name = deno_core::ModuleSpecifier::parse(name).ok()?;
    if self.shared.node_resolver.in_npm_package(&name) {
      Some(create_host_defined_options(scope))
    } else {
      None
    }
  }

  #[instrument(level = "debug", skip_all, fields(specifier = original_specifier.as_str()))]
  fn load(
    &self,
    original_specifier: &ModuleSpecifier,
    maybe_referrer: Option<&ModuleSpecifier>,
    _is_dynamic: bool,
    _requested_module_type: RequestedModuleType,
  ) -> deno_core::ModuleLoadResponse {
    let include_source_map = self.include_source_map;

    if original_specifier.scheme() == "data" {
      let data_url_text =
        match deno_graph::source::RawDataUrl::parse(original_specifier)
          .and_then(|url| url.decode())
        {
          Ok(response) => response,
          Err(err) => {
            return deno_core::ModuleLoadResponse::Sync(Err(type_error(
              format!("{:#}", err),
            )));
          }
        };

      return deno_core::ModuleLoadResponse::Sync(Ok(
        deno_core::ModuleSource::new(
          deno_core::ModuleType::JavaScript,
          ModuleSourceCode::String(data_url_text.into()),
          original_specifier,
          None,
        ),
      ));
    }

    if self.shared.node_resolver.in_npm_package(original_specifier) {
      let npm_module_loader = self.shared.npm_module_loader.clone();
      let original_specifier = original_specifier.clone();
      let maybe_referrer = maybe_referrer.cloned();

      return deno_core::ModuleLoadResponse::Async(
        async move {
          let code_source = npm_module_loader
            .load(&original_specifier, maybe_referrer.as_ref())
            .await?;

          Ok(deno_core::ModuleSource::new_with_redirect(
            match code_source.media_type {
              MediaType::Json => ModuleType::Json,
              _ => ModuleType::JavaScript,
            },
            code_source.code,
            &original_specifier,
            &code_source.found_url,
            None,
          ))
        }
        .boxed_local(),
      );
    }

    let Some(module) = self.shared.eszip.get_module(original_specifier) else {
      return deno_core::ModuleLoadResponse::Sync(Err(type_error(format!(
        "Module not found: {}",
        original_specifier
      ))));
    };

    let original_specifier = original_specifier.clone();
    let media_type = MediaType::from_specifier(&module.specifier);
    let shared = self.shared.clone();
    let is_maybe_cjs = match shared
      .cjs_tracker
      .is_maybe_cjs(&original_specifier, media_type)
    {
      Ok(is_maybe_cjs) => is_maybe_cjs,
      Err(err) => {
        return deno_core::ModuleLoadResponse::Sync(Err(type_error(format!(
          "{:?}",
          err
        ))));
      }
    };

    deno_core::ModuleLoadResponse::Async(
      async move {
        let code = module.inner.source().await.ok_or_else(|| {
          type_error(format!("Module not found: {}", original_specifier))
        })?;

        if module.inner.kind == ModuleKind::Wasm {
          return Ok(deno_core::ModuleSource::new_with_redirect(
            ModuleType::Wasm,
            ModuleSourceCode::Bytes(code.into()),
            &original_specifier,
            &module.specifier,
            None,
          ));
        }

        let code = arc_u8_to_arc_str(code)
          .map_err(|_| type_error("Module source is not utf-8"))?;

        if is_maybe_cjs {
          let source = shared
            .node_code_translator
            .translate_cjs_to_esm(
              &module.specifier,
              Some(code.to_string().into()),
            )
            .await?;
          let module_source = match source {
            Cow::Owned(source) => ModuleSourceCode::String(source.into()),
            Cow::Borrowed(source) => {
              ModuleSourceCode::String(FastString::from_static(source))
            }
          };
          Ok(deno_core::ModuleSource::new_with_redirect(
            ModuleType::JavaScript,
            module_source,
            &original_specifier,
            &module.specifier,
            None,
          ))
        } else {
          let source_map = module.inner.source_map().await;
          let maybe_code_with_source_map = 'scope: {
            if !include_source_map
              || !matches!(module.inner.kind, ModuleKind::JavaScript)
            {
              break 'scope code;
            }

            let Some(source_map) = source_map else {
              break 'scope code;
            };
            if source_map.is_empty() {
              break 'scope code;
            }

            let mut src = code.to_string();

            if !src.ends_with('\n') {
              src.push('\n');
            }

            const SOURCE_MAP_PREFIX: &str =
              "//# sourceMappingURL=data:application/json;base64,";

            src.push_str(SOURCE_MAP_PREFIX);

            base64::prelude::BASE64_STANDARD
              .encode_string(source_map, &mut src);
            Arc::from(src)
          };

          Ok(deno_core::ModuleSource::new_with_redirect(
            match module.inner.kind {
              ModuleKind::JavaScript => ModuleType::JavaScript,
              ModuleKind::Json => ModuleType::Json,
              ModuleKind::Jsonc => {
                return Err(type_error("jsonc modules not supported"))
              }
              ModuleKind::OpaqueData | ModuleKind::Wasm => {
                unreachable!();
              }
            },
            ModuleSourceCode::String(maybe_code_with_source_map.into()),
            &original_specifier,
            &module.specifier,
            None,
          ))
        }
      }
      .boxed_local(),
    )
  }
}

impl NodeRequireLoader for EmbeddedModuleLoader {
  fn ensure_read_permission<'a>(
    &self,
    permissions: &mut dyn ext_node::NodePermissions,
    path: &'a Path,
  ) -> Result<Cow<'a, Path>, AnyError> {
    if self.shared.vfs.open_file(path).is_ok() {
      // allow reading if the file is in the virtual fs
      return Ok(Cow::Borrowed(path));
    }

    self
      .shared
      .npm_resolver
      .ensure_read_permission(permissions, path)
  }

  fn load_text_file_lossy(
    &self,
    path: &Path,
  ) -> Result<Cow<'static, str>, AnyError> {
    let file_entry = self.shared.vfs.open_file(path)?;
    let file_bytes = file_entry.read_all_sync()?;
    Ok(from_utf8_lossy_cow(file_bytes))
  }

  fn is_maybe_cjs(
    &self,
    specifier: &Url,
  ) -> Result<bool, deno::node_resolver::errors::ClosestPkgJsonError> {
    let media_type = MediaType::from_specifier(specifier);
    self.shared.cjs_tracker.is_maybe_cjs(specifier, media_type)
  }
}

pub struct StandaloneModuleLoaderFactory {
  shared: Arc<SharedModuleLoaderState>,
}

struct StandaloneRootCertStoreProvider {
  ca_stores: Option<Vec<String>>,
  ca_data: Option<CaData>,
  cell: once_cell::sync::OnceCell<RootCertStore>,
}

impl RootCertStoreProvider for StandaloneRootCertStoreProvider {
  fn get_or_try_init(&self) -> Result<&RootCertStore, AnyError> {
    self.cell.get_or_try_init(|| {
      get_root_cert_store(None, self.ca_stores.clone(), self.ca_data.clone())
        .map_err(|err| err.into())
    })
  }
}

pub async fn create_module_loader_for_eszip(
  mut eszip: LazyLoadableEszip,
  permissions_options: PermissionsOptions,
  include_source_map: bool,
) -> Result<RuntimeProviders, AnyError> {
  let migrated = eszip.migrated();
  let current_exe_path = std::env::current_exe().unwrap();
  let current_exe_name =
    current_exe_path.file_name().unwrap().to_string_lossy();

  let permission_desc_parser =
    Arc::new(RuntimePermissionDescriptorParser::new(Arc::new(RealFs)))
      as Arc<dyn PermissionDescriptorParser>;
  let permissions =
    Permissions::from_options(&*permission_desc_parser, &permissions_options)?;
  let permissions_container =
    PermissionsContainer::new(permission_desc_parser.clone(), permissions);

  let mut metadata = OptionFuture::<_>::from(
    eszip
      .ensure_module(eszip_trait::v2::METADATA_KEY)
      .map(|it| async move { it.source().await }),
  )
  .await
  .flatten()
  .map(|it| {
    rkyv::from_bytes::<Metadata>(it.as_ref())
      .map_err(|_| anyhow!("failed to deserialize metadata from eszip"))
  })
  .transpose()?
  .unwrap_or_default();

  let root_path = if cfg!(target_family = "unix") {
    PathBuf::from("/var/tmp")
  } else {
    std::env::temp_dir()
  }
  .join(format!("sb-compile-{}", current_exe_name));

  let node_modules = metadata.node_modules()?;
  let root_dir_url =
    Arc::new(ModuleSpecifier::from_directory_path(&root_path).unwrap());
  let root_node_modules_path = match &node_modules {
    Some(binary::NodeModules::Managed { .. }) | None => {
      root_path.join("node_modules")
    }
    Some(binary::NodeModules::Byonm { .. }) => root_path.clone(),
  };
  let static_files = metadata.static_assets_lookup(&root_path);

  // use a dummy npm registry url
  let npm_registry_url = ModuleSpecifier::parse("https://localhost/").unwrap();
  let npmrc = metadata.resolved_npmrc(&npm_registry_url)?;

  let deno_dir_provider = Arc::new(DenoDirProvider::new(None));
  let root_cert_store_provider = Arc::new(StandaloneRootCertStoreProvider {
    ca_stores: metadata.ca_stores.take(),
    ca_data: metadata.ca_data.take().map(CaData::Bytes),
    cell: Default::default(),
  });

  let http_client_provider = Arc::new(HttpClientProvider::new(
    Some(root_cert_store_provider.clone()),
    metadata.unsafely_ignore_certificate_errors.clone(),
  ));

  let (fs, vfs) = {
    let vfs = load_npm_vfs(
      Arc::new(eszip.clone()),
      root_node_modules_path.clone(),
      metadata.virtual_dir.take(),
    )
    .context("Failed to load npm vfs.")?;

    let fs = DenoCompileFileSystem::new(vfs).use_real_fs(false);
    let fs_backed_vfs = fs.file_backed_vfs().clone();

    (
      Arc::new(fs) as Arc<dyn deno::deno_fs::FileSystem>,
      fs_backed_vfs,
    )
  };

  let npm_cache_dir = Arc::new(NpmCacheDir::new(
    &DenoCacheEnvFsAdapter(fs.as_ref()),
    root_node_modules_path,
    npmrc.get_all_known_registries_urls(),
  ));

  let snapshot = eszip.take_npm_snapshot();
  let pkg_json_resolver = Arc::new(PackageJsonResolver::new(
    ext_node::DenoFsNodeResolverEnv::new(fs.clone()),
  ));
  let (in_npm_pkg_checker, npm_resolver) = match node_modules {
    Some(binary::NodeModules::Managed { .. }) | None => {
      let in_npm_pkg_checker =
        create_in_npm_pkg_checker(CreateInNpmPkgCheckerOptions::Managed(
          CliManagedInNpmPkgCheckerCreateOptions {
            root_cache_dir_url: npm_cache_dir.root_dir_url(),
            maybe_node_modules_path: None,
          },
        ));
      let npm_resolver =
        create_cli_npm_resolver(CliNpmResolverCreateOptions::Managed(
          CliManagedNpmResolverCreateOptions {
            snapshot: CliNpmResolverManagedSnapshotOption::Specified(
              snapshot.clone(),
            ),
            maybe_lockfile: None,
            fs: fs.clone(),
            http_client_provider,
            npm_cache_dir: npm_cache_dir.clone(),
            cache_setting: CacheSetting::Use,
            maybe_node_modules_path: None,
            npm_system_info: Default::default(),
            npm_install_deps_provider: Arc::new(
              // this is only used for installing packages, which isn't necessary
              // with deno compile
              NpmInstallDepsProvider::empty(),
            ),
            npmrc,
          },
        ))
        .await?;
      (in_npm_pkg_checker, npm_resolver)
    }
    Some(binary::NodeModules::Byonm {
      root_node_modules_dir,
    }) => {
      let root_node_modules_dir =
        root_node_modules_dir.map(|p| vfs.root().join(p));
      let in_npm_pkg_checker =
        create_in_npm_pkg_checker(CreateInNpmPkgCheckerOptions::Byonm);
      let npm_resolver = create_cli_npm_resolver(
        CliNpmResolverCreateOptions::Byonm(CliByonmNpmResolverCreateOptions {
          fs: CliDenoResolverFs(fs.clone()),
          pkg_json_resolver: pkg_json_resolver.clone(),
          root_node_modules_dir,
        }),
      )
      .await?;
      (in_npm_pkg_checker, npm_resolver)
    }
  };

  let node_resolver = Arc::new(NodeResolver::new(
    DenoFsNodeResolverEnv::new(fs.clone()),
    in_npm_pkg_checker.clone(),
    npm_resolver.clone().into_npm_pkg_folder_resolver(),
    pkg_json_resolver.clone(),
  ));

  let cjs_tracker = Arc::new(CjsTracker::new(
    in_npm_pkg_checker.clone(),
    pkg_json_resolver.clone(),
    IsCjsResolutionMode::ExplicitTypeCommonJs,
  ));

  let cache_db = Caches::new(deno_dir_provider.clone());
  let node_analysis_cache = NodeAnalysisCache::new(cache_db.node_analysis_db());
  let npm_req_resolver =
    Arc::new(CliNpmReqResolver::new(NpmReqResolverOptions {
      byonm_resolver: (npm_resolver.clone()).into_maybe_byonm(),
      fs: CliDenoResolverFs(fs.clone()),
      in_npm_pkg_checker: in_npm_pkg_checker.clone(),
      node_resolver: node_resolver.clone(),
      npm_req_resolver: npm_resolver.clone().into_npm_req_resolver(),
    }));

  let cjs_esm_code_analyzer = CliCjsCodeAnalyzer::new(
    node_analysis_cache,
    cjs_tracker.clone(),
    fs.clone(),
    None,
  );
  let node_code_translator = Arc::new(NodeCodeTranslator::new(
    cjs_esm_code_analyzer,
    DenoFsNodeResolverEnv::new(fs.clone()),
    in_npm_pkg_checker,
    node_resolver.clone(),
    npm_resolver.clone().into_npm_pkg_folder_resolver(),
    pkg_json_resolver.clone(),
  ));

  let serialized_workspace_resolver =
    metadata.serialized_workspace_resolver()?;

  let module_loader_factory = StandaloneModuleLoaderFactory {
    shared: Arc::new(SharedModuleLoaderState {
      root_path,
      eszip: WorkspaceEszip {
        eszip,
        root_dir_url: root_dir_url.clone(),
      },
      workspace_resolver: {
        let import_map = match serialized_workspace_resolver.import_map {
          Some(import_map) => Some(
            import_map::parse_from_json_with_options(
              root_dir_url.join(&import_map.specifier)?,
              &import_map.json,
              import_map::ImportMapOptions {
                address_hook: None,
                expand_imports: true,
              },
            )?
            .import_map,
          ),
          None => None,
        };
        let pkg_jsons = serialized_workspace_resolver
          .package_jsons
          .into_iter()
          .map(|(relative_path, json)| {
            let path =
              root_dir_url.join(&relative_path)?.to_file_path().map_err(
                |_| anyhow!("failed to convert to file path from url"),
              )?;
            let pkg_json =
              deno_package_json::PackageJson::load_from_value(path, json);
            Ok::<_, AnyError>(Arc::new(pkg_json))
          })
          .collect::<Result<_, _>>()?;
        WorkspaceResolver::new_raw(
          root_dir_url.clone(),
          import_map,
          serialized_workspace_resolver
            .jsr_pkgs
            .iter()
            .map(|it| {
              Ok::<_, AnyError>(ResolverWorkspaceJsrPackage {
                is_patch: false,
                base: root_dir_url
                  .join(&it.relative_base)
                  .with_context(|| "failed to parse base url")?,
                name: it.name.clone(),
                version: it.version.clone(),
                exports: it.exports.clone(),
              })
            })
            .collect::<Result<_, _>>()?,
          pkg_jsons,
          serialized_workspace_resolver.pkg_json_resolution,
        )
      },
      cjs_tracker: cjs_tracker.clone(),
      node_code_translator: node_code_translator.clone(),
      npm_module_loader: Arc::new(NpmModuleLoader::new(
        cjs_tracker.clone(),
        fs.clone(),
        node_code_translator,
      )),
      npm_req_resolver,
      npm_resolver: npm_resolver.clone(),
      node_resolver: node_resolver.clone(),
      vfs: vfs.clone(),
    }),
  };

  let module_loader = Rc::new(EmbeddedModuleLoader {
    shared: module_loader_factory.shared.clone(),
    include_source_map,
  });

  Ok(RuntimeProviders {
    migrated,
    module_loader: module_loader.clone(),
    node_services: NodeExtInitServices {
      node_require_loader: module_loader.clone(),
      node_resolver,
      npm_resolver: npm_resolver.into_npm_pkg_folder_resolver(),
      pkg_json_resolver,
    },
    npm_snapshot: snapshot,
    permissions: permissions_container,
    metadata,
    static_files,
    vfs_path: npm_cache_dir.root_dir().to_path_buf(),
    vfs,
    base_url: root_dir_url,
  })
}

pub async fn create_module_loader_for_standalone_from_eszip_kind(
  eszip_payload_kind: EszipPayloadKind,
  permissions_options: PermissionsOptions,
  include_source_map: bool,
  options: Option<MigrateOptions>,
) -> Result<RuntimeProviders, AnyError> {
  let eszip = migrate::try_migrate_if_needed(
    payload_to_eszip(eszip_payload_kind).await?,
    options,
  )
  .await?;

  create_module_loader_for_eszip(eszip, permissions_options, include_source_map)
    .await
}
