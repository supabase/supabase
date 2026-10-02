use std::hash::Hasher;
use std::path::PathBuf;

use anyhow::Context;
use deno_core::error::AnyError;
use futures::io::AllowStdIo;
use futures::StreamExt;
use reqwest::Url;
use tokio::io::AsyncWriteExt;
use tokio_util::compat::FuturesAsyncWriteCompatExt;
use tracing::info;
use tracing::info_span;
use tracing::instrument;
use tracing::trace;
use tracing::Instrument;
use xxhash_rust::xxh3::Xxh3;

#[instrument(fields(%kind, url = %url))]
pub async fn fetch_and_cache_from_url(
  kind: &'static str,
  url: Url,
  cache_id: Option<String>,
) -> Result<PathBuf, AnyError> {
  let cache_id = cache_id.unwrap_or(fxhash::hash(url.as_str()).to_string());
  let download_dir = std::env::var("EXT_AI_CACHE_DIR")
    .map_err(AnyError::from)
    .map(PathBuf::from)
    .or_else(|_| {
      ort::sys::internal::dirs::cache_dir()
        .context("could not determine cache directory")
    })?
    .join(kind)
    .join(&cache_id);

  tokio::fs::create_dir_all(&download_dir)
    .await
    .context("could not able to create directories")?;

  let filename = url
    .path_segments()
    .and_then(Iterator::last)
    .context("missing filename in URL")?;

  let filepath = download_dir.join(filename);
  let checksum_path = filepath.with_file_name(format!("{filename}.checksum"));

  let is_filepath_exists = tokio::fs::try_exists(&filepath)
    .await
    .map_err(AnyError::from)?;

  let is_checksum_path_exists = tokio::fs::try_exists(&checksum_path)
    .await
    .map_err(AnyError::from)?;

  let is_checksum_valid = is_checksum_path_exists
    && 'scope: {
      let Some(old_checksum_str) =
        tokio::fs::read_to_string(&checksum_path).await.ok()
      else {
        break 'scope false;
      };

      let filepath = filepath.clone();
      let checksum = tokio::task::spawn_blocking(move || {
        let mut file = std::fs::File::open(filepath).ok()?;
        let mut hasher = Xxh3::new();
        let _ = std::io::copy(&mut file, &mut hasher).ok()?;

        Some(hasher.finish().to_be_bytes())
      })
      .await;

      let Ok(Some(checksum)) = checksum else {
        break 'scope false;
      };

      old_checksum_str == faster_hex::hex_string(&checksum)
    };

  let span = info_span!("download", filepath = %filepath.to_string_lossy());
  async move {
    if is_filepath_exists && is_checksum_valid {
      info!("binary already exists, skipping download");
      Ok(filepath.clone())
    } else {
      info!("downloading binary");

      if is_filepath_exists {
        let _ = tokio::fs::remove_file(&filepath).await;
      }

      use reqwest::*;

      let resp = Client::builder()
        .http1_only()
        .build()
        .context("failed to create http client")?
        .get(url.clone())
        .send()
        .await
        .context("failed to download")?;

      let file = tokio::fs::File::create(&filepath)
        .await
        .context("failed to create file")?;

      let mut stream = resp.bytes_stream();
      let mut writer = tokio::io::BufWriter::new(file);
      let mut hasher = AllowStdIo::new(Xxh3::new()).compat_write();
      let mut written = 0;

      while let Some(chunk) = stream.next().await {
        let chunk = chunk.context("failed to get chunks")?;

        written += tokio::io::copy(&mut chunk.as_ref(), &mut writer)
          .await
          .context("failed to store chunks to file")?;

        let _ = tokio::io::copy(&mut chunk.as_ref(), &mut hasher)
          .await
          .context("failed to calculate checksum")?;

        trace!(bytes_written = written);
      }

      let checksum_str = {
        let hasher = hasher.into_inner().into_inner();
        faster_hex::hex_string(&hasher.finish().to_be_bytes())
      };

      info!({ bytes_written = written, checksum = &checksum_str }, "done");

      let mut checksum_file = tokio::fs::File::create(&checksum_path)
        .await
        .context("failed to create checksum file")?;

      let _ = checksum_file
        .write(checksum_str.as_bytes())
        .await
        .context("failed to write checksum to file system")?;

      Ok(filepath)
    }
  }
  .instrument(span)
  .await
}
