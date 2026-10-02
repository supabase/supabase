// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use crate::args::CacheSetting;
use crate::auth_tokens::AuthTokens;
use crate::http_util::CacheSemantics;
use crate::http_util::FetchOnceArgs;
use crate::http_util::FetchOnceResult;
use crate::http_util::HttpClientProvider;

use deno_ast::MediaType;
use deno_cache_dir::HttpCache;
use deno_core::error::custom_error;
use deno_core::error::generic_error;
use deno_core::error::uri_error;
use deno_core::error::AnyError;
use deno_core::parking_lot::Mutex;
use deno_core::url::Url;
use deno_core::ModuleSpecifier;
use deno_graph::source::LoaderChecksum;
use deno_path_util::url_to_file_path;
use deno_permissions::PermissionsContainer;
use deno_web::BlobStore;

use anyhow::Context;
use http::header;
use log::debug;

use std::borrow::Cow;
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::SystemTime;

pub const SUPPORTED_SCHEMES: [&str; 5] =
  ["data", "blob", "file", "http", "https"];

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct TextDecodedFile {
  pub media_type: MediaType,
  /// The _final_ specifier for the file.  The requested specifier and the final
  /// specifier maybe different for remote files that have been redirected.
  pub specifier: ModuleSpecifier,
  /// The source of the file.
  pub source: Arc<str>,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum FileOrRedirect {
  File(File),
  Redirect(ModuleSpecifier),
}

impl FileOrRedirect {
  fn from_deno_cache_entry(
    specifier: &ModuleSpecifier,
    cache_entry: deno_cache_dir::CacheEntry,
  ) -> Result<Self, AnyError> {
    if let Some(redirect_to) = cache_entry.metadata.headers.get("location") {
      let redirect = specifier.join(redirect_to)?;
      Ok(FileOrRedirect::Redirect(redirect))
    } else {
      Ok(FileOrRedirect::File(File {
        specifier: specifier.clone(),
        maybe_headers: Some(cache_entry.metadata.headers),
        source: Arc::from(cache_entry.content),
      }))
    }
  }
}

/// A structure representing a source file.
#[derive(Debug, Clone, Eq, PartialEq)]
pub struct File {
  /// The _final_ specifier for the file.  The requested specifier and the final
  /// specifier maybe different for remote files that have been redirected.
  pub specifier: ModuleSpecifier,
  pub maybe_headers: Option<HashMap<String, String>>,
  /// The source of the file.
  pub source: Arc<[u8]>,
}

impl File {
  pub fn resolve_media_type_and_charset(&self) -> (MediaType, Option<&str>) {
    deno_graph::source::resolve_media_type_and_charset_from_headers(
      &self.specifier,
      self.maybe_headers.as_ref(),
    )
  }

  /// Decodes the source bytes into a string handling any encoding rules
  /// for local vs remote files and dealing with the charset.
  pub fn into_text_decoded(self) -> Result<TextDecodedFile, AnyError> {
    // lots of borrow checker fighting here
    let (media_type, maybe_charset) =
      deno_graph::source::resolve_media_type_and_charset_from_headers(
        &self.specifier,
        self.maybe_headers.as_ref(),
      );
    let specifier = self.specifier;
    match deno_graph::source::decode_source(
      &specifier,
      self.source,
      maybe_charset,
    ) {
      Ok(source) => Ok(TextDecodedFile {
        media_type,
        specifier,
        source,
      }),
      Err(err) => {
        Err(err).with_context(|| format!("Failed decoding \"{}\".", specifier))
      }
    }
  }
}

#[derive(Debug, Clone, Default)]
struct MemoryFiles(Arc<Mutex<HashMap<ModuleSpecifier, File>>>);

impl MemoryFiles {
  pub fn get(&self, specifier: &ModuleSpecifier) -> Option<File> {
    self.0.lock().get(specifier).cloned()
  }

  pub fn insert(&self, specifier: ModuleSpecifier, file: File) -> Option<File> {
    self.0.lock().insert(specifier, file)
  }

  pub fn clear(&self) {
    self.0.lock().clear();
  }
}

/// Fetch a source file from the local file system.
fn fetch_local(specifier: &ModuleSpecifier) -> Result<File, AnyError> {
  let local = url_to_file_path(specifier).map_err(|_| {
    uri_error(format!("Invalid file path.\n  Specifier: {specifier}"))
  })?;
  // If it doesnt have a extension, we want to treat it as typescript by default
  let headers = if local.extension().is_none() {
    Some(HashMap::from([(
      "content-type".to_string(),
      "application/typescript".to_string(),
    )]))
  } else {
    None
  };
  let bytes = fs::read(local)?;

  Ok(File {
    specifier: specifier.clone(),
    maybe_headers: headers,
    source: bytes.into(),
  })
}

/// Return a validated scheme for a given module specifier.
fn get_validated_scheme(
  specifier: &ModuleSpecifier,
) -> Result<String, AnyError> {
  let scheme = specifier.scheme();
  if !SUPPORTED_SCHEMES.contains(&scheme) {
    // NOTE(bartlomieju): this message list additional `npm` and `jsr` schemes, but they should actually be handled
    // before `file_fetcher.rs` APIs are even hit.
    let mut all_supported_schemes = SUPPORTED_SCHEMES.to_vec();
    all_supported_schemes.extend_from_slice(&["npm", "jsr"]);
    all_supported_schemes.sort();
    let scheme_list = all_supported_schemes
      .iter()
      .map(|scheme| format!(" - \"{}\"", scheme))
      .collect::<Vec<_>>()
      .join("\n");
    Err(generic_error(format!(
      "Unsupported scheme \"{scheme}\" for module \"{specifier}\". Supported schemes:\n{}",
      scheme_list
    )))
  } else {
    Ok(scheme.to_string())
  }
}

#[derive(Debug, Copy, Clone)]
pub enum FetchPermissionsOptionRef<'a> {
  AllowAll,
  DynamicContainer(&'a PermissionsContainer),
  StaticContainer(&'a PermissionsContainer),
}

pub struct FetchOptions<'a> {
  pub specifier: &'a ModuleSpecifier,
  pub permissions: FetchPermissionsOptionRef<'a>,
  pub maybe_auth: Option<(header::HeaderName, header::HeaderValue)>,
  pub maybe_accept: Option<&'a str>,
  pub maybe_cache_setting: Option<&'a CacheSetting>,
}

pub struct FetchNoFollowOptions<'a> {
  pub fetch_options: FetchOptions<'a>,
  /// This setting doesn't make sense to provide for `FetchOptions`
  /// since the required checksum may change for a redirect.
  pub maybe_checksum: Option<&'a LoaderChecksum>,
}

/// A structure for resolving, fetching and caching source files.
#[derive(Debug)]
pub struct FileFetcher {
  auth_tokens: AuthTokens,
  allow_remote: bool,
  memory_files: MemoryFiles,
  cache_setting: CacheSetting,
  http_cache: Arc<dyn HttpCache>,
  http_client_provider: Arc<HttpClientProvider>,
  blob_store: Arc<BlobStore>,
  download_log_level: log::Level,
}

impl FileFetcher {
  pub fn new(
    http_cache: Arc<dyn HttpCache>,
    cache_setting: CacheSetting,
    allow_remote: bool,
    http_client_provider: Arc<HttpClientProvider>,
    blob_store: Arc<BlobStore>,
  ) -> Self {
    Self {
      auth_tokens: AuthTokens::new(env::var("DENO_AUTH_TOKENS").ok()),
      allow_remote,
      memory_files: Default::default(),
      cache_setting,
      http_cache,
      http_client_provider,
      blob_store,
      download_log_level: log::Level::Info,
    }
  }

  pub fn cache_setting(&self) -> &CacheSetting {
    &self.cache_setting
  }

  /// Sets the log level to use when outputting the download message.
  pub fn set_download_log_level(&mut self, level: log::Level) {
    self.download_log_level = level;
  }

  /// Fetch cached remote file.
  ///
  /// This is a recursive operation if source file has redirections.
  pub fn fetch_cached(
    &self,
    specifier: &ModuleSpecifier,
    redirect_limit: i64,
  ) -> Result<Option<File>, AnyError> {
    let mut specifier = Cow::Borrowed(specifier);
    for _ in 0..=redirect_limit {
      match self.fetch_cached_no_follow(&specifier, None)? {
        Some(FileOrRedirect::File(file)) => {
          return Ok(Some(file));
        }
        Some(FileOrRedirect::Redirect(redirect_specifier)) => {
          specifier = Cow::Owned(redirect_specifier);
        }
        None => {
          return Ok(None);
        }
      }
    }
    Err(custom_error("Http", "Too many redirects."))
  }

  fn fetch_cached_no_follow(
    &self,
    specifier: &ModuleSpecifier,
    maybe_checksum: Option<&LoaderChecksum>,
  ) -> Result<Option<FileOrRedirect>, AnyError> {
    debug!(
      "FileFetcher::fetch_cached_no_follow - specifier: {}",
      specifier
    );

    let cache_key = self.http_cache.cache_item_key(specifier)?; // compute this once
    let result = self.http_cache.get(
      &cache_key,
      maybe_checksum
        .as_ref()
        .map(|c| deno_cache_dir::Checksum::new(c.as_str())),
    );
    match result {
      Ok(Some(cache_data)) => Ok(Some(FileOrRedirect::from_deno_cache_entry(
        specifier, cache_data,
      )?)),
      Ok(None) => Ok(None),
      Err(err) => match err {
        deno_cache_dir::CacheReadFileError::Io(err) => Err(err.into()),
        deno_cache_dir::CacheReadFileError::ChecksumIntegrity(err) => {
          // convert to the equivalent deno_graph error so that it
          // enhances it if this is passed to deno_graph
          Err(
            deno_graph::source::ChecksumIntegrityError {
              actual: err.actual,
              expected: err.expected,
            }
            .into(),
          )
        }
      },
    }
  }

  /// Convert a data URL into a file, resulting in an error if the URL is
  /// invalid.
  fn fetch_data_url(
    &self,
    specifier: &ModuleSpecifier,
  ) -> Result<File, AnyError> {
    debug!("FileFetcher::fetch_data_url() - specifier: {}", specifier);
    let data_url = deno_graph::source::RawDataUrl::parse(specifier)?;
    let (bytes, headers) = data_url.into_bytes_and_headers();
    Ok(File {
      specifier: specifier.clone(),
      maybe_headers: Some(headers),
      source: Arc::from(bytes),
    })
  }

  /// Get a blob URL.
  async fn fetch_blob_url(
    &self,
    specifier: &ModuleSpecifier,
  ) -> Result<File, AnyError> {
    debug!("FileFetcher::fetch_blob_url() - specifier: {}", specifier);
    let blob = self
      .blob_store
      .get_object_url(specifier.clone())
      .ok_or_else(|| {
        custom_error(
          "NotFound",
          format!("Blob URL not found: \"{specifier}\"."),
        )
      })?;

    let bytes = blob.read_all().await;
    let headers =
      HashMap::from([("content-type".to_string(), blob.media_type.clone())]);

    Ok(File {
      specifier: specifier.clone(),
      maybe_headers: Some(headers),
      source: Arc::from(bytes),
    })
  }

  async fn fetch_remote_no_follow(
    &self,
    specifier: &ModuleSpecifier,
    maybe_accept: Option<&str>,
    cache_setting: &CacheSetting,
    maybe_checksum: Option<&LoaderChecksum>,
    maybe_auth: Option<(header::HeaderName, header::HeaderValue)>,
  ) -> Result<FileOrRedirect, AnyError> {
    debug!(
      "FileFetcher::fetch_remote_no_follow - specifier: {}",
      specifier
    );

    if self.should_use_cache(specifier, cache_setting) {
      if let Some(file_or_redirect) =
        self.fetch_cached_no_follow(specifier, maybe_checksum)?
      {
        return Ok(file_or_redirect);
      }
    }

    if *cache_setting == CacheSetting::Only {
      return Err(custom_error(
        "NotCached",
        format!(
          "Specifier not found in cache: \"{specifier}\", --cached-only is specified."
        ),
      ));
    }

    let maybe_etag_cache_entry = self
      .http_cache
      .cache_item_key(specifier)
      .ok()
      .and_then(|key| {
        self
          .http_cache
          .get(
            &key,
            maybe_checksum
              .as_ref()
              .map(|c| deno_cache_dir::Checksum::new(c.as_str())),
          )
          .ok()
          .flatten()
      })
      .and_then(|cache_entry| {
        cache_entry
          .metadata
          .headers
          .get("etag")
          .cloned()
          .map(|etag| (cache_entry, etag))
      });
    let maybe_auth_token = self.auth_tokens.get(specifier);

    async fn handle_request_or_server_error(
      retried: &mut bool,
      specifier: &Url,
      err_str: String,
    ) -> Result<(), AnyError> {
      // Retry once, and bail otherwise.
      if !*retried {
        *retried = true;
        log::debug!("Import '{}' failed: {}. Retrying...", specifier, err_str);
        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
        Ok(())
      } else {
        Err(generic_error(format!(
          "Import '{}' failed: {}",
          specifier, err_str
        )))
      }
    }

    let mut retried = false; // retry intermittent failures
    let result = loop {
      let result = match self
        .http_client_provider
        .get_or_create()?
        .fetch_no_follow(FetchOnceArgs {
          url: specifier.clone(),
          maybe_accept: maybe_accept.map(ToOwned::to_owned),
          maybe_etag: maybe_etag_cache_entry
            .as_ref()
            .map(|(_, etag)| etag.clone()),
          maybe_auth_token: maybe_auth_token.clone(),
          maybe_auth: maybe_auth.clone(),
        })
        .await?
      {
        FetchOnceResult::NotModified => {
          let (cache_entry, _) = maybe_etag_cache_entry.unwrap();
          FileOrRedirect::from_deno_cache_entry(specifier, cache_entry)
        }
        FetchOnceResult::Redirect(redirect_url, headers) => {
          self.http_cache.set(specifier, headers, &[])?;
          Ok(FileOrRedirect::Redirect(redirect_url))
        }
        FetchOnceResult::Code(bytes, headers) => {
          self.http_cache.set(specifier, headers.clone(), &bytes)?;
          if let Some(checksum) = &maybe_checksum {
            checksum.check_source(&bytes)?;
          }
          Ok(FileOrRedirect::File(File {
            specifier: specifier.clone(),
            maybe_headers: Some(headers),
            source: Arc::from(bytes),
          }))
        }
        FetchOnceResult::RequestError(err) => {
          handle_request_or_server_error(&mut retried, specifier, err).await?;
          continue;
        }
        FetchOnceResult::ServerError(status) => {
          handle_request_or_server_error(
            &mut retried,
            specifier,
            status.to_string(),
          )
          .await?;
          continue;
        }
      };
      break result;
    };

    #[allow(clippy::let_and_return)]
    result
  }

  /// Returns if the cache should be used for a given specifier.
  fn should_use_cache(
    &self,
    specifier: &ModuleSpecifier,
    cache_setting: &CacheSetting,
  ) -> bool {
    match cache_setting {
      CacheSetting::ReloadAll => false,
      CacheSetting::Use | CacheSetting::Only => true,
      CacheSetting::RespectHeaders => {
        let Ok(cache_key) = self.http_cache.cache_item_key(specifier) else {
          return false;
        };
        let Ok(Some(headers)) = self.http_cache.read_headers(&cache_key) else {
          return false;
        };
        let Ok(Some(download_time)) =
          self.http_cache.read_download_time(&cache_key)
        else {
          return false;
        };
        let cache_semantics =
          CacheSemantics::new(headers, download_time, SystemTime::now());
        cache_semantics.should_use()
      }
      CacheSetting::ReloadSome(list) => {
        let mut url = specifier.clone();
        url.set_fragment(None);
        if list.iter().any(|x| x == url.as_str()) {
          return false;
        }
        url.set_query(None);
        let mut path = PathBuf::from(url.as_str());
        loop {
          if list.contains(&path.to_str().unwrap().to_string()) {
            return false;
          }
          if !path.pop() {
            break;
          }
        }
        true
      }
    }
  }

  #[inline(always)]
  pub async fn fetch_bypass_permissions(
    &self,
    specifier: &ModuleSpecifier,
  ) -> Result<File, AnyError> {
    self
      .fetch_inner(specifier, None, FetchPermissionsOptionRef::AllowAll)
      .await
  }

  #[inline(always)]
  pub async fn fetch_bypass_permissions_with_maybe_auth(
    &self,
    specifier: &ModuleSpecifier,
    maybe_auth: Option<(header::HeaderName, header::HeaderValue)>,
  ) -> Result<File, AnyError> {
    self
      .fetch_inner(specifier, maybe_auth, FetchPermissionsOptionRef::AllowAll)
      .await
  }

  /// Fetch a source file and asynchronously return it.
  #[inline(always)]
  pub async fn fetch(
    &self,
    specifier: &ModuleSpecifier,
    permissions: &PermissionsContainer,
  ) -> Result<File, AnyError> {
    self
      .fetch_inner(
        specifier,
        None,
        FetchPermissionsOptionRef::StaticContainer(permissions),
      )
      .await
  }

  async fn fetch_inner(
    &self,
    specifier: &ModuleSpecifier,
    maybe_auth: Option<(header::HeaderName, header::HeaderValue)>,
    permissions: FetchPermissionsOptionRef<'_>,
  ) -> Result<File, AnyError> {
    self
      .fetch_with_options(FetchOptions {
        specifier,
        permissions,
        maybe_auth,
        maybe_accept: None,
        maybe_cache_setting: None,
      })
      .await
  }

  pub async fn fetch_with_options(
    &self,
    options: FetchOptions<'_>,
  ) -> Result<File, AnyError> {
    self.fetch_with_options_and_max_redirect(options, 10).await
  }

  async fn fetch_with_options_and_max_redirect(
    &self,
    options: FetchOptions<'_>,
    max_redirect: usize,
  ) -> Result<File, AnyError> {
    let mut specifier = Cow::Borrowed(options.specifier);
    let mut maybe_auth = options.maybe_auth.clone();
    for _ in 0..=max_redirect {
      match self
        .fetch_no_follow_with_options(FetchNoFollowOptions {
          fetch_options: FetchOptions {
            specifier: &specifier,
            permissions: options.permissions,
            maybe_auth: maybe_auth.clone(),
            maybe_accept: options.maybe_accept,
            maybe_cache_setting: options.maybe_cache_setting,
          },
          maybe_checksum: None,
        })
        .await?
      {
        FileOrRedirect::File(file) => {
          return Ok(file);
        }
        FileOrRedirect::Redirect(redirect_specifier) => {
          // If we were redirected to another origin, don't send the auth header anymore.
          if redirect_specifier.origin() != specifier.origin() {
            maybe_auth = None;
          }
          specifier = Cow::Owned(redirect_specifier);
        }
      }
    }

    Err(custom_error("Http", "Too many redirects."))
  }

  /// Fetches without following redirects.
  pub async fn fetch_no_follow_with_options(
    &self,
    options: FetchNoFollowOptions<'_>,
  ) -> Result<FileOrRedirect, AnyError> {
    let maybe_checksum = options.maybe_checksum;
    let options = options.fetch_options;
    let specifier = options.specifier;
    // note: this debug output is used by the tests
    debug!(
      "FileFetcher::fetch_no_follow_with_options - specifier: {}",
      specifier
    );
    let scheme = get_validated_scheme(specifier)?;
    match options.permissions {
      FetchPermissionsOptionRef::AllowAll => {
        // allow
      }
      FetchPermissionsOptionRef::StaticContainer(permissions) => {
        permissions.check_specifier(
          specifier,
          deno_permissions::CheckSpecifierKind::Static,
        )?;
      }
      FetchPermissionsOptionRef::DynamicContainer(permissions) => {
        permissions.check_specifier(
          specifier,
          deno_permissions::CheckSpecifierKind::Dynamic,
        )?;
      }
    }
    if let Some(file) = self.memory_files.get(specifier) {
      Ok(FileOrRedirect::File(file))
    } else if scheme == "file" {
      // we do not in memory cache files, as this would prevent files on the
      // disk changing effecting things like workers and dynamic imports.
      fetch_local(specifier).map(FileOrRedirect::File)
    } else if scheme == "data" {
      self.fetch_data_url(specifier).map(FileOrRedirect::File)
    } else if scheme == "blob" {
      self
        .fetch_blob_url(specifier)
        .await
        .map(FileOrRedirect::File)
    } else if !self.allow_remote {
      Err(custom_error(
        "NoRemote",
        format!("A remote specifier was requested: \"{specifier}\", but --no-remote is specified."),
      ))
    } else {
      self
        .fetch_remote_no_follow(
          specifier,
          options.maybe_accept,
          options.maybe_cache_setting.unwrap_or(&self.cache_setting),
          maybe_checksum,
          options.maybe_auth,
        )
        .await
    }
  }

  /// A synchronous way to retrieve a source file, where if the file has already
  /// been cached in memory it will be returned, otherwise for local files will
  /// be read from disk.
  pub fn get_source(&self, specifier: &ModuleSpecifier) -> Option<File> {
    let maybe_file = self.memory_files.get(specifier);
    if maybe_file.is_none() {
      let is_local = specifier.scheme() == "file";
      if is_local {
        if let Ok(file) = fetch_local(specifier) {
          return Some(file);
        }
      }
      None
    } else {
      maybe_file
    }
  }

  /// Insert a temporary module for the file fetcher.
  pub fn insert_memory_files(&self, file: File) -> Option<File> {
    self.memory_files.insert(file.specifier.clone(), file)
  }

  pub fn clear_memory_files(&self) {
    self.memory_files.clear();
  }
}
