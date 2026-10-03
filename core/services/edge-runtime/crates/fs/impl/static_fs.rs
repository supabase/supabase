use std::borrow::Cow;
use std::fmt::Debug;
use std::io;
use std::path::Path;
use std::path::PathBuf;
use std::rc::Rc;
use std::sync::Arc;

use deno::standalone::binary::NodeModules;
use deno_core::normalize_path;
use deno_fs::AccessCheckCb;
use deno_fs::FsDirEntry;
use deno_fs::FsFileType;
use deno_fs::OpenOptions;
use deno_io::fs::File;
use deno_io::fs::FsError;
use deno_io::fs::FsResult;
use deno_io::fs::FsStat;
use deno_npm::resolution::ValidSerializedNpmResolutionSnapshot;
use eszip_trait::EszipStaticFiles;

use crate::rt::IO_RT;
use crate::FileBackedVfs;

#[derive(Debug, Clone)]
pub struct StaticFs {
  static_files: EszipStaticFiles,
  base_dir_path: PathBuf,
  vfs_path: PathBuf,
  byonm_node_modules_path: Option<PathBuf>,
  snapshot: Option<ValidSerializedNpmResolutionSnapshot>,
  vfs: Arc<FileBackedVfs>,
}

impl StaticFs {
  pub fn new(
    node_modules: Option<NodeModules>,
    static_files: EszipStaticFiles,
    base_dir_path: PathBuf,
    vfs_path: PathBuf,
    vfs: Arc<FileBackedVfs>,
    snapshot: Option<ValidSerializedNpmResolutionSnapshot>,
  ) -> Self {
    let byonm_node_modules_path = if let Some(NodeModules::Byonm {
      root_node_modules_dir: Some(path),
    }) = node_modules
    {
      Some(vfs_path.join(path))
    } else {
      None
    };

    Self {
      vfs,
      static_files,
      base_dir_path,
      byonm_node_modules_path,
      vfs_path,
      snapshot,
    }
  }

  pub fn is_valid_npm_package(&self, path: &Path) -> bool {
    if self.snapshot.is_some() {
      let vfs_path = self.vfs_path.clone();
      path.starts_with(vfs_path)
    } else {
      false
    }
  }
}

#[async_trait::async_trait(?Send)]
impl deno_fs::FileSystem for StaticFs {
  fn cwd(&self) -> FsResult<PathBuf> {
    Ok(PathBuf::new())
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
    _options: OpenOptions,
    _access_check: Option<AccessCheckCb>,
  ) -> FsResult<Rc<dyn File>> {
    if self.vfs.is_path_within(path) {
      Ok(self.vfs.open_file(path)?)
    } else {
      Err(FsError::Io(io::Error::from(io::ErrorKind::NotFound)))
    }
  }

  async fn open_async<'a>(
    &'a self,
    path: PathBuf,
    _options: OpenOptions,
    _access_check: Option<AccessCheckCb<'a>>,
  ) -> FsResult<Rc<dyn File>> {
    if self.vfs.is_path_within(&path) {
      Ok(self.vfs.open_file(&path)?)
    } else {
      Err(FsError::Io(io::Error::from(io::ErrorKind::NotFound)))
    }
  }

  fn mkdir_sync(
    &self,
    _path: &Path,
    _recursive: bool,
    _mode: Option<u32>,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn mkdir_async(
    &self,
    _path: PathBuf,
    _recursive: bool,
    _mode: Option<u32>,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
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

  fn remove_sync(&self, _path: &Path, _recursive: bool) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn remove_async(
    &self,
    _path: PathBuf,
    _recursive: bool,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn copy_file_sync(&self, _oldpath: &Path, _newpath: &Path) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn copy_file_async(
    &self,
    _oldpath: PathBuf,
    _newpath: PathBuf,
  ) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn cp_sync(&self, _path: &Path, _new_path: &Path) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  async fn cp_async(&self, _path: PathBuf, _new_path: PathBuf) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

  fn stat_sync(&self, path: &Path) -> FsResult<FsStat> {
    if self.vfs.is_path_within(path) {
      Ok(self.vfs.stat(path)?)
    } else {
      Err(FsError::NotSupported)
    }
  }

  async fn stat_async(&self, path: PathBuf) -> FsResult<FsStat> {
    if self.vfs.is_path_within(&path) {
      Ok(self.vfs.stat(&path)?)
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn lstat_sync(&self, path: &Path) -> FsResult<FsStat> {
    if self.vfs.is_path_within(path) {
      Ok(self.vfs.lstat(path)?)
    } else {
      Err(FsError::NotSupported)
    }
  }

  async fn lstat_async(&self, path: PathBuf) -> FsResult<FsStat> {
    if self.vfs.is_path_within(&path) {
      Ok(self.vfs.lstat(&path)?)
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn realpath_sync(&self, path: &Path) -> FsResult<PathBuf> {
    if self.vfs.is_path_within(path) {
      Ok(self.vfs.canonicalize(path)?)
    } else {
      Err(FsError::NotSupported)
    }
  }

  async fn realpath_async(&self, path: PathBuf) -> FsResult<PathBuf> {
    if self.vfs.is_path_within(&path) {
      Ok(self.vfs.canonicalize(&path)?)
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn read_dir_sync(&self, path: &Path) -> FsResult<Vec<FsDirEntry>> {
    if self.vfs.is_path_within(path) {
      Ok(self.vfs.read_dir(path)?)
    } else {
      Err(FsError::NotSupported)
    }
  }

  async fn read_dir_async(&self, path: PathBuf) -> FsResult<Vec<FsDirEntry>> {
    if self.vfs.is_path_within(&path) {
      Ok(self.vfs.read_dir(&path)?)
    } else {
      Err(FsError::NotSupported)
    }
  }

  fn rename_sync(&self, _oldpath: &Path, _newpath: &Path) -> FsResult<()> {
    Err(FsError::NotSupported)
  }

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

  fn read_link_sync(&self, path: &Path) -> FsResult<PathBuf> {
    if self.vfs.is_path_within(path) {
      Ok(self.vfs.read_link(path)?)
    } else {
      Err(FsError::NotSupported)
    }
  }

  async fn read_link_async(&self, path: PathBuf) -> FsResult<PathBuf> {
    if self.vfs.is_path_within(&path) {
      Ok(self.vfs.read_link(&path)?)
    } else {
      Err(FsError::NotSupported)
    }
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

  fn read_file_sync(
    &self,
    path: &Path,
    _access_check: Option<AccessCheckCb>,
  ) -> FsResult<Cow<'static, [u8]>> {
    let is_npm = self.is_valid_npm_package(path);
    let is_byonm_path = self
      .byonm_node_modules_path
      .as_ref()
      .map(|it| path.starts_with(it))
      .unwrap_or_default();

    if is_npm || is_byonm_path {
      let options = OpenOptions::read();
      let file = self.open_sync(path, options, None)?;
      let buf = file.read_all_sync()?;
      Ok(buf)
    } else {
      let eszip = self.vfs.eszip.as_ref();
      let path = if path.is_relative() {
        self.base_dir_path.join(path)
      } else {
        path.to_path_buf()
      };

      let normalized = normalize_path(path);

      if let Some(file) = self
        .static_files
        .get(&normalized)
        .and_then(|it| eszip.ensure_module(it))
      {
        let Some(res) = std::thread::scope(|s| {
          s.spawn(move || IO_RT.block_on(async move { file.source().await }))
            .join()
            .unwrap()
        }) else {
          return Err(
            std::io::Error::new(
              std::io::ErrorKind::NotFound,
              "No content available",
            )
            .into(),
          );
        };

        Ok(Cow::Owned(res.to_vec()))
      } else {
        Err(
          std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("path not found: {}", normalized.to_string_lossy()),
          )
          .into(),
        )
      }
    }
  }

  async fn read_file_async<'a>(
    &'a self,
    path: PathBuf,
    access_check: Option<AccessCheckCb<'a>>,
  ) -> FsResult<Cow<'static, [u8]>> {
    self.read_file_sync(path.as_path(), access_check)
  }
}
