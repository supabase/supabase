use crate::args::jsr_url;
use crate::args::CacheSetting;
use crate::errors::get_error_class_name;
use crate::file_fetcher::FetchNoFollowOptions;
use crate::file_fetcher::FetchOptions;
use crate::file_fetcher::FetchPermissionsOptionRef;
use crate::file_fetcher::FileFetcher;
use crate::file_fetcher::FileOrRedirect;
use crate::util::fs::atomic_write_file_with_retries;
use crate::util::fs::atomic_write_file_with_retries_and_fs;
use crate::util::fs::AtomicWriteFileFsAdapter;

use deno_ast::MediaType;
use deno_core::futures;
use deno_core::futures::FutureExt;
use deno_core::ModuleSpecifier;
use deno_graph::source::CacheInfo;
use deno_graph::source::LoadFuture;
use deno_graph::source::LoadResponse;
use deno_graph::source::Loader;
use deno_permissions::PermissionsContainer;
use node_resolver::InNpmPackageChecker;
use std::borrow::Cow;
use std::collections::HashMap;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::SystemTime;

mod cache_db;
mod caches;
mod check;
mod common;
mod deno_dir;
mod disk_cache;
mod emit;
mod fast_check;
mod incremental;
mod module_info;
mod node;
mod parsed_source;

pub use cache_db::CacheDBHash;
pub use caches::Caches;
pub use check::TypeCheckCache;
pub use common::FastInsecureHasher;
pub use deno_dir::dirs::home_dir;
pub use deno_dir::DenoDir;
pub use deno_dir::DenoDirProvider;
pub use disk_cache::DiskCache;
pub use emit::EmitCache;
pub use fast_check::FastCheckCache;
pub use incremental::IncrementalCache;
pub use module_info::ModuleInfoCache;
pub use node::NodeAnalysisCache;
pub use parsed_source::ParsedSourceCache;

/// Permissions used to save a file in the disk caches.
pub const CACHE_PERM: u32 = 0o644;

#[derive(Debug, Clone)]
pub struct RealDenoCacheEnv;

impl deno_cache_dir::DenoCacheEnv for RealDenoCacheEnv {
  fn read_file_bytes(
    &self,
    path: &Path,
  ) -> std::io::Result<Cow<'static, [u8]>> {
    std::fs::read(path).map(Cow::Owned)
  }

  fn atomic_write_file(
    &self,
    path: &Path,
    bytes: &[u8],
  ) -> std::io::Result<()> {
    atomic_write_file_with_retries(path, bytes, CACHE_PERM)
  }

  fn canonicalize_path(
    &self,
    path: &Path,
  ) -> std::io::Result<std::path::PathBuf> {
    crate::util::fs::canonicalize_path(path)
  }

  fn create_dir_all(&self, path: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(path)
  }

  fn modified(&self, path: &Path) -> std::io::Result<Option<SystemTime>> {
    match std::fs::metadata(path) {
      Ok(metadata) => Ok(Some(
        metadata.modified().unwrap_or_else(|_| SystemTime::now()),
      )),
      Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(None),
      Err(err) => Err(err),
    }
  }

  fn is_file(&self, path: &Path) -> bool {
    path.is_file()
  }

  fn time_now(&self) -> SystemTime {
    SystemTime::now()
  }
}

#[derive(Debug, Clone)]
pub struct DenoCacheEnvFsAdapter<'a>(pub &'a dyn deno_fs::FileSystem);

impl<'a> deno_cache_dir::DenoCacheEnv for DenoCacheEnvFsAdapter<'a> {
  fn read_file_bytes(
    &self,
    path: &Path,
  ) -> std::io::Result<Cow<'static, [u8]>> {
    self
      .0
      .read_file_sync(path, None)
      .map_err(|err| err.into_io_error())
  }

  fn atomic_write_file(
    &self,
    path: &Path,
    bytes: &[u8],
  ) -> std::io::Result<()> {
    atomic_write_file_with_retries_and_fs(
      &AtomicWriteFileFsAdapter {
        fs: self.0,
        write_mode: CACHE_PERM,
      },
      path,
      bytes,
    )
  }

  fn canonicalize_path(&self, path: &Path) -> std::io::Result<PathBuf> {
    self.0.realpath_sync(path).map_err(|e| e.into_io_error())
  }

  fn create_dir_all(&self, path: &Path) -> std::io::Result<()> {
    self
      .0
      .mkdir_sync(path, true, None)
      .map_err(|e| e.into_io_error())
  }

  fn modified(&self, path: &Path) -> std::io::Result<Option<SystemTime>> {
    self
      .0
      .stat_sync(path)
      .map(|stat| {
        stat
          .mtime
          .map(|ts| SystemTime::UNIX_EPOCH + std::time::Duration::from_secs(ts))
      })
      .map_err(|e| e.into_io_error())
  }

  fn is_file(&self, path: &Path) -> bool {
    self.0.is_file_sync(path)
  }

  fn time_now(&self) -> SystemTime {
    SystemTime::now()
  }
}

pub type GlobalHttpCache = deno_cache_dir::GlobalHttpCache<RealDenoCacheEnv>;
pub type LocalHttpCache = deno_cache_dir::LocalHttpCache<RealDenoCacheEnv>;
pub type LocalLspHttpCache =
  deno_cache_dir::LocalLspHttpCache<RealDenoCacheEnv>;

pub struct FetchCacherOptions {
  pub file_header_overrides: HashMap<ModuleSpecifier, HashMap<String, String>>,
  pub permissions: PermissionsContainer,
  /// If we're publishing for `deno publish`.
  pub is_deno_publish: bool,
}

/// A "wrapper" for the FileFetcher and DiskCache for the Deno CLI that provides
/// a concise interface to the DENO_DIR when building module graphs.
pub struct FetchCacher {
  pub file_header_overrides: HashMap<ModuleSpecifier, HashMap<String, String>>,
  file_fetcher: Arc<FileFetcher>,
  fs: Arc<dyn deno_fs::FileSystem>,
  global_http_cache: Arc<GlobalHttpCache>,
  in_npm_pkg_checker: Arc<dyn InNpmPackageChecker>,
  module_info_cache: Arc<ModuleInfoCache>,
  permissions: PermissionsContainer,
  is_deno_publish: bool,
  cache_info_enabled: bool,
}

impl FetchCacher {
  pub fn new(
    file_fetcher: Arc<FileFetcher>,
    fs: Arc<dyn deno_fs::FileSystem>,
    global_http_cache: Arc<GlobalHttpCache>,
    in_npm_pkg_checker: Arc<dyn InNpmPackageChecker>,
    module_info_cache: Arc<ModuleInfoCache>,
    options: FetchCacherOptions,
  ) -> Self {
    Self {
      file_fetcher,
      fs,
      global_http_cache,
      in_npm_pkg_checker,
      module_info_cache,
      file_header_overrides: options.file_header_overrides,
      permissions: options.permissions,
      is_deno_publish: options.is_deno_publish,
      cache_info_enabled: false,
    }
  }

  /// The cache information takes a bit of time to fetch and it's
  /// not always necessary. It should only be enabled for deno info.
  pub fn enable_loading_cache_info(&mut self) {
    self.cache_info_enabled = true;
  }

  /// Only use this for `deno info`.
  fn get_local_path(&self, specifier: &ModuleSpecifier) -> Option<PathBuf> {
    // TODO(@kitsonk) fix when deno_graph does not query cache for synthetic
    // modules
    if specifier.scheme() == "flags" {
      None
    } else if specifier.scheme() == "file" {
      specifier.to_file_path().ok()
    } else {
      #[allow(deprecated)]
      self
        .global_http_cache
        .get_global_cache_filepath(specifier)
        .ok()
    }
  }
}

impl Loader for FetchCacher {
  fn get_cache_info(&self, specifier: &ModuleSpecifier) -> Option<CacheInfo> {
    if !self.cache_info_enabled {
      return None;
    }

    #[allow(deprecated)]
    let local = self.get_local_path(specifier)?;
    if local.is_file() {
      Some(CacheInfo { local: Some(local) })
    } else {
      None
    }
  }

  fn load(
    &self,
    specifier: &ModuleSpecifier,
    options: deno_graph::source::LoadOptions,
  ) -> LoadFuture {
    use deno_graph::source::CacheSetting as LoaderCacheSetting;

    if specifier.scheme() == "file"
      && specifier.path().contains("/node_modules/")
    {
      // The specifier might be in a completely different symlinked tree than
      // what the node_modules url is in (ex. `/my-project-1/node_modules`
      // symlinked to `/my-project-2/node_modules`), so first we checked if the path
      // is in a node_modules dir to avoid needlessly canonicalizing, then now compare
      // against the canonicalized specifier.
      let specifier = crate::node::resolve_specifier_into_node_modules(
        specifier,
        self.fs.as_ref(),
      );
      if self.in_npm_pkg_checker.in_npm_package(&specifier) {
        return Box::pin(futures::future::ready(Ok(Some(
          LoadResponse::External { specifier },
        ))));
      }
    }

    if self.is_deno_publish
      && matches!(specifier.scheme(), "http" | "https")
      && !specifier.as_str().starts_with(jsr_url().as_str())
    {
      // mark non-JSR remote modules as external so we don't need --allow-import
      // permissions as these will error out later when publishing
      return Box::pin(futures::future::ready(Ok(Some(
        LoadResponse::External {
          specifier: specifier.clone(),
        },
      ))));
    }

    let file_fetcher = self.file_fetcher.clone();
    let file_header_overrides = self.file_header_overrides.clone();
    let permissions = self.permissions.clone();
    let specifier = specifier.clone();
    let is_statically_analyzable = !options.was_dynamic_root;

    async move {
      let maybe_cache_setting = match options.cache_setting {
        LoaderCacheSetting::Use => None,
        LoaderCacheSetting::Reload => {
          if matches!(file_fetcher.cache_setting(), CacheSetting::Only) {
            return Err(deno_core::anyhow::anyhow!(
              "Could not resolve version constraint using only cached data. Try running again without --cached-only"
            ));
          }
          Some(CacheSetting::ReloadAll)
        }
        LoaderCacheSetting::Only => Some(CacheSetting::Only),
      };
      file_fetcher
        .fetch_no_follow_with_options(FetchNoFollowOptions {
          fetch_options: FetchOptions {
            specifier: &specifier,
            permissions: if is_statically_analyzable {
              FetchPermissionsOptionRef::StaticContainer(&permissions)
            } else {
              FetchPermissionsOptionRef::DynamicContainer(&permissions)
            },
            maybe_auth: None,
            maybe_accept: None,
            maybe_cache_setting: maybe_cache_setting.as_ref(),
          },
          maybe_checksum: options.maybe_checksum.as_ref(),
        })
        .await
        .map(|file_or_redirect| {
          match file_or_redirect {
            FileOrRedirect::File(file) => {
              let maybe_headers =
              match (file.maybe_headers, file_header_overrides.get(&specifier)) {
                (Some(headers), Some(overrides)) => {
                  Some(headers.into_iter().chain(overrides.clone()).collect())
                }
                (Some(headers), None) => Some(headers),
                (None, Some(overrides)) => Some(overrides.clone()),
                (None, None) => None,
              };
            Ok(Some(LoadResponse::Module {
              specifier: file.specifier,
              maybe_headers,
              content: file.source,
            }))
            },
            FileOrRedirect::Redirect(redirect_specifier) => {
              Ok(Some(LoadResponse::Redirect {
                specifier: redirect_specifier,
              }))
            },
          }
        })
        .unwrap_or_else(|err| {
          if let Some(io_err) = err.downcast_ref::<std::io::Error>() {
            if io_err.kind() == std::io::ErrorKind::NotFound {
              return Ok(None);
            } else {
              return Err(err);
            }
          }
          let error_class_name = get_error_class_name(&err);
          match error_class_name {
            "NotFound" => Ok(None),
            "NotCached" if options.cache_setting == LoaderCacheSetting::Only => Ok(None),
            _ => Err(err),
          }
        })
    }
    .boxed_local()
  }

  fn cache_module_info(
    &self,
    specifier: &ModuleSpecifier,
    media_type: MediaType,
    source: &Arc<[u8]>,
    module_info: &deno_graph::ModuleInfo,
  ) {
    log::debug!("Caching module info for {}", specifier);
    let source_hash = CacheDBHash::from_source(source);
    let result = self.module_info_cache.set_module_info(
      specifier,
      media_type,
      source_hash,
      module_info,
    );
    if let Err(err) = result {
      log::debug!(
        "Error saving module cache info for {}. {:#}",
        specifier,
        err
      );
    }
  }
}
