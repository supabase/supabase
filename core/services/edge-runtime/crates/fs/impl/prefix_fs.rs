use std::borrow::Cow;
use std::io;
use std::path::Path;
use std::path::PathBuf;
use std::rc::Rc;
use std::sync::Arc;

use anyhow::anyhow;
use base_rt::RuntimeState;
use deno_fs::AccessCheckCb;
use deno_fs::FsDirEntry;
use deno_fs::FsFileType;
use deno_fs::OpenOptions;
use deno_io::fs::File;
use deno_io::fs::FsError;
use deno_io::fs::FsResult;
use deno_io::fs::FsStat;

#[derive(Debug, Clone)]
pub struct PrefixFs<FileSystem> {
  prefix: PathBuf,
  cwd: Option<PathBuf>,
  tmp_dir: Option<PathBuf>,
  fs: Arc<FileSystem>,
  base_fs: Option<Arc<dyn deno_fs::FileSystem>>,
  runtime_state: Option<Arc<RuntimeState>>,
  check_sync_api: bool,
}

impl<FileSystem> PrefixFs<FileSystem>
where
  FileSystem: deno_fs::FileSystem,
{
  pub fn new<P>(
    prefix: P,
    fs: FileSystem,
    base_fs: Option<Arc<dyn deno_fs::FileSystem>>,
  ) -> Self
  where
    P: AsRef<Path>,
  {
    Self {
      prefix: prefix.as_ref().to_path_buf(),
      cwd: None,
      tmp_dir: None,
      fs: Arc::new(fs),
      base_fs,
      runtime_state: None,
      check_sync_api: false,
    }
  }

  pub fn cwd<P>(mut self, v: P) -> Self
  where
    P: AsRef<Path>,
  {
    self.cwd = Some(v.as_ref().to_path_buf());
    self
  }

  pub fn tmp_dir<P>(mut self, v: P) -> Self
  where
    P: AsRef<Path>,
  {
    self.tmp_dir = Some(v.as_ref().to_path_buf());
    self
  }

  pub fn set_cwd<P>(&mut self, v: P) -> &mut Self
  where
    P: AsRef<Path>,
  {
    self.cwd = Some(v.as_ref().to_path_buf());
    self
  }

  pub fn set_tmp_dir<P>(&mut self, v: P) -> &mut Self
  where
    P: AsRef<Path>,
  {
    self.tmp_dir = Some(v.as_ref().to_path_buf());
    self
  }

  pub fn set_runtime_state(&mut self, v: &Arc<RuntimeState>) -> &mut Self {
    self.runtime_state = Some(v.clone());
    self
  }

  pub fn set_check_sync_api(&mut self, v: bool) -> &mut Self {
    self.check_sync_api = v;
    self
  }
}

impl<FileSystem> PrefixFs<FileSystem>
where
  FileSystem: deno_fs::FileSystem + 'static,
{
  pub fn add_fs<P, FileSystemInner>(
    mut self,
    prefix: P,
    fs: FileSystemInner,
  ) -> PrefixFs<FileSystemInner>
  where
    P: AsRef<Path>,
    FileSystemInner: deno_fs::FileSystem,
  {
    PrefixFs {
      prefix: prefix.as_ref().to_path_buf(),
      fs: Arc::new(fs),
      cwd: self.cwd.take(),
      tmp_dir: self.tmp_dir.take(),
      runtime_state: self.runtime_state.clone(),
      check_sync_api: self.check_sync_api,
      base_fs: Some(Arc::new(self)),
    }
  }
}

#[async_trait::async_trait(?Send)]
impl<FileSystem> deno_fs::FileSystem for PrefixFs<FileSystem>
where
  FileSystem: deno_fs::FileSystem,
{
  fn cwd(&self) -> FsResult<PathBuf> {
    self
      .cwd
      .clone()
      .map(Ok)
      .or_else(|| self.base_fs.as_ref().map(|it| it.cwd()))
      .unwrap_or_else(|| Ok(PathBuf::new()))
  }

  fn tmp_dir(&self) -> FsResult<PathBuf> {
    self
      .tmp_dir
      .clone()
      .map(Ok)
      .or_else(|| self.base_fs.as_ref().map(|it| it.tmp_dir()))
      .unwrap_or(Err(FsError::NotSupported))
  }

  fn chdir(&self, path: &Path) -> FsResult<()> {
    if path.starts_with(&self.prefix) {
      self.fs.chdir(path.strip_prefix(&self.prefix).unwrap())
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.chdir(path))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  fn umask(&self, mask: Option<u32>) -> FsResult<u32> {
    self
      .base_fs
      .as_ref()
      .map(|it| it.umask(mask))
      .unwrap_or_else(|| Err(FsError::NotSupported))
  }

  fn open_sync(
    &self,
    path: &Path,
    options: OpenOptions,
    access_check: Option<AccessCheckCb>,
  ) -> FsResult<Rc<dyn File>> {
    self.check_sync_api_allowed("open_sync")?;
    if path.starts_with(&self.prefix) {
      self.fs.open_sync(
        path.strip_prefix(&self.prefix).unwrap(),
        options,
        access_check,
      )
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.open_sync(path, options, access_check))
        .unwrap_or_else(|| {
          Err(FsError::Io(io::Error::from(io::ErrorKind::NotFound)))
        })
    }
  }

  async fn open_async<'a>(
    &'a self,
    path: PathBuf,
    options: OpenOptions,
    access_check: Option<AccessCheckCb<'a>>,
  ) -> FsResult<Rc<dyn File>> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .open_async(
          path.strip_prefix(&self.prefix).unwrap().to_owned(),
          options,
          access_check,
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.open_async(path, options, access_check).await
    } else {
      Err(FsError::Io(io::Error::from(io::ErrorKind::NotFound)))
    }
  }

  fn mkdir_sync(
    &self,
    path: &Path,
    recursive: bool,
    mode: Option<u32>,
  ) -> FsResult<()> {
    self.check_sync_api_allowed("mkdir_sync")?;
    if path.starts_with(&self.prefix) {
      self.fs.mkdir_sync(
        path.strip_prefix(&self.prefix).unwrap(),
        recursive,
        mode,
      )
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.mkdir_sync(path, recursive, mode))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn mkdir_async(
    &self,
    path: PathBuf,
    recursive: bool,
    mode: Option<u32>,
  ) -> FsResult<()> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .mkdir_async(
          path.strip_prefix(&self.prefix).unwrap().to_owned(),
          recursive,
          mode,
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.mkdir_async(path, recursive, mode).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn chmod_sync(&self, path: &Path, mode: u32) -> FsResult<()> {
    self.check_sync_api_allowed("chmod_sync")?;
    if path.starts_with(&self.prefix) {
      self
        .fs
        .chmod_sync(path.strip_prefix(&self.prefix).unwrap(), mode)
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.chmod_sync(path, mode))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn chmod_async(&self, path: PathBuf, mode: u32) -> FsResult<()> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .chmod_async(path.strip_prefix(&self.prefix).unwrap().to_owned(), mode)
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.chmod_async(path, mode).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn chown_sync(
    &self,
    path: &Path,
    uid: Option<u32>,
    gid: Option<u32>,
  ) -> FsResult<()> {
    self.check_sync_api_allowed("chown_sync")?;
    if path.starts_with(&self.prefix) {
      self
        .fs
        .chown_sync(path.strip_prefix(&self.prefix).unwrap(), uid, gid)
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.chown_sync(path, uid, gid))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn chown_async(
    &self,
    path: PathBuf,
    uid: Option<u32>,
    gid: Option<u32>,
  ) -> FsResult<()> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .chown_async(
          path.strip_prefix(&self.prefix).unwrap().to_owned(),
          uid,
          gid,
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.chown_async(path, uid, gid).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn lchown_sync(
    &self,
    path: &Path,
    uid: Option<u32>,
    gid: Option<u32>,
  ) -> FsResult<()> {
    self.check_sync_api_allowed("lchown_sync")?;
    if path.starts_with(&self.prefix) {
      self
        .fs
        .lchown_sync(path.strip_prefix(&self.prefix).unwrap(), uid, gid)
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.lchown_sync(path, uid, gid))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn lchown_async(
    &self,
    path: PathBuf,
    uid: Option<u32>,
    gid: Option<u32>,
  ) -> FsResult<()> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .lchown_async(
          path.strip_prefix(&self.prefix).unwrap().to_owned(),
          uid,
          gid,
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.lchown_async(path, uid, gid).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn remove_sync(&self, path: &Path, recursive: bool) -> FsResult<()> {
    self.check_sync_api_allowed("remove_sync")?;
    if path.starts_with(&self.prefix) {
      self
        .fs
        .remove_sync(path.strip_prefix(&self.prefix).unwrap(), recursive)
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.remove_sync(path, recursive))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn remove_async(&self, path: PathBuf, recursive: bool) -> FsResult<()> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .remove_async(
          path.strip_prefix(&self.prefix).unwrap().to_owned(),
          recursive,
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.remove_async(path, recursive).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn copy_file_sync(&self, oldpath: &Path, newpath: &Path) -> FsResult<()> {
    self.check_sync_api_allowed("copy_file_sync")?;

    let oldpath_matches = oldpath.starts_with(&self.prefix);
    let newpath_matches = newpath.starts_with(&self.prefix);
    if oldpath_matches || newpath_matches {
      self.fs.copy_file_sync(
        if oldpath_matches {
          oldpath.strip_prefix(&self.prefix).unwrap()
        } else {
          oldpath
        },
        if newpath_matches {
          newpath.strip_prefix(&self.prefix).unwrap()
        } else {
          newpath
        },
      )
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.copy_file_sync(oldpath, newpath))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn copy_file_async(
    &self,
    oldpath: PathBuf,
    newpath: PathBuf,
  ) -> FsResult<()> {
    let oldpath_matches = oldpath.starts_with(&self.prefix);
    let newpath_matches = newpath.starts_with(&self.prefix);
    if oldpath_matches || newpath_matches {
      self
        .fs
        .copy_file_async(
          if oldpath_matches {
            oldpath.strip_prefix(&self.prefix).unwrap().to_owned()
          } else {
            oldpath
          },
          if newpath_matches {
            newpath.strip_prefix(&self.prefix).unwrap().to_owned()
          } else {
            newpath
          },
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.copy_file_async(oldpath, newpath).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn cp_sync(&self, path: &Path, new_path: &Path) -> FsResult<()> {
    self.check_sync_api_allowed("cp_sync")?;

    let path_matches = path.starts_with(&self.prefix);
    let new_path_matches = new_path.starts_with(&self.prefix);
    if path_matches || new_path_matches {
      self.fs.cp_sync(
        if path_matches {
          path.strip_prefix(&self.prefix).unwrap()
        } else {
          path
        },
        if new_path_matches {
          new_path.strip_prefix(&self.prefix).unwrap()
        } else {
          new_path
        },
      )
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.cp_sync(path, new_path))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn cp_async(&self, path: PathBuf, new_path: PathBuf) -> FsResult<()> {
    let path_matches = path.starts_with(&self.prefix);
    let new_path_matches = new_path.starts_with(&self.prefix);
    if path_matches || new_path_matches {
      self
        .fs
        .cp_async(
          if path_matches {
            path.strip_prefix(&self.prefix).unwrap().to_owned()
          } else {
            path
          },
          if new_path_matches {
            new_path.strip_prefix(&self.prefix).unwrap().to_owned()
          } else {
            new_path
          },
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.cp_async(path, new_path).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn stat_sync(&self, path: &Path) -> FsResult<FsStat> {
    self.check_sync_api_allowed("stat_sync")?;
    if path.starts_with(&self.prefix) {
      self.fs.stat_sync(path.strip_prefix(&self.prefix).unwrap())
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.stat_sync(path))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn stat_async(&self, path: PathBuf) -> FsResult<FsStat> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .stat_async(path.strip_prefix(&self.prefix).unwrap().to_owned())
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.stat_async(path).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn lstat_sync(&self, path: &Path) -> FsResult<FsStat> {
    self.check_sync_api_allowed("lstat_sync")?;
    if path.starts_with(&self.prefix) {
      self.fs.lstat_sync(path.strip_prefix(&self.prefix).unwrap())
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.lstat_sync(path))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn lstat_async(&self, path: PathBuf) -> FsResult<FsStat> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .lstat_async(path.strip_prefix(&self.prefix).unwrap().to_owned())
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.lstat_async(path).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn realpath_sync(&self, path: &Path) -> FsResult<PathBuf> {
    self.check_sync_api_allowed("realpath_sync")?;
    if path.starts_with(&self.prefix) {
      self
        .fs
        .realpath_sync(path.strip_prefix(&self.prefix).unwrap())
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.realpath_sync(path))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn realpath_async(&self, path: PathBuf) -> FsResult<PathBuf> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .realpath_async(path.strip_prefix(&self.prefix).unwrap().to_owned())
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.realpath_async(path).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn read_dir_sync(&self, path: &Path) -> FsResult<Vec<FsDirEntry>> {
    self.check_sync_api_allowed("read_dir_sync")?;
    if path.starts_with(&self.prefix) {
      self
        .fs
        .read_dir_sync(path.strip_prefix(&self.prefix).unwrap())
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.read_dir_sync(path))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn read_dir_async(&self, path: PathBuf) -> FsResult<Vec<FsDirEntry>> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .read_dir_async(path.strip_prefix(&self.prefix).unwrap().to_owned())
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.read_dir_async(path).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn rename_sync(&self, oldpath: &Path, newpath: &Path) -> FsResult<()> {
    self.check_sync_api_allowed("rename_sync")?;

    let oldpath_matches = oldpath.starts_with(&self.prefix);
    let newpath_matches = newpath.starts_with(&self.prefix);
    if oldpath_matches || newpath_matches {
      self.fs.rename_sync(
        if oldpath_matches {
          oldpath.strip_prefix(&self.prefix).unwrap()
        } else {
          oldpath
        },
        if newpath_matches {
          newpath.strip_prefix(&self.prefix).unwrap()
        } else {
          newpath
        },
      )
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.rename_sync(oldpath, newpath))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn rename_async(
    &self,
    oldpath: PathBuf,
    newpath: PathBuf,
  ) -> FsResult<()> {
    let oldpath_matches = oldpath.starts_with(&self.prefix);
    let newpath_matches = newpath.starts_with(&self.prefix);
    if oldpath_matches || newpath_matches {
      self
        .fs
        .rename_async(
          if oldpath_matches {
            oldpath.strip_prefix(&self.prefix).unwrap().to_owned()
          } else {
            oldpath
          },
          if newpath_matches {
            newpath.strip_prefix(&self.prefix).unwrap().to_owned()
          } else {
            newpath
          },
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.rename_async(oldpath, newpath).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn link_sync(&self, oldpath: &Path, newpath: &Path) -> FsResult<()> {
    self.check_sync_api_allowed("link_sync")?;

    let oldpath_matches = oldpath.starts_with(&self.prefix);
    let newpath_matches = newpath.starts_with(&self.prefix);
    if oldpath_matches || newpath_matches {
      self.fs.link_sync(
        if oldpath_matches {
          oldpath.strip_prefix(&self.prefix).unwrap()
        } else {
          oldpath
        },
        if newpath_matches {
          newpath.strip_prefix(&self.prefix).unwrap()
        } else {
          newpath
        },
      )
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.link_sync(oldpath, newpath))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn link_async(
    &self,
    oldpath: PathBuf,
    newpath: PathBuf,
  ) -> FsResult<()> {
    let oldpath_matches = oldpath.starts_with(&self.prefix);
    let newpath_matches = newpath.starts_with(&self.prefix);
    if oldpath_matches || newpath_matches {
      self
        .fs
        .link_async(
          if oldpath_matches {
            oldpath.strip_prefix(&self.prefix).unwrap().to_owned()
          } else {
            oldpath
          },
          if newpath_matches {
            newpath.strip_prefix(&self.prefix).unwrap().to_owned()
          } else {
            newpath
          },
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.link_async(oldpath, newpath).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn symlink_sync(
    &self,
    oldpath: &Path,
    newpath: &Path,
    file_type: Option<FsFileType>,
  ) -> FsResult<()> {
    self.check_sync_api_allowed("symlink_sync")?;

    let oldpath_matches = oldpath.starts_with(&self.prefix);
    let newpath_matches = newpath.starts_with(&self.prefix);
    if oldpath_matches || newpath_matches {
      self.fs.symlink_sync(
        if oldpath_matches {
          oldpath.strip_prefix(&self.prefix).unwrap()
        } else {
          oldpath
        },
        if newpath_matches {
          newpath.strip_prefix(&self.prefix).unwrap()
        } else {
          newpath
        },
        file_type,
      )
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.symlink_sync(oldpath, newpath, file_type))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn symlink_async(
    &self,
    oldpath: PathBuf,
    newpath: PathBuf,
    file_type: Option<FsFileType>,
  ) -> FsResult<()> {
    let oldpath_matches = oldpath.starts_with(&self.prefix);
    let newpath_matches = newpath.starts_with(&self.prefix);
    if oldpath_matches || newpath_matches {
      self
        .fs
        .symlink_async(
          if oldpath_matches {
            oldpath.strip_prefix(&self.prefix).unwrap().to_owned()
          } else {
            oldpath
          },
          if newpath_matches {
            newpath.strip_prefix(&self.prefix).unwrap().to_owned()
          } else {
            newpath
          },
          file_type,
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.symlink_async(oldpath, newpath, file_type).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn read_link_sync(&self, path: &Path) -> FsResult<PathBuf> {
    self.check_sync_api_allowed("read_link_sync")?;
    if path.starts_with(&self.prefix) {
      self
        .fs
        .read_link_sync(path.strip_prefix(&self.prefix).unwrap())
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.read_link_sync(path))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn read_link_async(&self, path: PathBuf) -> FsResult<PathBuf> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .read_link_async(path.strip_prefix(&self.prefix).unwrap().to_owned())
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.read_link_async(path).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn truncate_sync(&self, path: &Path, len: u64) -> FsResult<()> {
    self.check_sync_api_allowed("truncate_sync")?;
    if path.starts_with(&self.prefix) {
      self
        .fs
        .truncate_sync(path.strip_prefix(&self.prefix).unwrap(), len)
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.truncate_sync(path, len))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn truncate_async(&self, path: PathBuf, len: u64) -> FsResult<()> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .truncate_async(
          path.strip_prefix(&self.prefix).unwrap().to_owned(),
          len,
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.truncate_async(path, len).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn utime_sync(
    &self,
    path: &Path,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    self.check_sync_api_allowed("utime_sync")?;
    if path.starts_with(&self.prefix) {
      self.fs.utime_sync(
        path.strip_prefix(&self.prefix).unwrap(),
        atime_secs,
        atime_nanos,
        mtime_secs,
        mtime_nanos,
      )
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| {
          it.utime_sync(path, atime_secs, atime_nanos, mtime_secs, mtime_nanos)
        })
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn utime_async(
    &self,
    path: PathBuf,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .utime_async(
          path.strip_prefix(&self.prefix).unwrap().to_owned(),
          atime_secs,
          atime_nanos,
          mtime_secs,
          mtime_nanos,
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.utime_async(path, atime_secs, atime_nanos, mtime_secs, mtime_nanos)
        .await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn lutime_sync(
    &self,
    path: &Path,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    self.check_sync_api_allowed("lutime_sync")?;
    if path.starts_with(&self.prefix) {
      self.fs.lutime_sync(
        path.strip_prefix(&self.prefix).unwrap(),
        atime_secs,
        atime_nanos,
        mtime_secs,
        mtime_nanos,
      )
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| {
          it.lutime_sync(path, atime_secs, atime_nanos, mtime_secs, mtime_nanos)
        })
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn lutime_async(
    &self,
    path: PathBuf,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .lutime_async(
          path.strip_prefix(&self.prefix).unwrap().to_owned(),
          atime_secs,
          atime_nanos,
          mtime_secs,
          mtime_nanos,
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.lutime_async(path, atime_secs, atime_nanos, mtime_secs, mtime_nanos)
        .await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn write_file_sync(
    &self,
    path: &Path,
    options: OpenOptions,
    access_check: Option<AccessCheckCb>,
    data: &[u8],
  ) -> FsResult<()> {
    self.check_sync_api_allowed("write_file_sync")?;
    if path.starts_with(&self.prefix) {
      self.fs.write_file_sync(
        path.strip_prefix(&self.prefix).unwrap(),
        options,
        access_check,
        data,
      )
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.write_file_sync(path, options, access_check, data))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn write_file_async<'a>(
    &'a self,
    path: PathBuf,
    options: OpenOptions,
    access_check: Option<AccessCheckCb<'a>>,
    data: Vec<u8>,
  ) -> FsResult<()> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .write_file_async(
          path.strip_prefix(&self.prefix).unwrap().to_owned(),
          options,
          access_check,
          data,
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.write_file_async(path, options, access_check, data).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn read_file_sync(
    &self,
    path: &Path,
    access_check: Option<AccessCheckCb>,
  ) -> FsResult<Cow<'static, [u8]>> {
    self.check_sync_api_allowed("read_file_sync")?;
    if path.starts_with(&self.prefix) {
      self
        .fs
        .read_file_sync(path.strip_prefix(&self.prefix).unwrap(), access_check)
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.read_file_sync(path, access_check))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn read_file_async<'a>(
    &'a self,
    path: PathBuf,
    access_check: Option<AccessCheckCb<'a>>,
  ) -> FsResult<Cow<'static, [u8]>> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .read_file_async(
          path.strip_prefix(&self.prefix).unwrap().to_owned(),
          access_check,
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.read_file_async(path, access_check).await
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn is_file_sync(&self, path: &Path) -> bool {
    if self.check_sync_api_allowed("is_file_sync").is_err() {
      return false;
    }
    if path.starts_with(&self.prefix) {
      self
        .fs
        .is_file_sync(path.strip_prefix(&self.prefix).unwrap())
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.is_file_sync(path))
        .unwrap_or_default()
    }
  }

  fn is_dir_sync(&self, path: &Path) -> bool {
    if self.check_sync_api_allowed("is_dir_sync").is_err() {
      return false;
    }
    if path.starts_with(&self.prefix) {
      self
        .fs
        .is_dir_sync(path.strip_prefix(&self.prefix).unwrap())
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.is_dir_sync(path))
        .unwrap_or_default()
    }
  }

  fn exists_sync(&self, path: &Path) -> bool {
    if self.check_sync_api_allowed("exists_sync").is_err() {
      return false;
    }
    if path.starts_with(&self.prefix) {
      self
        .fs
        .exists_sync(path.strip_prefix(&self.prefix).unwrap())
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.exists_sync(path))
        .unwrap_or_default()
    }
  }

  fn read_text_file_lossy_sync(
    &self,
    path: &Path,
    access_check: Option<AccessCheckCb>,
  ) -> FsResult<Cow<'static, str>> {
    self.check_sync_api_allowed("read_text_file_lossy_sync")?;
    if path.starts_with(&self.prefix) {
      self.fs.read_text_file_lossy_sync(
        path.strip_prefix(&self.prefix).unwrap(),
        access_check,
      )
    } else {
      self
        .base_fs
        .as_ref()
        .map(|it| it.read_text_file_lossy_sync(path, access_check))
        .unwrap_or_else(|| Err(FsError::NotSupported))
    }
  }

  async fn read_text_file_lossy_async<'a>(
    &'a self,
    path: PathBuf,
    access_check: Option<AccessCheckCb<'a>>,
  ) -> FsResult<Cow<'static, str>> {
    if path.starts_with(&self.prefix) {
      self
        .fs
        .read_text_file_lossy_async(
          path.strip_prefix(&self.prefix).unwrap().to_owned(),
          access_check,
        )
        .await
    } else if let Some(fs) = self.base_fs.as_ref() {
      fs.read_text_file_lossy_async(path, access_check).await
    } else {
      Err(FsError::NotSupported)
    }
  }
}

impl<FileSystem> PrefixFs<FileSystem> {
  fn check_sync_api_allowed(&self, name: &'static str) -> FsResult<()> {
    if !self.check_sync_api {
      return Ok(());
    }
    let Some(state) = self.runtime_state.as_ref() else {
      return Ok(());
    };

    if state.is_init() {
      Ok(())
    } else {
      Err(FsError::Io(io::Error::other(anyhow!(format!(
        "invoking {name} is not allowed in the current context"
      )))))
    }
  }
}
