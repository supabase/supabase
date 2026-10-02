use core::slice;
use std::borrow::Cow;
use std::cell::RefCell;
use std::ffi::OsStr;
use std::fmt::Debug;
use std::io;
use std::io::Cursor;
use std::mem;
use std::os::fd::AsRawFd;
use std::path::Path;
use std::path::PathBuf;
use std::pin::Pin;
use std::rc::Rc;
use std::sync::Arc;
use std::time::Duration;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;

use anyhow::anyhow;
use anyhow::Context;
use aws_config::retry::RetryConfig;
use aws_config::AppName;
use aws_config::BehaviorVersion;
use aws_config::Region;
use aws_credential_types::credential_fn::provide_credentials_fn;
use aws_credential_types::Credentials;
use aws_sdk_s3::config::SharedCredentialsProvider;
use aws_sdk_s3::config::SharedHttpClient;
use aws_sdk_s3::error::ProvideErrorMetadata;
use aws_sdk_s3::error::SdkError;
use aws_sdk_s3::operation::head_object::HeadObjectError;
use aws_sdk_s3::operation::upload_part::UploadPartError;
use aws_sdk_s3::operation::upload_part::UploadPartOutput;
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::primitives::DateTime;
use aws_sdk_s3::types::CompletedMultipartUpload;
use aws_sdk_s3::types::CompletedPart;
use aws_sdk_s3::types::Delete;
use aws_sdk_s3::types::ObjectIdentifier;
use aws_sdk_s3::Config;
use aws_smithy_runtime::client::http::hyper_014::HyperClientBuilder;
use aws_smithy_runtime_api::client::orchestrator::HttpResponse;
use deno_core::AsyncRefCell;
use deno_core::BufMutView;
use deno_core::BufView;
use deno_core::RcRef;
use deno_core::ResourceHandleFd;
use deno_core::WriteOutcome;
use deno_fs::AccessCheckCb;
use deno_fs::FsDirEntry;
use deno_fs::FsFileType;
use deno_fs::OpenOptions;
use deno_io::fs::File;
use deno_io::fs::FsError;
use deno_io::fs::FsResult;
use deno_io::fs::FsStat;
use either::Either;
use enum_as_inner::EnumAsInner;
use futures::future::BoxFuture;
use futures::future::LocalBoxFuture;
use futures::future::Shared;
use futures::io::AllowStdIo;
use futures::stream::FuturesUnordered;
use futures::AsyncWriteExt;
use futures::FutureExt;
use futures::StreamExt;
use futures::TryFutureExt;
use memmap2::MmapOptions;
use memmap2::MmapRaw;
use once_cell::sync::OnceCell;
use serde::Deserialize;
use serde::Serialize;
use tempfile::tempfile;
use tokio::io::AsyncBufRead;
use tokio::io::AsyncReadExt;
use tokio::sync::RwLock;
use tokio::task::JoinError;
use tracing::debug;
use tracing::error;
use tracing::info_span;
use tracing::instrument;
use tracing::trace;
use tracing::trace_span;
use tracing::warn;
use tracing::Instrument;

use crate::rt;

use super::TryNormalizePath;

const MIN_PART_SIZE: usize = 1024 * 1024 * 5;

type BackgroundTask = Shared<BoxFuture<'static, Result<(), Arc<JoinError>>>>;

#[derive(Debug, Clone)]
pub struct S3Fs {
  client: aws_sdk_s3::Client,
  background_tasks: Arc<RwLock<FuturesUnordered<BackgroundTask>>>,

  #[allow(unused)]
  config: Arc<S3FsConfig>,
}

impl S3Fs {
  pub async fn flush_background_tasks(&self) {
    if self.background_tasks.read().await.is_empty() {
      return;
    }

    let mut background_tasks = self.background_tasks.write().await;

    loop {
      if background_tasks.next().await.is_none() {
        break;
      }
    }
  }

  async fn open_inner<'a>(
    &'a self,
    path: PathBuf,
    options: OpenOptions,
    _access_check: Option<AccessCheckCb<'a>>,
  ) -> FsResult<Rc<S3Object>> {
    self.flush_background_tasks().await;

    let (bucket_name, key) =
      try_get_bucket_name_and_key(path.try_normalize()?)?;

    if key.is_empty() {
      return Err(FsError::Io(io::Error::from(io::ErrorKind::InvalidInput)));
    }

    let resp = self
      .client
      .head_object()
      .bucket(&bucket_name)
      .key(&key)
      .send()
      .await;

    let mut not_found = false;

    if let Some(err) = resp.err() {
      not_found = err
        .as_service_error()
        .map(|it| it.is_not_found())
        .unwrap_or_default();

      if not_found {
        if !(options.create || options.create_new) {
          return Err(FsError::Io(io::Error::from(io::ErrorKind::NotFound)));
        }
      } else {
        return Err(FsError::Io(io::Error::other(err)));
      }
    }

    let file = Rc::new(S3Object {
      bucket_name,
      key,
      fs: self.clone(),
      op_slot: AsyncRefCell::default(),
    });

    if not_found || options.truncate {
      file.clone().write(BufView::empty()).await?;
    } else if options.create_new {
      return Err(FsError::Io(io::Error::from(io::ErrorKind::AlreadyExists)));
    }

    Ok(file)
  }
}

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct S3CredentialsObject {
  access_key_id: Cow<'static, str>,
  secret_access_key: Cow<'static, str>,
  session_token: Option<Cow<'static, str>>,
  expires_after: Option<u64>,
}

impl S3CredentialsObject {
  fn into_credentials(self) -> Credentials {
    Credentials::new(
      self.access_key_id,
      self.secret_access_key,
      self.session_token.map(|it| it.to_string()),
      self
        .expires_after
        .map(Duration::from_secs)
        .map(|it| UNIX_EPOCH + it),
      "EdgeRuntime",
    )
  }
}

#[derive(Deserialize, Serialize, Debug, Default, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum RetryMode {
  #[default]
  Standard,
  Adaptive,
}

impl RetryMode {
  fn to_aws_retry_config_builder(
    self,
  ) -> aws_config::retry::RetryConfigBuilder {
    use aws_config::retry::*;

    RetryConfigBuilder::new().mode(match self {
      Self::Standard => RetryMode::Standard,
      Self::Adaptive => RetryMode::Adaptive,
    })
  }
}

#[derive(Deserialize, Serialize, Debug, Default, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum ReconnectMode {
  #[default]
  ReconnectOnTransientError,
  ReuseAllConnections,
}

impl ReconnectMode {
  fn to_s3(self) -> aws_sdk_s3::config::retry::ReconnectMode {
    match self {
      Self::ReconnectOnTransientError => {
        aws_sdk_s3::config::retry::ReconnectMode::ReconnectOnTransientError
      }
      Self::ReuseAllConnections => {
        aws_sdk_s3::config::retry::ReconnectMode::ReuseAllConnections
      }
    }
  }
}

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct S3ClientRetryConfig {
  mode: RetryMode,
  max_attempts: Option<u32>,
  initial_backoff_sec: Option<u64>,
  max_backoff_sec: Option<u64>,
  reconnect_mode: Option<ReconnectMode>,
  use_static_exponential_base: Option<bool>,
}

impl S3ClientRetryConfig {
  fn into_aws_retry_config(self) -> RetryConfig {
    self
      .mode
      .to_aws_retry_config_builder()
      .max_attempts(self.max_attempts.unwrap_or(3))
      .initial_backoff(
        self
          .initial_backoff_sec
          .map(Duration::from_secs)
          .unwrap_or(Duration::from_secs(1)),
      )
      .max_backoff(
        self
          .max_backoff_sec
          .map(Duration::from_secs)
          .unwrap_or(Duration::from_secs(20)),
      )
      .reconnect_mode(self.reconnect_mode.unwrap_or_default().to_s3())
      .build()
      .with_use_static_exponential_base(
        self.use_static_exponential_base.unwrap_or_default(),
      )
  }
}

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct S3FsConfig {
  app_name: Option<Cow<'static, str>>,
  endpoint_url: Option<Cow<'static, str>>,
  region: Option<Cow<'static, str>>,
  credentials: S3CredentialsObject,
  force_path_style: Option<bool>,
  retry_config: Option<S3ClientRetryConfig>,
}

impl TryInto<S3Fs> for S3FsConfig {
  type Error = anyhow::Error;

  fn try_into(self) -> Result<S3Fs, Self::Error> {
    S3Fs::new(self)
  }
}

impl S3FsConfig {
  fn try_into_s3_config(self) -> Result<Config, anyhow::Error> {
    let mut builder = Config::builder();

    if let Some(app_name) = self.app_name {
      builder.set_app_name(Some(
        AppName::new(app_name).context("invalid app name")?,
      ));
    }

    builder
      .set_endpoint_url(self.endpoint_url.map(Cow::into_owned))
      .set_force_path_style(self.force_path_style)
      .set_region(self.region.to_owned().map(Region::new))
      .set_credentials_provider({
        let cred = self.credentials.into_credentials();
        Some(SharedCredentialsProvider::new(provide_credentials_fn(
          move || std::future::ready(Ok(cred.clone())),
        )))
      })
      .set_http_client(Some(Self::get_thread_local_shared_http_client()))
      .set_behavior_version(Some(BehaviorVersion::latest()))
      .set_retry_config(
        self
          .retry_config
          .map(S3ClientRetryConfig::into_aws_retry_config),
      );

    Ok(builder.build())
  }

  fn get_thread_local_shared_http_client() -> SharedHttpClient {
    thread_local! {
        static CLIENT: RefCell<OnceCell<SharedHttpClient>> = const {
          RefCell::new(OnceCell::new())
        };
    }

    CLIENT.with(|it| {
      it.borrow_mut()
        .get_or_init(|| {
          #[cfg(feature = "unsafe-proxy")]
          {
            if let Some(proxy_connector) = resolve_proxy_connector() {
              HyperClientBuilder::new().build(proxy_connector)
            } else {
              HyperClientBuilder::new().build_https()
            }
          }

          #[cfg(not(feature = "unsafe-proxy"))]
          {
            HyperClientBuilder::new().build_https()
          }
        })
        .clone()
    })
  }
}

#[cfg(feature = "unsafe-proxy")]
fn resolve_proxy_connector() -> Option<
  hyper_proxy::ProxyConnector<
    hyper_rustls::HttpsConnector<hyper_v014::client::HttpConnector>,
  >,
> {
  use headers::Authorization;
  use hyper_proxy::Intercept;
  use hyper_proxy::Proxy;
  use hyper_proxy::ProxyConnector;
  use hyper_rustls::HttpsConnector;
  use hyper_rustls::HttpsConnectorBuilder;
  use hyper_v014::client::HttpConnector;
  use hyper_v014::Uri;
  use once_cell::sync::Lazy;
  use url::Url;

  let proxy_url: Url = std::env::var("HTTPS_PROXY").ok()?.parse().ok()?;
  let proxy_uri: Uri = std::env::var("HTTPS_PROXY").ok()?.parse().ok()?;
  let mut proxy = Proxy::new(Intercept::All, proxy_uri);

  if let Some(password) = proxy_url.password() {
    proxy
      .set_authorization(Authorization::basic(proxy_url.username(), password));
  }

  static HTTPS_NATIVE_ROOTS: Lazy<HttpsConnector<HttpConnector>> =
    Lazy::new(default_tls);

  fn default_tls() -> HttpsConnector<HttpConnector> {
    use hyper_rustls::ConfigBuilderExt;
    HttpsConnectorBuilder::new()
      .with_tls_config(
        rustls::ClientConfig::builder()
          .with_cipher_suites(&[
            // TLS1.3 suites
            rustls::cipher_suite::TLS13_AES_256_GCM_SHA384,
            rustls::cipher_suite::TLS13_AES_128_GCM_SHA256,
            // TLS1.2 suites
            rustls::cipher_suite::TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
            rustls::cipher_suite::TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
            rustls::cipher_suite::TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
            rustls::cipher_suite::TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
            rustls::cipher_suite::TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256,
          ])
          .with_safe_default_kx_groups()
          .with_safe_default_protocol_versions()
          .unwrap()
          .with_native_roots()
          .with_no_client_auth(),
      )
      .https_or_http()
      .enable_http1()
      .enable_http2()
      .build()
  }

  Some(ProxyConnector::from_proxy(HTTPS_NATIVE_ROOTS.clone(), proxy).unwrap())
}

impl S3Fs {
  pub fn new(config: S3FsConfig) -> Result<Self, anyhow::Error> {
    Ok(Self {
      client: aws_sdk_s3::Client::from_conf(
        config.clone().try_into_s3_config()?,
      ),
      background_tasks: Arc::default(),
      config: Arc::new(config),
    })
  }
}

#[async_trait::async_trait(?Send)]
impl deno_fs::FileSystem for S3Fs {
  fn cwd(&self) -> FsResult<PathBuf> {
    Err(FsError::NotSupported)
  }

  fn tmp_dir(&self) -> FsResult<PathBuf> {
    Err(FsError::NotSupported)
  }

  fn chdir(&self, _path: &Path) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn umask(&self, _mask: Option<u32>) -> FsResult<u32> {
    Err(FsError::NotSupported)
  }

  fn open_sync(
    &self,
    path: &Path,
    options: OpenOptions,
    _access_check: Option<AccessCheckCb>,
  ) -> FsResult<Rc<dyn File>> {
    let file_ptr = std::thread::scope(|s| {
      let path = path.to_path_buf();
      s.spawn(move || {
        rt::IO_RT.block_on(async move {
          self.open_inner(path, options, None).await.map(|it| unsafe {
            // SATEFY: parent thread is blocked by join()
            it.into_ptr()
          })
        })
      })
      .join()
      .unwrap()
    })?;

    Ok(unsafe { S3Object::from_ptr(file_ptr) })
  }

  #[instrument(
    level = "trace",
    skip(self, options, access_check),
    fields(?options, has_access_check = access_check.is_some()),
    err(Debug)
  )]
  async fn open_async<'a>(
    &'a self,
    path: PathBuf,
    options: OpenOptions,
    access_check: Option<AccessCheckCb<'a>>,
  ) -> FsResult<Rc<dyn File>> {
    Ok(self.open_inner(path, options, access_check).await?)
  }

  fn mkdir_sync(
    &self,
    path: &Path,
    recursive: bool,
    mode: Option<u32>,
  ) -> FsResult<()> {
    std::thread::scope(|s| {
      let path = path.to_path_buf();
      s.spawn(move || {
        rt::IO_RT.block_on(async move {
          self.mkdir_async(path, recursive, mode).await
        })
      })
      .join()
      .unwrap()
    })
  }

  #[instrument(level = "trace", skip(self, _mode), fields(mode = _mode) ret, err(Debug))]
  async fn mkdir_async(
    &self,
    path: PathBuf,
    recursive: bool,
    _mode: Option<u32>,
  ) -> FsResult<()> {
    let (bucket_name, key) =
      try_get_bucket_name_and_key(path.try_normalize()?)?;

    if key.is_empty() {
      return Err(FsError::Io(io::Error::from(io::ErrorKind::InvalidInput)));
    }

    let keys = if recursive {
      PathBuf::from(key)
        .iter()
        .map({
          let mut stack = vec![];
          move |it| {
            stack.push(it.to_string_lossy());
            stack
              .iter()
              .cloned()
              .chain([Cow::Borrowed("")])
              .collect::<Vec<_>>()
              .join("/")
          }
        })
        .collect::<Vec<_>>()
    } else {
      'scope: {
        if let Some(parent) = PathBuf::from(&key).parent() {
          if parent == Path::new("") {
            break 'scope;
          }

          let resp = self
            .client
            .head_object()
            .bucket(&bucket_name)
            .key(parent.to_string_lossy())
            .send()
            .await;

          if let Some(err) = resp.err() {
            if err
              .as_service_error()
              .map(|it| it.is_not_found())
              .unwrap_or_default()
            {
              return Err(FsError::Io(io::Error::other(format!(
                "No such file or directory: {}",
                parent.to_string_lossy()
              ))));
            }

            return Err(FsError::Io(io::Error::other(err)));
          }
        }
      }

      vec![key]
    };

    let mut futs = FuturesUnordered::new();
    let mut errors = vec![];

    for mut folder_key in keys {
      if !folder_key.ends_with('/') {
        folder_key.push('/');
      }

      let client = self.client.clone();
      let bucket_name = bucket_name.clone();

      futs.push(async move {
        let resp = client
          .head_object()
          .bucket(&bucket_name)
          .key(&folder_key)
          .send()
          .await;

        if let Err(err) = resp {
          if !matches!(
            err.as_service_error(),
            Some(HeadObjectError::NotFound(_))
          ) {
            return Err(io::Error::other(err));
          }
        }

        client
          .put_object()
          .bucket(bucket_name)
          .key(folder_key)
          .body(ByteStream::from_static(&[]))
          .send()
          .await
          .map_err(io::Error::other)
      });
    }

    while let Some(result) = futs.next().await {
      match result {
        Ok(_) => {}
        Err(err) => errors.push(err),
      }
    }

    to_combined_message(errors)
  }

  fn chmod_sync(&self, _path: &Path, _mode: u32) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn chmod_async(&self, _path: PathBuf, _mode: u32) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn chown_sync(
    &self,
    _path: &Path,
    _uid: Option<u32>,
    _gid: Option<u32>,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn chown_async(
    &self,
    _path: PathBuf,
    _uid: Option<u32>,
    _gid: Option<u32>,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn lchown_sync(
    &self,
    _path: &Path,
    _uid: Option<u32>,
    _gid: Option<u32>,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn lchown_async(
    &self,
    _path: PathBuf,
    _uid: Option<u32>,
    _gid: Option<u32>,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn remove_sync(&self, path: &Path, recursive: bool) -> FsResult<()> {
    std::thread::scope(|s| {
      let path = path.to_path_buf();
      s.spawn(move || {
        rt::IO_RT
          .block_on(async move { self.remove_async(path, recursive).await })
      })
      .join()
      .unwrap()
    })
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn remove_async(&self, path: PathBuf, recursive: bool) -> FsResult<()> {
    self.flush_background_tasks().await;

    let had_slash = path.to_string_lossy().ends_with('/');
    let (bucket_name, key) =
      try_get_bucket_name_and_key(path.try_normalize()?)?;

    if recursive {
      let builder = self.client.list_objects_v2().bucket(&bucket_name).prefix(
        if key.is_empty() {
          Cow::Borrowed("")
        } else {
          Cow::Owned(format!("{}/", key))
        },
      );

      let mut errors = vec![];
      let mut stream = builder.into_paginator().send();
      let mut ids = vec![];

      while let Some(resp) = stream.next().await {
        let v = match resp {
          Ok(v) => v,
          Err(err) => return Err(io::Error::other(err).into()),
        };

        match v.key_count() {
          None => continue,
          Some(v) if v <= 0 => continue,
          _ => {}
        }

        ids.extend(v.contents().iter().filter_map(|it| {
          it.key()
            .and_then(|it| ObjectIdentifier::builder().key(it).build().ok())
        }));
      }

      if ids.is_empty() {
        return Ok(());
      }

      trace!(ids = ?ids.iter().map(|it| it.key()).collect::<Vec<_>>());

      let delete = Delete::builder()
        .set_quiet(Some(true))
        .set_objects(Some(ids))
        .build()
        .map_err(io::Error::other)?;

      let resp = self
        .client
        .delete_objects()
        .bucket(&bucket_name)
        .delete(delete)
        .send()
        .await;

      let v = match resp {
        Ok(v) => v,
        Err(err) => return Err(io::Error::other(err).into()),
      };

      if !v.errors().is_empty() {
        errors.extend_from_slice(v.errors());
      }

      return to_combined_message(errors.into_iter().map(|it| {
        format!(
          "{}({}): {}",
          it.key().unwrap_or("null"),
          it.code().unwrap_or("unknown"),
          it.message().unwrap_or("unknown error message")
        )
      }));
    }

    if key.is_empty() {
      return Err(FsError::Io(io::Error::from(io::ErrorKind::InvalidInput)));
    }

    let key = if had_slash { format!("{}/", key) } else { key };
    let resp = self
      .client
      .head_object()
      .bucket(&bucket_name)
      .key(&key)
      .send()
      .await;

    if let Some(err) = resp.err() {
      if err
        .as_service_error()
        .map(|it| it.is_not_found())
        .unwrap_or_default()
      {
        return Err(FsError::Io(io::Error::from(io::ErrorKind::NotFound)));
      }

      return Err(FsError::Io(io::Error::other(err)));
    }

    self
      .client
      .delete_object()
      .bucket(bucket_name)
      .key(key)
      .send()
      .await
      .map_err(io::Error::other)?;

    Ok(())
  }

  fn copy_file_sync(&self, oldpath: &Path, newpath: &Path) -> FsResult<()> {
    std::thread::scope(|s| {
      let oldpath = oldpath.to_path_buf();
      let newpath = newpath.to_path_buf();
      s.spawn(move || {
        rt::IO_RT
          .block_on(async move { self.copy_file_async(oldpath, newpath).await })
      })
      .join()
      .unwrap()
    })
  }

  #[instrument(level = "trace", skip(self), err(Debug))]
  async fn copy_file_async(
    &self,
    oldpath: PathBuf,
    newpath: PathBuf,
  ) -> FsResult<()> {
    self.flush_background_tasks().await;

    let (source_bucket, source_key) =
      try_get_bucket_name_and_key(oldpath.try_normalize()?)?;
    let (destination_bucket, destination_key) =
      try_get_bucket_name_and_key(newpath.try_normalize()?)?;

    if source_key.is_empty() || destination_key.is_empty() {
      return Err(FsError::Io(io::Error::from(io::ErrorKind::InvalidInput)));
    }

    self
      .client
      .copy_object()
      .copy_source(to_encoded_copy_source_value(&source_bucket, &source_key))
      .bucket(destination_bucket)
      .key(destination_key)
      .send()
      .await
      .map_err(|err| {
        if matches!(
          err.as_service_error().and_then(|it| it.code()),
          Some("NoSuchKey" | "NoSuchBucket")
        ) {
          FsError::Io(io::Error::from(io::ErrorKind::NotFound))
        } else {
          FsError::Io(io::Error::other(err))
        }
      })?;

    Ok(())
  }

  fn cp_sync(&self, _path: &Path, _new_path: &Path) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn cp_async(&self, _path: PathBuf, _new_path: PathBuf) -> FsResult<()> {
    // TODO
    Err(FsError::NotSupported)
  }

  fn stat_sync(&self, path: &Path) -> FsResult<FsStat> {
    std::thread::scope(|s| {
      let path = path.to_path_buf();
      s.spawn(move || {
        rt::IO_RT.block_on(async move { self.stat_async(path).await })
      })
      .join()
      .unwrap()
    })
  }

  #[instrument(level = "trace", skip(self), err(Debug))]
  async fn stat_async(&self, path: PathBuf) -> FsResult<FsStat> {
    self.flush_background_tasks().await;

    let path = path.try_normalize()?;
    let had_slash = path.to_string_lossy().ends_with('/');
    let (bucket_name, key) = try_get_bucket_name_and_key(path.clone())?;
    let key_count = if key.is_empty() {
      Some(1)
    } else {
      self
        .client
        .list_objects_v2()
        .max_keys(1)
        .bucket(bucket_name)
        .prefix(if had_slash { key } else { format!("{}/", key) })
        .send()
        .await
        .map_err(io::Error::other)?
        .key_count()
    };

    if matches!(key_count, Some(v) if v > 0) {
      return Ok(FsStat {
        is_file: false,
        is_directory: true,
        is_symlink: false,
        size: 0,
        mtime: None,
        atime: None,
        birthtime: None,
        ctime: None,
        dev: 0,
        ino: 0,
        mode: 0,
        nlink: 0,
        uid: 0,
        gid: 0,
        rdev: 0,
        blksize: 0,
        blocks: 0,
        is_block_device: false,
        is_char_device: false,
        is_fifo: false,
        is_socket: false,
      });
    }

    self
      .open_async(path, OpenOptions::read(), None)
      .and_then(|it| it.stat_async())
      .await
  }

  fn lstat_sync(&self, path: &Path) -> FsResult<FsStat> {
    std::thread::scope(|s| {
      let path = path.to_path_buf();
      s.spawn(move || {
        rt::IO_RT.block_on(async move { self.lstat_async(path).await })
      })
      .join()
      .unwrap()
    })
  }

  #[instrument(level = "trace", skip(self), err(Debug))]
  async fn lstat_async(&self, path: PathBuf) -> FsResult<FsStat> {
    self.stat_async(path).await
  }

  fn realpath_sync(&self, _path: &Path) -> FsResult<PathBuf> {
    Err(FsError::NotSupported)
  }

  async fn realpath_async(&self, _path: PathBuf) -> FsResult<PathBuf> {
    Err(FsError::NotSupported)
  }

  fn read_dir_sync(&self, path: &Path) -> FsResult<Vec<FsDirEntry>> {
    std::thread::scope(|s| {
      let path = path.to_path_buf();
      s.spawn(move || {
        rt::IO_RT.block_on(async move { self.read_dir_async(path).await })
      })
      .join()
      .unwrap()
    })
  }

  #[instrument(level = "trace", skip(self), err(Debug))]
  async fn read_dir_async(&self, path: PathBuf) -> FsResult<Vec<FsDirEntry>> {
    self.flush_background_tasks().await;

    let (bucket_name, mut key) =
      try_get_bucket_name_and_key(path.try_normalize()?)?;
    let is_root = key.is_empty();

    debug_assert!(!key.ends_with('/'));
    key.push('/');

    let builder = self
      .client
      .list_objects_v2()
      .set_bucket(Some(bucket_name))
      .set_delimiter(Some("/".into()))
      .set_prefix((!is_root).then_some(key));

    let mut entries = vec![];
    let mut stream = builder.into_paginator().send();

    while let Some(resp) = stream.next().await {
      let v = resp.map_err(io::Error::other)?;
      let Some(prefix) = v.prefix() else {
        continue;
      };

      let common_prefixes = v.common_prefixes();
      let contents = v.contents();

      for common_prefix in common_prefixes {
        entries.push(FsDirEntry {
          name: {
            let Some(name) = common_prefix
              .prefix()
              .and_then(|it| it.strip_prefix(prefix))
              .and_then(|it| it.strip_suffix('/'))
              .map(str::to_owned)
            else {
              continue;
            };

            name
          },

          is_file: false,
          is_directory: true,
          is_symlink: false,
        });
      }

      for content in contents {
        let Some(name) = content.key() else {
          continue;
        };

        if name.ends_with('/') {
          continue;
        }

        entries.push(FsDirEntry {
          name: {
            let Some(name) = name.strip_prefix(prefix).map(str::to_owned)
            else {
              continue;
            };

            name
          },

          is_file: true,
          is_directory: false,
          is_symlink: false,
        });
      }
    }

    Ok(entries).inspect(|it| {
      trace!(len = it.len());
    })
  }

  fn rename_sync(&self, _oldpath: &Path, _newpath: &Path) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn rename_async(
    &self,
    _oldpath: PathBuf,
    _newpath: PathBuf,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn link_sync(&self, _oldpath: &Path, _newpath: &Path) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn link_async(
    &self,
    _oldpath: PathBuf,
    _newpath: PathBuf,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn symlink_sync(
    &self,
    _oldpath: &Path,
    _newpath: &Path,
    _file_type: Option<FsFileType>,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn symlink_async(
    &self,
    _oldpath: PathBuf,
    _newpath: PathBuf,
    _file_type: Option<FsFileType>,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn read_link_sync(&self, _path: &Path) -> FsResult<PathBuf> {
    Err(FsError::NotSupported)
  }

  async fn read_link_async(&self, _path: PathBuf) -> FsResult<PathBuf> {
    Err(FsError::NotSupported)
  }

  fn truncate_sync(&self, _path: &Path, _len: u64) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn truncate_async(&self, _path: PathBuf, _len: u64) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn utime_sync(
    &self,
    _path: &Path,
    _atime_secs: i64,
    _atime_nanos: u32,
    _mtime_secs: i64,
    _mtime_nanos: u32,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn utime_async(
    &self,
    _path: PathBuf,
    _atime_secs: i64,
    _atime_nanos: u32,
    _mtime_secs: i64,
    _mtime_nanos: u32,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn lutime_sync(
    &self,
    _path: &Path,
    _atime_secs: i64,
    _atime_nanos: u32,
    _mtime_secs: i64,
    _mtime_nanos: u32,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn lutime_async(
    &self,
    _path: PathBuf,
    _atime_secs: i64,
    _atime_nanos: u32,
    _mtime_secs: i64,
    _mtime_nanos: u32,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }
}

#[derive(EnumAsInner)]
enum S3ObjectOpSlot {
  Read(S3ObjectReadState),
  Write(S3ObjectWriteState),
}

struct S3ObjectReadState(Pin<Box<dyn AsyncBufRead>>, usize);

struct FileBackedMmapBuffer {
  cursor: AllowStdIo<Cursor<&'static mut [u8]>>,
  raw: MmapRaw,
  file: std::fs::File,
}

impl std::fmt::Debug for FileBackedMmapBuffer {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_tuple("FileBackedMmapBuffer")
      .field(&self.file)
      .finish()
  }
}

impl FileBackedMmapBuffer {
  fn new() -> Result<Self, anyhow::Error> {
    let file = {
      let f = tempfile().context("could not create a temp file")?;

      f.set_len(MIN_PART_SIZE as u64)?;
      f
    };

    let raw = MmapOptions::new()
      .map_raw(file.as_raw_fd())
      .context("failed to create a file backed memory buffer")?;

    let cursor = AllowStdIo::new(Cursor::new(unsafe {
      slice::from_raw_parts_mut(raw.as_mut_ptr(), raw.len())
    }));

    Ok(Self { cursor, raw, file })
  }
}

#[derive(Debug)]
struct S3ObjectWriteState {
  buf: FileBackedMmapBuffer,
  total_written: usize,
  method: Option<S3WriteUploadMethod>,
}

impl std::ops::Deref for S3ObjectWriteState {
  type Target = FileBackedMmapBuffer;

  fn deref(&self) -> &Self::Target {
    &self.buf
  }
}

impl std::ops::DerefMut for S3ObjectWriteState {
  fn deref_mut(&mut self) -> &mut Self::Target {
    &mut self.buf
  }
}

impl S3ObjectWriteState {
  fn new() -> Result<Self, anyhow::Error> {
    Ok(Self {
      buf: FileBackedMmapBuffer::new()?,
      total_written: 0,
      method: None,
    })
  }

  #[instrument(level = "trace", skip(self), fields(file = ?self.buf.file), ret, err(Debug))]
  fn try_swap_buffer(&mut self) -> Result<FileBackedMmapBuffer, anyhow::Error> {
    Ok(mem::replace(&mut self.buf, FileBackedMmapBuffer::new()?))
  }
}

enum S3WriteErrorSubject {
  MultiPartUploadTask((i32, io::Error)),
  Join(tokio::task::JoinError),
}

impl std::fmt::Display for S3WriteErrorSubject {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::MultiPartUploadTask((idx, inner)) => write!(f, "{idx}: {inner:?}"),
      Self::Join(inner) => write!(f, "{inner:?}: {inner}"),
    }
  }
}

type BoxedUploadPartTask = BoxFuture<
  'static,
  Result<
    (
      i32,
      Result<UploadPartOutput, SdkError<UploadPartError, HttpResponse>>,
    ),
    JoinError,
  >,
>;

#[derive(Debug)]
struct S3MultiPartUploadMethod {
  recent_part_idx: i32,
  upload_id: String,
  parts: Vec<CompletedPart>,
  tasks: FuturesUnordered<BoxedUploadPartTask>,
}

impl Default for S3MultiPartUploadMethod {
  fn default() -> Self {
    Self {
      recent_part_idx: 1,
      upload_id: String::default(),
      parts: Vec::default(),
      tasks: FuturesUnordered::default(),
    }
  }
}

impl S3MultiPartUploadMethod {
  #[instrument(level = "trace", skip(self), fields(upload_id = self.upload_id) ret, err(Debug))]
  async fn sync(&mut self) -> FsResult<()> {
    let mut errors = vec![];

    while let Some(result) = self.tasks.next().await {
      match result {
        Err(err) => errors.push(S3WriteErrorSubject::Join(err)),
        Ok((part_idx, resp)) => match resp {
          Ok(output) => {
            let Some(e_tag) = output.e_tag else {
              errors.push(S3WriteErrorSubject::MultiPartUploadTask((
                part_idx,
                io::Error::other(
                  "no e-tag field was found in upload part response",
                ),
              )));

              continue;
            };

            self.parts.push(
              CompletedPart::builder()
                .e_tag(e_tag)
                .part_number(part_idx)
                .build(),
            );
          }

          Err(err) => errors.push(S3WriteErrorSubject::MultiPartUploadTask((
            part_idx,
            io::Error::other(err),
          ))),
        },
      }
    }

    to_combined_message(errors)
  }

  #[instrument(level = "trace", skip_all, fields(upload_id = self.upload_id, last))]
  fn add_upload_part_task(
    &mut self,
    client: aws_sdk_s3::Client,
    bucket_name: &str,
    key: &str,
    state_or_mmap_buf: Either<S3ObjectWriteState, FileBackedMmapBuffer>,
    last: bool,
  ) {
    self.tasks.push(
      tokio::task::spawn({
        let client = client;
        let upload_id = self.upload_id.clone();
        let part_idx = self.recent_part_idx;
        let bucket_name = bucket_name.to_string();
        let key = key.to_string();

        self.recent_part_idx += 1;

        async move {
          let buf = state_or_mmap_buf.map_left(|it| it.buf).into_inner();
          let data = unsafe {
            slice::from_raw_parts(
              buf.raw.as_ptr(),
              buf.cursor.get_ref().position() as usize,
            )
          };

          trace!(size = data.len());
          client
            .upload_part()
            .bucket(bucket_name)
            .key(key)
            .upload_id(upload_id)
            .part_number(part_idx)
            .body(ByteStream::new(data.into()))
            .send()
            .map(|it| {
              trace!(success = it.is_ok());
              (part_idx, it)
            })
            .await
        }
        .instrument(trace_span!("upload part", last, part = part_idx))
      })
      .boxed(),
    );
  }
}

#[derive(Debug, EnumAsInner)]
enum S3WriteUploadMethod {
  PutObject,
  MultiPartUpload(S3MultiPartUploadMethod),
}

impl S3WriteUploadMethod {
  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn sync(&mut self) -> FsResult<()> {
    if let Self::MultiPartUpload(multi_part) = self {
      multi_part.sync().await?
    }

    Ok(())
  }

  #[instrument(
    level = "trace",
    skip(self, state),
    fields(client, bucket_name, key),
    ret,
    err(Debug)
  )]
  async fn cleanup(
    &mut self,
    client: aws_sdk_s3::Client,
    bucket_name: String,
    key: String,
    state: S3ObjectWriteState,
  ) -> FsResult<()> {
    match self {
      Self::MultiPartUpload(multi_part) => {
        if state.buf.cursor.get_ref().position() > 0 {
          state.buf.raw.flush_async()?;
          multi_part.add_upload_part_task(
            client.clone(),
            &bucket_name,
            &key,
            Either::Left(state),
            true,
          );

          multi_part.sync().await?;
        }

        if multi_part.parts.is_empty() {
          return Ok(());
        }

        debug_assert!(multi_part.tasks.is_empty());
        debug_assert!(multi_part.recent_part_idx > 1);

        if multi_part.parts.len() != (multi_part.recent_part_idx - 1) as usize {
          error!(
            parts.len = multi_part.parts.len(),
            recent_part_idx = multi_part.recent_part_idx - 1,
            "mismatch with recent part idx"
          );

          client
            .abort_multipart_upload()
            .bucket(bucket_name)
            .key(key)
            .upload_id(mem::take(&mut multi_part.upload_id))
            .send()
            .await
            .map_err(io::Error::other)?;

          return Err(FsError::Io(io::Error::other(
            "upload was aborted because some parts were not successfully uploaded",
          )));
        }

        client
          .complete_multipart_upload()
          .bucket(bucket_name)
          .key(key)
          .upload_id(mem::take(&mut multi_part.upload_id))
          .multipart_upload(
            CompletedMultipartUpload::builder()
              .set_parts({
                let mut parts = mem::take(&mut multi_part.parts);

                parts.sort_by(|a, b| {
                  a.part_number().unwrap().cmp(&b.part_number().unwrap())
                });

                trace!(
                  idx_list = ?parts
                    .iter()
                    .map(|it| it.part_number().unwrap()).collect::<Vec<_>>()
                );
                Some(parts)
              })
              .build(),
          )
          .send()
          .await
          .map_err(io::Error::other)?;
      }

      Self::PutObject => {
        client
          .put_object()
          .bucket(bucket_name)
          .key(key)
          .body(ByteStream::new(
            unsafe {
              slice::from_raw_parts(state.buf.raw.as_ptr(), state.total_written)
            }
            .into(),
          ))
          .send()
          .await
          .map_err(io::Error::other)?;
      }
    }

    Ok(())
  }
}

pub struct S3ObjectPtr(*const S3Object);

unsafe impl Send for S3ObjectPtr {}

pub struct S3Object {
  fs: S3Fs,
  op_slot: AsyncRefCell<Option<S3ObjectOpSlot>>,
  bucket_name: String,
  key: String,
}

impl Drop for S3Object {
  fn drop(&mut self) {
    if let Some(S3ObjectOpSlot::Write(mut state)) =
      Rc::new(mem::take(&mut self.op_slot))
        .try_borrow_mut()
        .unwrap()
        .take()
    {
      let Some(mut method) = state.method.take() else {
        return;
      };

      let fs = self.fs.clone();
      let bucket_name = mem::take(&mut self.bucket_name);
      let key = mem::take(&mut self.key);
      let span = info_span!(
        "background task",
        bucket_name = bucket_name.as_str(),
        key = key.as_str()
      );

      drop(tokio::spawn(async move {
        fs.background_tasks.write().await.push(
          tokio::task::spawn(
            async move {
              if let Err(err) = method.sync().await {
                error!(reason = ?err, "sync operation failed");
              }
              if let Err(err) = method
                .cleanup(fs.client.clone(), bucket_name, key, state)
                .await
              {
                error!(reason = ?err, "cleanup operation failed");
              }
            }
            .instrument(span),
          )
          .map_err(Arc::new)
          .boxed()
          .shared(),
        );
      }));
    }
  }
}

impl S3Object {
  unsafe fn into_ptr(self: Rc<Self>) -> S3ObjectPtr {
    S3ObjectPtr(Rc::into_raw(self))
  }

  unsafe fn from_ptr(ptr: S3ObjectPtr) -> Rc<Self> {
    unsafe { Rc::from_raw(ptr.0) }
  }

  fn read_byob_inner(
    self: Rc<Self>,
    buf: &mut [u8],
  ) -> LocalBoxFuture<'_, FsResult<usize>> {
    async move {
      let mut op_slot = RcRef::map(&self, |r| &r.op_slot).borrow_mut().await;
      let Some(op_slot_mut) = op_slot.as_mut() else {
        let resp = self
          .fs
          .client
          .get_object()
          .bucket(&self.bucket_name)
          .key(&self.key)
          .send()
          .await;

        let Ok(resp) = resp else {
          return Ok(0);
        };

        let mut body_buf = resp.body.into_async_read();
        let nread = body_buf.read(buf).await?;

        *op_slot = Some(S3ObjectOpSlot::Read(S3ObjectReadState(
          Box::pin(body_buf),
          nread,
        )));

        trace!(nread);
        return Ok(nread);
      };

      let Some(state) = op_slot_mut.as_read_mut() else {
        return Err(
          io::Error::other("read operation was blocked by another operation")
            .into(),
        );
      };

      let err = match state.0.read(buf).await {
        Ok(nread) => {
          state.1 += nread;

          if nread == 0 {
            op_slot.take();
          }

          trace!(nread);
          return Ok(nread);
        }

        Err(err) => err,
      };

      let is_retryable = {
        use io::ErrorKind as E;
        matches!(
          err.kind(),
          E::ConnectionRefused
            | E::ConnectionReset
            | E::ConnectionAborted
            | E::BrokenPipe
            | E::TimedOut
            | E::NotConnected
        )
      };

      warn!(kind = %err.kind(), reason = ?err, "stream closed abnormally");
      debug!(is_retryable);

      if is_retryable {
        let resp = self
          .fs
          .client
          .get_object()
          .bucket(&self.bucket_name)
          .key(&self.key)
          .range(format!("{}-", state.1))
          .send()
          .await
          .map_err(io::Error::other)?;

        let mut body_buf = resp.body.into_async_read();
        let nread = body_buf.read(buf).await?;

        state.1 += nread;
        state.0 = Box::pin(body_buf);

        trace!(nread);
        Ok(nread)
      } else {
        op_slot.take();
        Err(io::Error::other(err).into())
      }
    }
    .boxed_local()
  }

  fn write_inner(
    self: Rc<Self>,
    buf: &[u8],
  ) -> LocalBoxFuture<'_, FsResult<(usize, bool)>> {
    async move {
      let mut op_slot = RcRef::map(&self, |r| &r.op_slot).borrow_mut().await;
      let Some(op_slot_mut) = op_slot.as_mut() else {
        let mut state = S3ObjectWriteState::new().map_err(io::Error::other)?;
        let size = buf.len();
        let nwritten = state.cursor.write(buf).await?;
        let written = if size == nwritten {
          (nwritten, true)
        } else {
          assert!(size > nwritten);
          (nwritten, false)
        };

        state.total_written += nwritten;
        state.method =
          (nwritten < MIN_PART_SIZE).then_some(S3WriteUploadMethod::PutObject);

        *op_slot = Some(S3ObjectOpSlot::Write(state));

        trace!(nwritten);
        return Ok(written);
      };

      let Some(state) = op_slot_mut.as_write_mut() else {
        return Err(
          io::Error::other("write operation was blocked by another operation")
            .into(),
        );
      };

      let size = buf.len();
      let nwritten = state.cursor.write(buf).await?;

      state.total_written += nwritten;

      if nwritten < size {
        // Now that the tmp buffer is full and we still have bytes to write, we must switch
        // to a multi-part upload.
        let mmap_buf = state.try_swap_buffer().map_err(io::Error::other)?;

        mmap_buf.raw.flush_async()?;
        assert_eq!(state.buf.cursor.get_ref().position(), 0);

        let method = match &mut state.method {
          Some(S3WriteUploadMethod::MultiPartUpload(method)) => method,
          method @ (Some(S3WriteUploadMethod::PutObject) | None) => {
            method.take();
            method
              .insert(S3WriteUploadMethod::MultiPartUpload(
                S3MultiPartUploadMethod {
                  upload_id: self
                    .fs
                    .client
                    .create_multipart_upload()
                    .bucket(&self.bucket_name)
                    .key(&self.key)
                    .send()
                    .await
                    .map_err(io::Error::other)?
                    .upload_id
                    .ok_or(io::Error::other(concat!(
                      "upload id could not be found in ",
                      "the multipart upload response"
                    )))?,

                  ..Default::default()
                },
              ))
              .as_multi_part_upload_mut()
              .unwrap()
          }
        };

        method.add_upload_part_task(
          self.fs.client.clone(),
          &self.bucket_name,
          &self.key,
          Either::Right(mmap_buf),
          false,
        );

        trace!(nwritten);
        return Ok((nwritten, false));
      }

      assert_eq!(nwritten, size);
      trace!(nwritten);
      Ok((nwritten, true))
    }
    .boxed_local()
  }

  async fn write_all_inner(self: Rc<Self>, mut buf: &[u8]) -> FsResult<()> {
    loop {
      let (nwritten, is_full) = self.clone().write_inner(buf).await?;
      if is_full {
        return Ok(());
      }
      buf = &buf[nwritten..];
    }
  }
}

#[async_trait::async_trait(?Send)]
impl deno_io::fs::File for S3Object {
  fn read_sync(self: Rc<Self>, buf: &mut [u8]) -> FsResult<usize> {
    // SATEFY: current thread will be blocked by join()
    let ptr = unsafe { self.into_ptr() };
    std::thread::scope(|s| {
      s.spawn(move || {
        rt::IO_RT.block_on(async move {
          unsafe { S3Object::from_ptr(ptr) }
            .read_byob_inner(buf)
            .await
        })
      })
      .join()
      .unwrap()
    })
  }

  #[instrument(level = "trace", skip_all, fields(self.bucket_name, self.key), err(Debug))]
  async fn read_byob(
    self: Rc<Self>,
    mut buf: BufMutView,
  ) -> FsResult<(usize, BufMutView)> {
    self.read_byob_inner(&mut buf).await.map(|it| (it, buf))
  }

  fn write_sync(self: Rc<Self>, buf: &[u8]) -> FsResult<usize> {
    // SATEFY: current thread will be blocked by join()
    let ptr = unsafe { self.into_ptr() };
    std::thread::scope(|s| {
      s.spawn(move || {
        rt::IO_RT.block_on(async move {
          unsafe { S3Object::from_ptr(ptr) }.write_inner(buf).await
        })
      })
      .join()
      .unwrap()
    })
    .map(|it| it.0)
  }

  #[instrument(level = "trace", skip_all, fields(self.bucket_name, self.key, len = buf.len()), err(Debug))]
  async fn write(self: Rc<Self>, buf: BufView) -> FsResult<WriteOutcome> {
    let (nwritten, is_full) = self.write_inner(&buf).await?;
    if is_full {
      Ok(WriteOutcome::Full { nwritten })
    } else {
      Ok(WriteOutcome::Partial {
        nwritten,
        view: buf,
      })
    }
  }

  fn write_all_sync(self: Rc<Self>, buf: &[u8]) -> FsResult<()> {
    // SATEFY: current thread will be blocked by join()
    let ptr = unsafe { self.into_ptr() };
    std::thread::scope(|s| {
      s.spawn(move || {
        rt::IO_RT.block_on(async move {
          unsafe { S3Object::from_ptr(ptr) }
            .write_all_inner(buf)
            .await
        })
      })
      .join()
      .unwrap()
    })
  }

  #[instrument(level = "trace", skip_all, fields(self.bucket_name, self.key), err(Debug))]
  async fn write_all(self: Rc<Self>, mut buf: BufView) -> FsResult<()> {
    loop {
      match self.clone().write(buf).await? {
        WriteOutcome::Full { .. } => return Ok(()),
        WriteOutcome::Partial { nwritten, mut view } => {
          view.advance_cursor(nwritten);
          buf = view;
        }
      }
    }
  }

  fn read_all_sync(self: Rc<Self>) -> FsResult<Cow<'static, [u8]>> {
    // SATEFY: current thread will be blocked by join()
    let ptr = unsafe { self.into_ptr() };
    std::thread::scope(|s| {
      s.spawn(move || {
        rt::IO_RT.block_on(async move {
          unsafe { S3Object::from_ptr(ptr) }.read_all_async().await
        })
      })
      .join()
      .unwrap()
    })
  }

  #[instrument(level = "trace", skip_all, fields(self.bucket_name, self.key), err(Debug))]
  async fn read_all_async(self: Rc<Self>) -> FsResult<Cow<'static, [u8]>> {
    let resp = self
      .fs
      .client
      .get_object()
      .bucket(&self.bucket_name)
      .key(&self.key)
      .send()
      .await;

    match resp {
      Ok(v) => Ok(Cow::Owned(
        v.body.collect().await.map_err(io::Error::other)?.to_vec(),
      )),
      Err(err) => Err(io::Error::other(err).into()),
    }
    .inspect(|it: &Cow<'_, [u8]>| {
      trace!(nread = it.len());
    })
  }

  fn chmod_sync(self: Rc<Self>, _pathmode: u32) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn chmod_async(self: Rc<Self>, _mode: u32) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn seek_sync(self: Rc<Self>, _pos: io::SeekFrom) -> FsResult<u64> {
    Err(FsError::NotSupported)
  }

  async fn seek_async(self: Rc<Self>, _pos: io::SeekFrom) -> FsResult<u64> {
    Err(FsError::NotSupported)
  }

  fn datasync_sync(self: Rc<Self>) -> FsResult<()> {
    // SATEFY: current thread will be blocked by join()
    let ptr = unsafe { self.into_ptr() };
    std::thread::scope(|s| {
      s.spawn(move || {
        rt::IO_RT.block_on(async move {
          unsafe { S3Object::from_ptr(ptr) }.datasync_async().await
        })
      })
      .join()
      .unwrap()
    })
  }

  /// ## Note
  /// This function should sync only data without metadata, but this is
  /// meaningless on S3, so it's just an alias of
  /// [sync_async](S3Object::sync_async).
  async fn datasync_async(self: Rc<Self>) -> FsResult<()> {
    self.sync_async().await
  }

  fn sync_sync(self: Rc<Self>) -> FsResult<()> {
    // SATEFY: current thread will be blocked by join()
    let ptr = unsafe { self.into_ptr() };
    std::thread::scope(|s| {
      s.spawn(move || {
        rt::IO_RT.block_on(async move {
          unsafe { S3Object::from_ptr(ptr) }.sync_async().await
        })
      })
      .join()
      .unwrap()
    })
  }

  async fn sync_async(self: Rc<Self>) -> FsResult<()> {
    let mut op_slot = RcRef::map(&self, |r| &r.op_slot).borrow_mut().await;
    let Some(state) = &mut *op_slot else {
      return Ok(());
    };

    let result = match state {
      S3ObjectOpSlot::Write(S3ObjectWriteState {
        method: Some(method),
        ..
      }) => method.sync().await,

      _ => Ok(()),
    };

    if result.is_err() {
      op_slot.take();
    }

    result
  }

  fn stat_sync(self: Rc<Self>) -> FsResult<FsStat> {
    // SATEFY: current thread will be blocked by join()
    let ptr = unsafe { self.into_ptr() };
    std::thread::scope(|s| {
      s.spawn(move || {
        rt::IO_RT.block_on(async move {
          unsafe { S3Object::from_ptr(ptr) }.stat_async().await
        })
      })
      .join()
      .unwrap()
    })
  }

  async fn stat_async(self: Rc<Self>) -> FsResult<FsStat> {
    let resp = self
      .fs
      .client
      .head_object()
      .bucket(&self.bucket_name)
      .key(&self.key)
      .send()
      .await
      .map_err(io::Error::other)?;

    Ok(FsStat {
      is_file: true,
      is_directory: false,
      is_symlink: false,
      size: resp
        .content_length()
        .map(u64::try_from)
        .transpose()
        .map_err(|err| {
          io::Error::other(
            anyhow!(err)
              .context("object's content-length header was not read correctly"),
          )
        })?
        .ok_or(io::Error::other(
          "unable to get object's content-length header",
        ))?,

      mtime: resp.last_modified.and_then(to_msec),
      atime: None,
      birthtime: None,
      ctime: None,
      dev: 0,
      ino: 0,
      mode: 0,
      nlink: 0,
      uid: 0,
      gid: 0,
      rdev: 0,
      blksize: 0,
      blocks: 0,
      is_block_device: false,
      is_char_device: false,
      is_fifo: false,
      is_socket: false,
    })
  }

  fn lock_sync(self: Rc<Self>, _exclusive: bool) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn lock_async(self: Rc<Self>, _exclusive: bool) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn unlock_sync(self: Rc<Self>) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn unlock_async(self: Rc<Self>) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn truncate_sync(self: Rc<Self>, _len: u64) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn truncate_async(self: Rc<Self>, _len: u64) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn utime_sync(
    self: Rc<Self>,
    _atime_secs: i64,
    _atime_nanos: u32,
    _mtime_secs: i64,
    _mtime_nanos: u32,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn utime_async(
    self: Rc<Self>,
    _atime_secs: i64,
    _atime_nanos: u32,
    _mtime_secs: i64,
    _mtime_nanos: u32,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn as_stdio(self: Rc<Self>) -> FsResult<std::process::Stdio> {
    Err(FsError::NotSupported)
  }

  fn backing_fd(self: Rc<Self>) -> Option<ResourceHandleFd> {
    None
  }

  fn try_clone_inner(self: Rc<Self>) -> FsResult<Rc<dyn File>> {
    Err(FsError::NotSupported)
  }
}

fn try_get_bucket_name_and_key(path: PathBuf) -> FsResult<(String, String)> {
  let mut iter = path.iter();

  Ok((
    iter
      .next()
      .ok_or(io::Error::other("no bucket name specified"))?
      .to_string_lossy()
      .to_string(),
    iter
      .map(OsStr::to_string_lossy)
      .collect::<Vec<_>>()
      .join("/"),
  ))
}

/// Builds the `x-amz-copy-source` value required by S3's CopyObject API.
///
/// The bucket/key separator and key path separators must remain intact, while
/// each key segment is URL-encoded so names containing spaces or reserved
/// characters resolve to the original S3 object.
fn to_encoded_copy_source_value(bucket: &str, key: &str) -> String {
  let encoded_key = key
    .split('/')
    .map(urlencoding::encode)
    .collect::<Vec<_>>()
    .join("/");

  format!("{bucket}/{encoded_key}")
}

#[inline(always)]
fn to_msec(maybe_time: DateTime) -> Option<u64> {
  match SystemTime::try_from(maybe_time) {
    Ok(time) => Some(
      time
        .duration_since(UNIX_EPOCH)
        .map(|t| t.as_millis() as u64)
        .unwrap_or_else(|err| err.duration().as_millis() as u64),
    ),
    Err(_) => None,
  }
}

fn to_combined_message<I, E>(errors: I) -> FsResult<()>
where
  I: IntoIterator<Item = E>,
  E: ToString,
{
  let iter = errors.into_iter();
  let messages = iter.map(|err| err.to_string()).collect::<Vec<_>>();

  if messages.is_empty() {
    return Ok(());
  }

  Err(io::Error::other(messages.join("\n")).into())
}

#[cfg(test)]
mod test {
  use std::io;
  use std::path::PathBuf;
  use std::sync::Arc;

  use aws_config::BehaviorVersion;
  use aws_sdk_s3::primitives::SdkBody;
  use aws_sdk_s3::{self as s3};
  use aws_smithy_runtime::client::http::test_util::ReplayEvent;
  use aws_smithy_runtime::client::http::test_util::StaticReplayClient;
  use aws_smithy_runtime_api::http::Request;
  use aws_smithy_runtime_api::http::Response;
  use aws_smithy_runtime_api::http::StatusCode;
  use deno_fs::FileSystem;
  use deno_fs::OpenOptions;
  use once_cell::sync::Lazy;

  static OPEN_CREATE: Lazy<OpenOptions> = Lazy::new(|| OpenOptions {
    read: true,
    write: true,
    create: true,
    truncate: true,
    append: true,
    create_new: true,
    mode: None,
  });

  fn get_s3_credentials() -> s3::config::SharedCredentialsProvider {
    s3::config::SharedCredentialsProvider::new(s3::config::Credentials::new(
      "AKIMEOWMEOW",
      "+meowmeowmeeeeeeow/",
      None,
      None,
      "meowmeow",
    ))
  }

  fn get_s3_fs<I>(events: I) -> (super::S3Fs, StaticReplayClient)
  where
    I: IntoIterator<Item = ReplayEvent>,
  {
    let client = StaticReplayClient::new(events.into_iter().collect());

    (
      super::S3Fs {
        background_tasks: Default::default(),
        config: Arc::default(),
        client: s3::Client::from_conf(
          s3::Config::builder()
            .behavior_version(BehaviorVersion::latest())
            .credentials_provider(get_s3_credentials())
            .region(s3::config::Region::new("us-east-1"))
            .http_client(client.clone())
            .build(),
        ),
      },
      client,
    )
  }

  #[tokio::test]
  async fn should_not_be_open_when_object_key_is_empty() {
    let (fs, _) = get_s3_fs([]);

    assert_eq!(
      fs.open_async(PathBuf::from("meowmeow"), *OPEN_CREATE, None)
        .await
        .err()
        .unwrap()
        .kind(),
      io::ErrorKind::InvalidInput
    );
  }

  #[tokio::test]
  async fn copy_file_should_be_not_found_when_source_does_not_exist() {
    let (fs, _) = get_s3_fs([ReplayEvent::new(
      Request::empty(),
      Response::new(
        StatusCode::try_from(404).unwrap(),
        SdkBody::from(
          r#"<?xml version="1.0" encoding="UTF-8"?>
<Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message></Error>"#,
        ),
      ),
    )]);

    assert_eq!(
      fs.copy_file_async(
        PathBuf::from("meowmeow/source.txt"),
        PathBuf::from("meowmeow/destination.txt"),
      )
      .await
      .err()
      .unwrap()
      .kind(),
      io::ErrorKind::NotFound
    );
  }

  #[test]
  fn copy_source_encodes_key_segments_without_changing_the_path() {
    assert_eq!(
      super::to_encoded_copy_source_value(
        "source-bucket",
        "reports/January 2026?#.pdf"
      ),
      "source-bucket/reports/January%202026%3F%23.pdf"
    );
  }
}
