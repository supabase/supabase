// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

use deno_fs::AccessCheckCb;
use deno_fs::FileSystem;
use deno_fs::FsDirEntry;
use deno_fs::FsFileType;
use deno_fs::OpenOptions;
use deno_fs::RealFs;
use deno_io::fs::File;
use deno_io::fs::FsError;
use deno_io::fs::FsResult;
use deno_io::fs::FsStat;
use std::io;
use std::path::Path;
use std::path::PathBuf;
use std::rc::Rc;
use std::sync::Arc;

use crate::rt::IO_RT;

use super::virtual_fs::FileBackedVfs;

#[derive(Debug, Clone)]
pub struct DenoCompileFileSystem(Arc<FileBackedVfs>, bool);

impl DenoCompileFileSystem {
  pub fn new(vfs: FileBackedVfs) -> Self {
    Self(Arc::new(vfs), true)
  }

  pub fn from_rc(vfs: Arc<FileBackedVfs>) -> Self {
    Self(vfs, true)
  }

  pub fn use_real_fs(mut self, value: bool) -> Self {
    self.1 = value;
    self
  }

  pub fn file_backed_vfs(&self) -> Arc<FileBackedVfs> {
    self.0.clone()
  }

  fn error_if_in_vfs(&self, path: &Path) -> FsResult<()> {
    if self.0.is_path_within(path) {
      Err(FsError::NotSupported)
    } else {
      Ok(())
    }
  }

  fn error_if_no_use_real_fs(&self, not_found: bool) -> FsResult<()> {
    if !self.1 {
      if not_found {
        return Err(FsError::Io(io::Error::from(io::ErrorKind::NotFound)));
      }
      Err(FsError::NotSupported)
    } else {
      Ok(())
    }
  }

  async fn copy_to_real_path_async(
    &self,
    oldpath: &Path,
    newpath: &Path,
  ) -> FsResult<()> {
    let old_file = self.0.file_entry(oldpath)?;
    let old_file_bytes = self.0.read_file_all(old_file).await?;

    self.error_if_no_use_real_fs(true)?;
    RealFs
      .write_file_async(
        newpath.to_path_buf(),
        OpenOptions {
          read: false,
          write: true,
          create: true,
          truncate: true,
          append: false,
          create_new: false,
          mode: None,
        },
        None,
        old_file_bytes,
      )
      .await
  }
}

#[async_trait::async_trait(?Send)]
impl FileSystem for DenoCompileFileSystem {
  fn cwd(&self) -> FsResult<PathBuf> {
    self.error_if_no_use_real_fs(false)?;
    RealFs.cwd()
  }

  fn tmp_dir(&self) -> FsResult<PathBuf> {
    self.error_if_no_use_real_fs(false)?;
    RealFs.tmp_dir()
  }

  fn chdir(&self, path: &Path) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(path)?;
    RealFs.chdir(path)
  }

  fn umask(&self, mask: Option<u32>) -> FsResult<u32> {
    self.error_if_no_use_real_fs(false)?;
    RealFs.umask(mask)
  }

  fn open_sync(
    &self,
    path: &Path,
    options: OpenOptions,
    _access_check: Option<AccessCheckCb>,
  ) -> FsResult<Rc<dyn File>> {
    if self.0.is_path_within(path) {
      Ok(self.0.open_file(path)?)
    } else {
      self.error_if_no_use_real_fs(true)?;
      RealFs.open_sync(path, options, None)
    }
  }
  async fn open_async<'a>(
    &'a self,
    path: PathBuf,
    options: OpenOptions,
    _access_check: Option<AccessCheckCb<'a>>,
  ) -> FsResult<Rc<dyn File>> {
    if self.0.is_path_within(&path) {
      Ok(self.0.open_file(&path)?)
    } else {
      self.error_if_no_use_real_fs(true)?;
      RealFs.open_async(path, options, None).await
    }
  }

  fn mkdir_sync(
    &self,
    path: &Path,
    recursive: bool,
    mode: Option<u32>,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(path)?;
    RealFs.mkdir_sync(path, recursive, mode)
  }
  async fn mkdir_async(
    &self,
    path: PathBuf,
    recursive: bool,
    mode: Option<u32>,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(&path)?;
    RealFs.mkdir_async(path, recursive, mode).await
  }

  fn chmod_sync(&self, path: &Path, mode: u32) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(path)?;
    RealFs.chmod_sync(path, mode)
  }
  async fn chmod_async(&self, path: PathBuf, mode: u32) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(&path)?;
    RealFs.chmod_async(path, mode).await
  }

  fn chown_sync(
    &self,
    path: &Path,
    uid: Option<u32>,
    gid: Option<u32>,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(path)?;
    RealFs.chown_sync(path, uid, gid)
  }
  async fn chown_async(
    &self,
    path: PathBuf,
    uid: Option<u32>,
    gid: Option<u32>,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(&path)?;
    RealFs.chown_async(path, uid, gid).await
  }

  fn lchown_sync(
    &self,
    path: &Path,
    uid: Option<u32>,
    gid: Option<u32>,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(path)?;
    RealFs.lchown_sync(path, uid, gid)
  }
  async fn lchown_async(
    &self,
    path: PathBuf,
    uid: Option<u32>,
    gid: Option<u32>,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(&path)?;
    RealFs.lchown_async(path, uid, gid).await
  }

  fn remove_sync(&self, path: &Path, recursive: bool) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(path)?;
    RealFs.remove_sync(path, recursive)
  }
  async fn remove_async(&self, path: PathBuf, recursive: bool) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(&path)?;
    RealFs.remove_async(path, recursive).await
  }

  fn copy_file_sync(&self, oldpath: &Path, newpath: &Path) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(newpath)?;
    if self.0.is_path_within(oldpath) {
      std::thread::scope(|s| {
        let this = self.clone();

        s.spawn(move || {
          IO_RT.block_on(async move {
            this.copy_to_real_path_async(oldpath, newpath).await
          })
        })
        .join()
        .unwrap()
      })
    } else {
      if !self.1 {
        return Err(FsError::NotSupported);
      }
      RealFs.copy_file_sync(oldpath, newpath)
    }
  }
  async fn copy_file_async(
    &self,
    oldpath: PathBuf,
    newpath: PathBuf,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(&newpath)?;
    if self.0.is_path_within(&oldpath) {
      let fs = self.clone();
      fs.copy_to_real_path_async(&oldpath, &newpath).await
    } else {
      RealFs.copy_file_async(oldpath, newpath).await
    }
  }

  fn cp_sync(&self, from: &Path, to: &Path) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(to)?;

    RealFs.cp_sync(from, to)
  }
  async fn cp_async(&self, from: PathBuf, to: PathBuf) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(&to)?;

    RealFs.cp_async(from, to).await
  }

  fn stat_sync(&self, path: &Path) -> FsResult<FsStat> {
    if self.0.is_path_within(path) {
      Ok(self.0.stat(path)?)
    } else {
      self.error_if_no_use_real_fs(true)?;
      RealFs.stat_sync(path)
    }
  }
  async fn stat_async(&self, path: PathBuf) -> FsResult<FsStat> {
    if self.0.is_path_within(&path) {
      Ok(self.0.stat(&path)?)
    } else {
      self.error_if_no_use_real_fs(true)?;
      RealFs.stat_async(path).await
    }
  }

  fn lstat_sync(&self, path: &Path) -> FsResult<FsStat> {
    if self.0.is_path_within(path) {
      Ok(self.0.lstat(path)?)
    } else {
      self.error_if_no_use_real_fs(true)?;
      RealFs.lstat_sync(path)
    }
  }
  async fn lstat_async(&self, path: PathBuf) -> FsResult<FsStat> {
    if self.0.is_path_within(&path) {
      Ok(self.0.lstat(&path)?)
    } else {
      self.error_if_no_use_real_fs(true)?;
      RealFs.lstat_async(path).await
    }
  }

  fn realpath_sync(&self, path: &Path) -> FsResult<PathBuf> {
    if self.0.is_path_within(path) {
      Ok(self.0.canonicalize(path)?)
    } else {
      self.error_if_no_use_real_fs(true)?;
      RealFs.realpath_sync(path)
    }
  }
  async fn realpath_async(&self, path: PathBuf) -> FsResult<PathBuf> {
    if self.0.is_path_within(&path) {
      Ok(self.0.canonicalize(&path)?)
    } else {
      self.error_if_no_use_real_fs(true)?;
      RealFs.realpath_async(path).await
    }
  }

  fn read_dir_sync(&self, path: &Path) -> FsResult<Vec<FsDirEntry>> {
    if self.0.is_path_within(path) {
      Ok(self.0.read_dir(path)?)
    } else {
      self.error_if_no_use_real_fs(true)?;
      RealFs.read_dir_sync(path)
    }
  }
  async fn read_dir_async(&self, path: PathBuf) -> FsResult<Vec<FsDirEntry>> {
    if self.0.is_path_within(&path) {
      Ok(self.0.read_dir(&path)?)
    } else {
      self.error_if_no_use_real_fs(true)?;
      RealFs.read_dir_async(path).await
    }
  }

  fn rename_sync(&self, oldpath: &Path, newpath: &Path) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(oldpath)?;
    self.error_if_in_vfs(newpath)?;
    RealFs.rename_sync(oldpath, newpath)
  }
  async fn rename_async(
    &self,
    oldpath: PathBuf,
    newpath: PathBuf,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(&oldpath)?;
    self.error_if_in_vfs(&newpath)?;
    RealFs.rename_async(oldpath, newpath).await
  }

  fn link_sync(&self, oldpath: &Path, newpath: &Path) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(oldpath)?;
    self.error_if_in_vfs(newpath)?;
    RealFs.link_sync(oldpath, newpath)
  }
  async fn link_async(
    &self,
    oldpath: PathBuf,
    newpath: PathBuf,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(&oldpath)?;
    self.error_if_in_vfs(&newpath)?;
    RealFs.link_async(oldpath, newpath).await
  }

  fn symlink_sync(
    &self,
    oldpath: &Path,
    newpath: &Path,
    file_type: Option<FsFileType>,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(oldpath)?;
    self.error_if_in_vfs(newpath)?;
    RealFs.symlink_sync(oldpath, newpath, file_type)
  }
  async fn symlink_async(
    &self,
    oldpath: PathBuf,
    newpath: PathBuf,
    file_type: Option<FsFileType>,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(&oldpath)?;
    self.error_if_in_vfs(&newpath)?;
    RealFs.symlink_async(oldpath, newpath, file_type).await
  }

  fn read_link_sync(&self, path: &Path) -> FsResult<PathBuf> {
    if self.0.is_path_within(path) {
      Ok(self.0.read_link(path)?)
    } else {
      self.error_if_no_use_real_fs(true)?;
      RealFs.read_link_sync(path)
    }
  }
  async fn read_link_async(&self, path: PathBuf) -> FsResult<PathBuf> {
    if self.0.is_path_within(&path) {
      Ok(self.0.read_link(&path)?)
    } else {
      self.error_if_no_use_real_fs(true)?;
      RealFs.read_link_async(path).await
    }
  }

  fn truncate_sync(&self, path: &Path, len: u64) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(path)?;
    RealFs.truncate_sync(path, len)
  }
  async fn truncate_async(&self, path: PathBuf, len: u64) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(&path)?;
    RealFs.truncate_async(path, len).await
  }

  fn utime_sync(
    &self,
    path: &Path,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(path)?;
    RealFs.utime_sync(path, atime_secs, atime_nanos, mtime_secs, mtime_nanos)
  }
  async fn utime_async(
    &self,
    path: PathBuf,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(&path)?;
    RealFs
      .utime_async(path, atime_secs, atime_nanos, mtime_secs, mtime_nanos)
      .await
  }

  fn lutime_sync(
    &self,
    path: &Path,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(path)?;
    RealFs.lutime_sync(path, atime_secs, atime_nanos, mtime_secs, mtime_nanos)
  }
  async fn lutime_async(
    &self,
    path: PathBuf,
    atime_secs: i64,
    atime_nanos: u32,
    mtime_secs: i64,
    mtime_nanos: u32,
  ) -> FsResult<()> {
    self.error_if_no_use_real_fs(false)?;
    self.error_if_in_vfs(&path)?;
    RealFs
      .lutime_async(path, atime_secs, atime_nanos, mtime_secs, mtime_nanos)
      .await
  }
}
