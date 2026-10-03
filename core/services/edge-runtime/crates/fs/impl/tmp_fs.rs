use std::borrow::Cow;
use std::io::SeekFrom;
use std::io::{self};
use std::path::Path;
use std::path::PathBuf;
use std::process::Stdio;
use std::rc::Rc;
use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering;
use std::sync::Arc;

use anyhow::Context;
use deno_core::unsync::sync::AtomicFlag;
use deno_core::BufMutView;
use deno_core::BufView;
use deno_core::ResourceHandleFd;
use deno_core::WriteOutcome;
use deno_fs::AccessCheckCb;
use deno_fs::FsDirEntry;
use deno_fs::FsFileType;
use deno_fs::RealFs;
use deno_io::fs::File;
use deno_io::fs::FsError;
use deno_io::fs::FsResult;
use deno_io::fs::FsStat;
use serde::Deserialize;
use serde::Serialize;
use tempfile::TempDir;
use tracing::instrument;
use tracing::trace;

use super::TryNormalizePath;

#[derive(Deserialize, Serialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct TmpFsConfig {
  base: Option<PathBuf>,
  prefix: Option<String>,
  suffix: Option<String>,
  random_len: Option<usize>,
  quota: Option<usize>,
}

impl TryFrom<TmpFsConfig> for TmpFs {
  type Error = anyhow::Error;

  fn try_from(value: TmpFsConfig) -> Result<Self, Self::Error> {
    let mut builder = tempfile::Builder::new();

    if let Some(prefix) = value.prefix.as_ref() {
      builder.prefix(prefix);
    }
    if let Some(suffix) = value.suffix.as_ref() {
      builder.suffix(suffix);
    }
    if let Some(random_len) = value.random_len {
      builder.rand_bytes(random_len);
    }

    let root = Arc::new(
      value
        .base
        .map(|it| builder.tempdir_in(it))
        .unwrap_or_else(|| builder.tempdir())
        .context("could not create a temporary directory for tmpfs")?,
    );

    Ok(Self {
      root: root.clone(),
      quota: Arc::new(Quota::new(root, value.quota)),
    })
  }
}

#[derive(Debug)]
struct Quota {
  root: Arc<TempDir>,
  usage: Arc<AtomicUsize>,
  sync: Arc<QuotaSyncFlags>,
  limit: usize,
}

#[derive(Debug, Default)]
struct QuotaSyncFlags {
  /// Perform quota sync optimistically
  do_opt: AtomicFlag,
  /// Perform quota sync immediately
  do_imm: AtomicFlag,
}

impl std::ops::Deref for Quota {
  type Target = AtomicUsize;

  fn deref(&self) -> &Self::Target {
    &self.usage
  }
}

impl Quota {
  fn new(root: Arc<TempDir>, limit: Option<usize>) -> Self {
    Self {
      root,
      usage: Arc::default(),
      sync: Arc::default(),
      limit: limit.unwrap_or(usize::MAX),
    }
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn check(&self, len: usize) -> FsResult<()> {
    if self.sync.do_imm.lower() {
      self.sync().await?;
    }

    if self.usage.load(Ordering::Acquire) + len > self.limit
      && (!self.sync.do_opt.is_raised()
        || self.sync().await? + len > self.limit)
    {
      // NOTE: `ErrorKind::FilesystemQuotaExceeded` is not stable yet, so replace it with
      // `ErrorKind::Other`.
      //
      // [1]: https://github.com/rust-lang/rust/issues/86442
      return Err(FsError::Io(io::Error::other("filesystem quota exceeded")));
    }

    Ok(())
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn blocking_check(&self, len: usize) -> FsResult<()> {
    if self.sync.do_imm.lower() {
      self.blocking_sync()?;
    }

    if self.usage.load(Ordering::Acquire) + len > self.limit
      && (!self.sync.do_opt.is_raised()
        || self.blocking_sync()? + len > self.limit)
    {
      // NOTE: `ErrorKind::FilesystemQuotaExceeded` is not stable yet, so replace it with
      // `ErrorKind::Other`.
      //
      // [1]: https://github.com/rust-lang/rust/issues/86442
      return Err(FsError::Io(io::Error::other("filesystem quota exceeded")));
    }

    Ok(())
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn sync(&self) -> FsResult<usize> {
    match tokio::task::spawn_blocking(self.make_sync_fn()).await {
      Ok(v) => v,
      Err(err) => Err(FsError::Io(io::Error::other(err))),
    }
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn blocking_sync(&self) -> FsResult<usize> {
    self.make_sync_fn()()
  }

  fn make_sync_fn(&self) -> impl FnOnce() -> FsResult<usize> {
    fn get_dir_size(path: PathBuf) -> io::Result<u64> {
      use std::fs;

      let entires = fs::read_dir(path)?;
      let mut size = 0;

      for entry in entires {
        let entry = entry?;
        let metadata = entry.metadata()?;

        if metadata.is_dir() {
          size += get_dir_size(entry.path())?;
        } else {
          size += metadata.len();
        }
      }

      Ok(size)
    }

    let root_path = self.root.path().to_path_buf();
    let usage = self.usage.clone();
    let flag = self.sync.clone();

    move || {
      debug_assert!(flag.do_opt.lower());

      let dir_size = get_dir_size(root_path).map_err(FsError::Io)? as usize;

      usage.swap(dir_size, Ordering::Release);

      Ok(dir_size)
    }
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn try_add_delta(&self, amount: i64) -> FsResult<()> {
    match amount.cmp(&0) {
      std::cmp::Ordering::Greater => {
        self.check(amount as usize).await?;
        self.fetch_add(amount as usize, Ordering::Release);
      }

      std::cmp::Ordering::Less => {
        self.fetch_sub(i64::abs(amount) as usize, Ordering::Release);
      }

      _ => {}
    }

    Ok(())
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn blocking_try_add_delta(&self, amount: i64) -> FsResult<()> {
    match amount.cmp(&0) {
      std::cmp::Ordering::Greater => {
        self.blocking_check(amount as usize)?;
        self.fetch_add(amount as usize, Ordering::Release);
      }

      std::cmp::Ordering::Less => {
        self.fetch_sub(i64::abs(amount) as usize, Ordering::Release);
      }

      _ => {}
    }

    Ok(())
  }
}

#[derive(Debug, Clone)]
pub struct TmpFs {
  root: Arc<TempDir>,
  quota: Arc<Quota>,
}

impl TmpFs {
  pub fn actual_path(&self) -> &Path {
    self.root.path()
  }
}

#[async_trait::async_trait(?Send)]
impl deno_fs::FileSystem for TmpFs {
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

  #[instrument(
        level = "trace",
        skip(self, options, access_check),
        fields(?options, has_access_check = access_check.is_some()),
        err(Debug)
    )]
  fn open_sync(
    &self,
    path: &Path,
    options: deno_fs::OpenOptions,
    access_check: Option<AccessCheckCb>,
  ) -> FsResult<Rc<dyn File>> {
    Ok(Rc::new(TmpObject {
      fs: self.clone(),
      file: RealFs
        .open_sync(
          &self.root.path().join(path.try_normalize()?),
          options,
          access_check,
        )
        .inspect(|_| {
          trace!(ok = true);
        })?,
    }))
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
    options: deno_fs::OpenOptions,
    access_check: Option<AccessCheckCb<'a>>,
  ) -> FsResult<Rc<dyn File>> {
    Ok(Rc::new(TmpObject {
      fs: self.clone(),
      file: RealFs
        .open_async(
          self.root.path().join(path.try_normalize()?),
          options,
          access_check,
        )
        .await
        .inspect(|_| {
          trace!(ok = true);
        })?,
    }))
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn mkdir_sync(
    &self,
    path: &Path,
    recursive: bool,
    mode: Option<u32>,
  ) -> FsResult<()> {
    RealFs.mkdir_sync(
      &self.root.path().join(path.try_normalize()?),
      recursive,
      mode,
    )
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn mkdir_async(
    &self,
    path: PathBuf,
    recursive: bool,
    mode: Option<u32>,
  ) -> FsResult<()> {
    RealFs
      .mkdir_async(
        self.root.path().join(path.try_normalize()?),
        recursive,
        mode,
      )
      .await
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

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn remove_sync(&self, path: &Path, recursive: bool) -> FsResult<()> {
    self.quota.sync.do_opt.raise();
    RealFs.remove_sync(&self.root.path().join(path.try_normalize()?), recursive)
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn remove_async(&self, path: PathBuf, recursive: bool) -> FsResult<()> {
    self.quota.sync.do_opt.raise();
    RealFs
      .remove_async(self.root.path().join(path.try_normalize()?), recursive)
      .await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn copy_file_sync(&self, oldpath: &Path, newpath: &Path) -> FsResult<()> {
    self
      .quota
      .blocking_check(self.stat_sync(oldpath)?.size as usize)?;

    RealFs.copy_file_sync(
      &self.root.path().join(oldpath.try_normalize()?),
      &self.root.path().join(newpath.try_normalize()?),
    )
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn copy_file_async(
    &self,
    oldpath: PathBuf,
    newpath: PathBuf,
  ) -> FsResult<()> {
    self
      .quota
      .check(self.stat_async(oldpath.clone()).await?.size as usize)
      .await?;

    RealFs
      .copy_file_async(
        self.root.path().join(oldpath.try_normalize()?),
        self.root.path().join(newpath.try_normalize()?),
      )
      .await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn cp_sync(&self, path: &Path, new_path: &Path) -> FsResult<()> {
    self
      .quota
      .blocking_check(self.stat_sync(path)?.size as usize)?;

    RealFs.cp_sync(
      &self.root.path().join(path.try_normalize()?),
      &self.root.path().join(new_path.try_normalize()?),
    )
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn cp_async(&self, path: PathBuf, new_path: PathBuf) -> FsResult<()> {
    self
      .quota
      .check(self.stat_async(path.clone()).await?.size as usize)
      .await?;

    RealFs
      .cp_async(
        self.root.path().join(path.try_normalize()?),
        self.root.path().join(new_path.try_normalize()?),
      )
      .await
  }

  #[instrument(level = "trace", skip(self), err(Debug))]
  fn stat_sync(&self, path: &Path) -> FsResult<FsStat> {
    RealFs.stat_sync(&self.root.path().join(path.try_normalize()?))
  }

  #[instrument(level = "trace", skip(self), err(Debug))]
  async fn stat_async(&self, path: PathBuf) -> FsResult<FsStat> {
    RealFs
      .stat_async(self.root.path().join(path.try_normalize()?))
      .await
  }

  #[instrument(level = "trace", skip(self), err(Debug))]
  fn lstat_sync(&self, path: &Path) -> FsResult<FsStat> {
    RealFs.lstat_sync(&self.root.path().join(path.try_normalize()?))
  }

  #[instrument(level = "trace", skip(self), err(Debug))]
  async fn lstat_async(&self, path: PathBuf) -> FsResult<FsStat> {
    RealFs
      .lstat_async(self.root.path().join(path.try_normalize()?))
      .await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn realpath_sync(&self, path: &Path) -> FsResult<PathBuf> {
    RealFs.realpath_sync(&self.root.path().join(path.try_normalize()?))
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn realpath_async(&self, path: PathBuf) -> FsResult<PathBuf> {
    RealFs
      .realpath_async(self.root.path().join(path.try_normalize()?))
      .await
  }

  #[instrument(level = "trace", skip(self), err(Debug))]
  fn read_dir_sync(&self, path: &Path) -> FsResult<Vec<FsDirEntry>> {
    RealFs
      .read_dir_sync(&self.root.path().join(path.try_normalize()?))
      .inspect(|it| {
        trace!(len = it.len());
      })
  }

  #[instrument(level = "trace", skip(self), err(Debug))]
  async fn read_dir_async(&self, path: PathBuf) -> FsResult<Vec<FsDirEntry>> {
    RealFs
      .read_dir_async(self.root.path().join(path.try_normalize()?))
      .await
      .inspect(|it| {
        trace!(len = it.len());
      })
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn rename_sync(&self, oldpath: &Path, newpath: &Path) -> FsResult<()> {
    RealFs.rename_sync(
      &self.root.path().join(oldpath.try_normalize()?),
      &self.root.path().join(newpath.try_normalize()?),
    )
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn rename_async(
    &self,
    oldpath: PathBuf,
    newpath: PathBuf,
  ) -> FsResult<()> {
    RealFs
      .rename_async(
        self.root.path().join(oldpath.try_normalize()?),
        self.root.path().join(newpath.try_normalize()?),
      )
      .await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn link_sync(&self, oldpath: &Path, newpath: &Path) -> FsResult<()> {
    RealFs.link_sync(
      &self.root.path().join(oldpath.try_normalize()?),
      &self.root.path().join(newpath.try_normalize()?),
    )
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn link_async(
    &self,
    oldpath: PathBuf,
    newpath: PathBuf,
  ) -> FsResult<()> {
    RealFs
      .link_async(
        self.root.path().join(oldpath.try_normalize()?),
        self.root.path().join(newpath.try_normalize()?),
      )
      .await
  }

  #[instrument(level = "trace", skip(self, file_type), ret, err(Debug))]
  fn symlink_sync(
    &self,
    oldpath: &Path,
    newpath: &Path,
    file_type: Option<FsFileType>,
  ) -> FsResult<()> {
    RealFs.symlink_sync(
      &self.root.path().join(oldpath.try_normalize()?),
      &self.root.path().join(newpath.try_normalize()?),
      file_type,
    )
  }

  #[instrument(level = "trace", skip(self, file_type), ret, err(Debug))]
  async fn symlink_async(
    &self,
    oldpath: PathBuf,
    newpath: PathBuf,
    file_type: Option<FsFileType>,
  ) -> FsResult<()> {
    RealFs
      .symlink_async(
        self.root.path().join(oldpath.try_normalize()?),
        self.root.path().join(newpath.try_normalize()?),
        file_type,
      )
      .await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn read_link_sync(&self, path: &Path) -> FsResult<PathBuf> {
    RealFs.read_link_sync(&self.root.path().join(path.try_normalize()?))
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn read_link_async(&self, path: PathBuf) -> FsResult<PathBuf> {
    RealFs
      .read_link_async(self.root.path().join(path.try_normalize()?))
      .await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn truncate_sync(&self, path: &Path, len: u64) -> FsResult<()> {
    let size = self.stat_sync(path)?.size;

    self
      .quota
      .blocking_try_add_delta((len as i64) - (size as i64))?;

    RealFs.truncate_sync(&self.root.path().join(path.try_normalize()?), len)
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn truncate_async(&self, path: PathBuf, len: u64) -> FsResult<()> {
    let size = self.stat_async(path.clone()).await?.size;

    self
      .quota
      .try_add_delta((len as i64) - (size as i64))
      .await?;

    RealFs
      .truncate_async(self.root.path().join(path.try_normalize()?), len)
      .await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn utime_sync(
    &self,
    path: &Path,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    RealFs.utime_sync(
      &self.root.path().join(path.try_normalize()?),
      atime_secs,
      atime_nanos,
      mtime_secs,
      mtime_nanos,
    )
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn utime_async(
    &self,
    path: PathBuf,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    RealFs
      .utime_async(
        self.root.path().join(path.try_normalize()?),
        atime_secs,
        atime_nanos,
        mtime_secs,
        mtime_nanos,
      )
      .await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn lutime_sync(
    &self,
    path: &Path,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    RealFs.lutime_sync(
      &self.root.path().join(path.try_normalize()?),
      atime_secs,
      atime_nanos,
      mtime_secs,
      mtime_nanos,
    )
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn lutime_async(
    &self,
    path: PathBuf,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    RealFs
      .lutime_async(
        self.root.path().join(path.try_normalize()?),
        atime_secs,
        atime_nanos,
        mtime_secs,
        mtime_nanos,
      )
      .await
  }
}

pub struct TmpObject {
  fs: TmpFs,
  file: Rc<dyn File>,
}

#[async_trait::async_trait(?Send)]
impl deno_io::fs::File for TmpObject {
  #[instrument(level = "trace", skip(self, buf), fields(len = buf.len()), ret, err(Debug))]
  fn read_sync(self: Rc<Self>, buf: &mut [u8]) -> FsResult<usize> {
    self.file.clone().read_sync(buf)
  }

  #[instrument(level = "trace", skip_all, err(Debug))]
  async fn read_byob(
    self: Rc<Self>,
    buf: BufMutView,
  ) -> FsResult<(usize, BufMutView)> {
    self.file.clone().read_byob(buf).await.inspect(|it| {
      trace!(nread = it.0);
    })
  }

  #[instrument(level = "trace", skip(self, buf), fields(len = buf.len()), ret, err(Debug))]
  fn write_sync(self: Rc<Self>, buf: &[u8]) -> FsResult<usize> {
    self.fs.quota.blocking_check(buf.len())?;
    self.file.clone().write_sync(buf).inspect(|it| {
      self.fs.quota.fetch_add(*it, Ordering::Release);
    })
  }

  #[instrument(level = "trace", skip(self, buf), fields(len = buf.len()), err(Debug))]
  async fn write(self: Rc<Self>, buf: BufView) -> FsResult<WriteOutcome> {
    self.fs.quota.check(buf.len()).await?;
    self.file.clone().write(buf).await.inspect(|it| match it {
      WriteOutcome::Partial { nwritten, .. }
      | WriteOutcome::Full { nwritten } => {
        self.fs.quota.fetch_add(*nwritten, Ordering::Release);
        trace!(nwritten = *nwritten);
      }
    })
  }

  #[instrument(level = "trace", skip(self, buf), fields(len = buf.len()), ret, err(Debug))]
  fn write_all_sync(self: Rc<Self>, buf: &[u8]) -> FsResult<()> {
    self.fs.quota.blocking_check(buf.len())?;
    self.file.clone().write_all_sync(buf).inspect(|_| {
      self.fs.quota.fetch_add(buf.len(), Ordering::Release);
    })
  }

  #[instrument(level = "trace", skip(self, buf), fields(len = buf.len()), ret, err(Debug))]
  async fn write_all(self: Rc<Self>, buf: BufView) -> FsResult<()> {
    let len = buf.len();

    self.fs.quota.check(len).await?;
    self.file.clone().write_all(buf).await.inspect(|_| {
      self.fs.quota.fetch_add(len, Ordering::Release);
    })
  }

  #[instrument(level = "trace", skip(self), err(Debug))]
  fn read_all_sync(self: Rc<Self>) -> FsResult<Cow<'static, [u8]>> {
    self.file.clone().read_all_sync().inspect(|it| {
      trace!(nread = it.len());
    })
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn read_all_async(self: Rc<Self>) -> FsResult<Cow<'static, [u8]>> {
    self.file.clone().read_all_async().await.inspect(|it| {
      trace!(nread = it.len());
    })
  }

  fn chmod_sync(self: Rc<Self>, _pathmode: u32) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn chmod_async(self: Rc<Self>, _mode: u32) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn seek_sync(self: Rc<Self>, pos: SeekFrom) -> FsResult<u64> {
    self.file.clone().seek_sync(pos)
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn seek_async(self: Rc<Self>, pos: SeekFrom) -> FsResult<u64> {
    self.file.clone().seek_async(pos).await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn datasync_sync(self: Rc<Self>) -> FsResult<()> {
    self.fs.quota.sync.do_imm.raise();
    self.file.clone().datasync_sync()
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn datasync_async(self: Rc<Self>) -> FsResult<()> {
    self.fs.quota.sync.do_imm.raise();
    self.file.clone().datasync_async().await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn sync_sync(self: Rc<Self>) -> FsResult<()> {
    self.fs.quota.sync.do_imm.raise();
    self.file.clone().sync_sync()
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn sync_async(self: Rc<Self>) -> FsResult<()> {
    self.fs.quota.sync.do_imm.raise();
    self.file.clone().sync_async().await
  }

  #[instrument(level = "trace", skip(self), err(Debug))]
  fn stat_sync(self: Rc<Self>) -> FsResult<FsStat> {
    self.file.clone().stat_sync()
  }

  #[instrument(level = "trace", skip(self), err(Debug))]
  async fn stat_async(self: Rc<Self>) -> FsResult<FsStat> {
    self.file.clone().stat_async().await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn lock_sync(self: Rc<Self>, exclusive: bool) -> FsResult<()> {
    self.file.clone().lock_sync(exclusive)
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn lock_async(self: Rc<Self>, exclusive: bool) -> FsResult<()> {
    self.file.clone().lock_async(exclusive).await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn unlock_sync(self: Rc<Self>) -> FsResult<()> {
    self.file.clone().unlock_sync()
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn unlock_async(self: Rc<Self>) -> FsResult<()> {
    self.file.clone().unlock_async().await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn truncate_sync(self: Rc<Self>, len: u64) -> FsResult<()> {
    let size = self.file.clone().stat_sync()?.size;

    self
      .fs
      .quota
      .blocking_try_add_delta((len as i64) - (size as i64))?;

    self.file.clone().truncate_sync(len)
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn truncate_async(self: Rc<Self>, len: u64) -> FsResult<()> {
    let size = self.file.clone().stat_sync()?.size;

    self
      .fs
      .quota
      .try_add_delta((len as i64) - (size as i64))
      .await?;

    self.file.clone().truncate_async(len).await
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  fn utime_sync(
    self: Rc<Self>,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    self.file.clone().utime_sync(
      atime_secs,
      atime_nanos,
      mtime_secs,
      mtime_nanos,
    )
  }

  #[instrument(level = "trace", skip(self), ret, err(Debug))]
  async fn utime_async(
    self: Rc<Self>,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    self
      .file
      .clone()
      .utime_async(atime_secs, atime_nanos, mtime_secs, mtime_nanos)
      .await
  }

  fn as_stdio(self: Rc<Self>) -> FsResult<Stdio> {
    Err(FsError::NotSupported)
  }

  fn backing_fd(self: Rc<Self>) -> Option<ResourceHandleFd> {
    self.file.clone().backing_fd()
  }

  fn try_clone_inner(self: Rc<Self>) -> FsResult<Rc<dyn File>> {
    self.file.clone().try_clone_inner()
  }
}

#[cfg(test)]
mod test {
  use std::io;
  use std::path::Path;
  use std::path::PathBuf;
  use std::rc::Rc;
  use std::sync::atomic::Ordering;

  use deno_fs::FileSystem;
  use deno_fs::OpenOptions;
  use deno_io::fs::File;
  use once_cell::sync::Lazy;
  use rand::RngCore;
  use tokio::fs::read;

  use super::TmpFs;
  use super::TmpFsConfig;

  const KIB: usize = 1024;
  const MIB: usize = KIB * 1024;

  static OPEN_CREATE: Lazy<OpenOptions> = Lazy::new(|| OpenOptions {
    read: true,
    write: true,
    create: true,
    truncate: true,
    append: true,
    create_new: true,
    mode: None,
  });

  static DATA: &[u8] = b"meowmeow";

  fn assert_filesystem_quota_exceeded(err: io::Error) {
    assert_eq!(err.kind(), io::ErrorKind::Other);
    assert_eq!(err.to_string(), "filesystem quota exceeded");
  }

  fn get_tmp_fs() -> TmpFs {
    TmpFsConfig {
      prefix: Some("meowmeow".to_string()),
      ..Default::default()
    }
    .try_into()
    .unwrap()
  }

  fn get_tmp_fs_with_quota(quota: Option<usize>) -> TmpFs {
    TmpFsConfig {
      prefix: Some("meowmeow".to_string()),
      quota,
      ..Default::default()
    }
    .try_into()
    .unwrap()
  }

  async fn create_file<P>(fs: &TmpFs, path: P) -> Rc<dyn File>
  where
    P: AsRef<Path>,
  {
    fs.open_async(path.as_ref().to_path_buf(), *OPEN_CREATE, None)
      .await
      .unwrap()
  }

  #[tokio::test]
  async fn normalized_path() {
    let fs = get_tmp_fs();

    fs.write_file_async(
      PathBuf::from("meowmeow"),
      *OPEN_CREATE,
      None,
      DATA.to_vec(),
    )
    .await
    .unwrap();

    assert_eq!(read(fs.root.path().join("meowmeow")).await.unwrap(), DATA);
  }

  #[tokio::test]
  async fn non_normalized_path() {
    let fs = get_tmp_fs();

    fs.write_file_async(
      PathBuf::from("meowmeow/a/b/../.."),
      *OPEN_CREATE,
      None,
      DATA.to_vec(),
    )
    .await
    .unwrap();

    assert_eq!(read(fs.root.path().join("meowmeow")).await.unwrap(), DATA)
  }

  #[tokio::test]
  async fn non_normalized_path_2() {
    let fs = get_tmp_fs();

    assert_eq!(
      fs.write_file_async(
        PathBuf::from("../meowmeow"),
        *OPEN_CREATE,
        None,
        DATA.to_vec(),
      )
      .await
      .unwrap_err()
      .kind(),
      io::ErrorKind::InvalidInput
    );
  }

  #[tokio::test]
  async fn non_normalized_path_3() {
    let fs = get_tmp_fs();

    fs.mkdir_async(PathBuf::from("meowmeow/a/b/../c"), true, Some(0o777))
      .await
      .unwrap();

    assert!(fs.stat_async(PathBuf::from("meowmeow/a/c")).await.is_ok());
  }

  #[tokio::test]
  async fn abnormal_mkdir_mode() {
    let fs = get_tmp_fs();

    assert_eq!(
      fs.mkdir_async(PathBuf::from("meowmeow/a/b"), true, Some(0o100))
        .await
        .unwrap_err()
        .kind(),
      io::ErrorKind::PermissionDenied
    );
  }

  #[tokio::test]
  async fn write_exceeding_quota() {
    let fs = get_tmp_fs_with_quota(Some(MIB));
    let mut arr = vec![0u8; MIB + 1];

    rand::thread_rng().fill_bytes(&mut arr);

    assert_filesystem_quota_exceeded(
      fs.write_file_async(PathBuf::from("meowmeow"), *OPEN_CREATE, None, arr)
        .await
        .unwrap_err()
        .into_io_error(),
    );
  }

  #[tokio::test]
  async fn write_exceeding_quota_2() {
    let fs = get_tmp_fs_with_quota(Some(MIB));
    let mut arr = vec![0u8; MIB];

    rand::thread_rng().fill_bytes(&mut arr);

    let f = create_file(&fs, "meowmeow").await;

    f.clone().write_all(arr.into()).await.unwrap();

    assert_filesystem_quota_exceeded(
      f.write_all(b"m".to_vec().into())
        .await
        .unwrap_err()
        .into_io_error(),
    );
  }

  #[tokio::test]
  async fn restore_quota_after_remove_op() {
    let fs = get_tmp_fs_with_quota(Some(MIB));
    let mut arr = vec![0u8; MIB];

    rand::thread_rng().fill_bytes(&mut arr);

    let f = create_file(&fs, "meowmeow").await;

    f.clone().write_all(arr.into()).await.unwrap();

    assert_eq!(fs.quota.load(Ordering::Relaxed), MIB);

    drop(f);

    fs.remove_async(PathBuf::from("meowmeow"), false)
      .await
      .unwrap();

    // Because sync is performed optimistically.
    assert_eq!(fs.quota.load(Ordering::Relaxed), MIB);
    assert!(fs.quota.sync.do_opt.is_raised());

    let mut arr2 = vec![0u8; 512 * KIB];

    rand::thread_rng().fill_bytes(&mut arr2);

    let f2 = create_file(&fs, "meowmeow2").await;

    f2.clone().write_all(arr2.clone().into()).await.unwrap();
    assert_eq!(fs.quota.load(Ordering::Relaxed), 512 * KIB);
    assert!(!fs.quota.sync.do_opt.is_raised());

    f2.clone().write_all(arr2.into()).await.unwrap();
    assert_eq!(fs.quota.load(Ordering::Relaxed), MIB);
    assert!(!fs.quota.sync.do_opt.is_raised());

    assert_filesystem_quota_exceeded(
      f2.write_all(b"m".to_vec().into())
        .await
        .unwrap_err()
        .into_io_error(),
    );
  }

  #[tokio::test]
  async fn cp_exceeding_quota() {
    let fs = get_tmp_fs_with_quota(Some(MIB));
    let mut arr = vec![0u8; 513 * KIB];

    rand::thread_rng().fill_bytes(&mut arr);

    let f = create_file(&fs, "meowmeow").await;

    f.clone().write_all(arr.into()).await.unwrap();

    drop(f);

    assert_filesystem_quota_exceeded(
      fs.cp_async(PathBuf::from("meowmeow"), PathBuf::from("meowmeow2"))
        .await
        .unwrap_err()
        .into_io_error(),
    );
  }

  #[tokio::test]
  async fn truncate_exceeding_quota_fs() {
    let fs = get_tmp_fs_with_quota(Some(MIB));
    let mut arr = vec![0u8; MIB];

    rand::thread_rng().fill_bytes(&mut arr);

    fs.write_file_async(PathBuf::from("meowmeow"), *OPEN_CREATE, None, arr)
      .await
      .unwrap();

    assert_eq!(fs.quota.load(Ordering::Relaxed), MIB);

    assert_filesystem_quota_exceeded(
      fs.truncate_async(PathBuf::from("meowmeow"), (MIB + 1) as u64)
        .await
        .unwrap_err()
        .into_io_error(),
    );
  }

  #[tokio::test]
  async fn truncate_exceeding_quota_file() {
    let fs = get_tmp_fs_with_quota(Some(MIB));
    let mut arr = vec![0u8; MIB];

    rand::thread_rng().fill_bytes(&mut arr);

    let f = create_file(&fs, "meowmeow").await;

    f.clone().write_all(arr.into()).await.unwrap();
    assert_eq!(fs.quota.load(Ordering::Relaxed), MIB);

    assert_filesystem_quota_exceeded(
      f.truncate_async((MIB + 1) as u64)
        .await
        .unwrap_err()
        .into_io_error(),
    );
  }

  #[tokio::test]
  async fn truncate_size_shrink() {
    let fs = get_tmp_fs_with_quota(Some(MIB));
    let f = create_file(&fs, "meowmeow").await;

    f.clone().write_all(vec![1u8; MIB].into()).await.unwrap();

    assert_eq!(fs.quota.load(Ordering::Relaxed), MIB);

    f.truncate_async((128 * KIB) as u64).await.unwrap();
    assert_eq!(fs.quota.load(Ordering::Relaxed), 128 * KIB);
  }

  #[tokio::test]
  async fn truncate_size_extend() {
    let fs = get_tmp_fs_with_quota(Some(MIB));
    let f = create_file(&fs, "meowmeow").await;

    f.clone()
      .write_all(vec![1u8; 512 * KIB].into())
      .await
      .unwrap();

    assert_eq!(fs.quota.load(Ordering::Relaxed), 512 * KIB);

    f.clone().truncate_async(MIB as u64).await.unwrap();
    assert_eq!(fs.quota.load(Ordering::Relaxed), MIB);

    f.clone().seek_async(io::SeekFrom::Start(0)).await.unwrap();

    let vec = f.read_all_async().await.unwrap();
    let half = &vec[512 * KIB..];

    assert!(half.iter().all(|it| *it == 0));
  }

  #[tokio::test]
  async fn rename_async_within_root() {
    let fs = get_tmp_fs();
    create_file(&fs, "meowmeow").await;

    fs.rename_async(PathBuf::from("meowmeow"), PathBuf::from("purr"))
      .await
      .unwrap();

    assert!(!fs.root.path().join("meowmeow").exists());
    assert!(fs.root.path().join("purr").exists());
  }

  #[tokio::test]
  async fn rename_async_rejects_destination_outside_root() {
    let fs = get_tmp_fs();
    create_file(&fs, "meowmeow").await;

    // `..` and absolute destinations must be rejected like `rename_sync` does;
    // `Path::join` would otherwise escape (or replace) the root.
    let outside = std::env::temp_dir().join("tmp-fs-rename-escape");
    for dest in [PathBuf::from("../meowmeow"), outside.clone()] {
      assert_eq!(
        fs.rename_async(PathBuf::from("meowmeow"), dest)
          .await
          .unwrap_err()
          .kind(),
        io::ErrorKind::InvalidInput
      );
    }
    assert_eq!(
      fs.rename_sync(Path::new("meowmeow"), Path::new("../meowmeow"))
        .unwrap_err()
        .kind(),
      io::ErrorKind::InvalidInput
    );

    assert!(fs.root.path().join("meowmeow").exists());
    assert!(!fs.root.path().parent().unwrap().join("meowmeow").exists());
    assert!(!outside.exists());
  }
}
