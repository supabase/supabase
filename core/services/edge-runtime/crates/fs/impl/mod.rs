use std::io;
use std::path::Path;
use std::path::PathBuf;

use deno_io::fs::FsResult;
use normalize_path::NormalizePath;

pub mod deno_compile_fs;
pub mod prefix_fs;
pub mod s3_fs;
pub mod static_fs;
pub mod tmp_fs;
pub mod virtual_fs;

trait TryNormalizePath {
  fn try_normalize(&self) -> FsResult<PathBuf>;
}

impl TryNormalizePath for Path {
  fn try_normalize(&self) -> FsResult<PathBuf> {
    NormalizePath::try_normalize(self).ok_or(deno_io::fs::FsError::Io(
      io::Error::from(io::ErrorKind::InvalidInput),
    ))
  }
}
