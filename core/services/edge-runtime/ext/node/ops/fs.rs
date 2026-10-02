// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::cell::RefCell;
use std::rc::Rc;

use deno_core::op2;
use deno_core::OpState;
use deno_fs::FileSystemRc;
use serde::Serialize;

use crate::NodePermissions;

#[derive(Debug, thiserror::Error)]
pub enum FsError {
  #[error(transparent)]
  Permission(#[from] deno_permissions::PermissionCheckError),
  #[error("{0}")]
  Io(#[from] std::io::Error),
  #[cfg(windows)]
  #[error("Path has no root.")]
  PathHasNoRoot,
  #[cfg(not(any(unix, windows)))]
  #[error("Unsupported platform.")]
  UnsupportedPlatform,
  #[error(transparent)]
  Fs(#[from] deno_io::fs::FsError),
}

#[op2(fast, stack_trace)]
pub fn op_node_fs_exists_sync<P>(
  state: &mut OpState,
  #[string] path: String,
) -> Result<bool, deno_core::error::AnyError>
where
  P: NodePermissions + 'static,
{
  let path = state
    .borrow_mut::<P>()
    .check_read_with_api_name(&path, Some("node:fs.existsSync()"))?;
  let fs = state.borrow::<FileSystemRc>();
  Ok(fs.exists_sync(&path))
}

#[op2(async, stack_trace)]
pub async fn op_node_fs_exists<P>(
  state: Rc<RefCell<OpState>>,
  #[string] path: String,
) -> Result<bool, FsError>
where
  P: NodePermissions + 'static,
{
  let (fs, path) = {
    let mut state = state.borrow_mut();
    let path = state
      .borrow_mut::<P>()
      .check_read_with_api_name(&path, Some("node:fs.exists()"))?;
    (state.borrow::<FileSystemRc>().clone(), path)
  };

  Ok(fs.exists_async(path).await?)
}

#[op2(fast, stack_trace)]
pub fn op_node_cp_sync<P>(
  state: &mut OpState,
  #[string] path: &str,
  #[string] new_path: &str,
) -> Result<(), FsError>
where
  P: NodePermissions + 'static,
{
  let path = state
    .borrow_mut::<P>()
    .check_read_with_api_name(path, Some("node:fs.cpSync"))?;
  let new_path = state
    .borrow_mut::<P>()
    .check_write_with_api_name(new_path, Some("node:fs.cpSync"))?;

  let fs = state.borrow::<FileSystemRc>();
  fs.cp_sync(&path, &new_path)?;
  Ok(())
}

#[op2(async, stack_trace)]
pub async fn op_node_cp<P>(
  state: Rc<RefCell<OpState>>,
  #[string] path: String,
  #[string] new_path: String,
) -> Result<(), FsError>
where
  P: NodePermissions + 'static,
{
  let (fs, path, new_path) = {
    let mut state = state.borrow_mut();
    let path = state
      .borrow_mut::<P>()
      .check_read_with_api_name(&path, Some("node:fs.cpSync"))?;
    let new_path = state
      .borrow_mut::<P>()
      .check_write_with_api_name(&new_path, Some("node:fs.cpSync"))?;
    (state.borrow::<FileSystemRc>().clone(), path, new_path)
  };

  fs.cp_async(path, new_path).await?;
  Ok(())
}

#[derive(Debug, Serialize)]
pub struct StatFs {
  #[serde(rename = "type")]
  pub typ: u64,
  pub bsize: u64,
  pub blocks: u64,
  pub bfree: u64,
  pub bavail: u64,
  pub files: u64,
  pub ffree: u64,
}

#[op2(stack_trace)]
#[serde]
pub fn op_node_statfs<P>(
  state: Rc<RefCell<OpState>>,
  #[string] path: String,
  bigint: bool,
) -> Result<StatFs, FsError>
where
  P: NodePermissions + 'static,
{
  let path = {
    let mut state = state.borrow_mut();
    let path = state
      .borrow_mut::<P>()
      .check_read_with_api_name(&path, Some("node:fs.statfs"))?;
    state
      .borrow_mut::<P>()
      .check_sys("statfs", "node:fs.statfs")?;
    path
  };
  #[cfg(unix)]
  {
    use std::os::unix::ffi::OsStrExt;

    let path = path.as_os_str();
    let mut cpath = path.as_bytes().to_vec();
    cpath.push(0);
    if bigint {
      #[cfg(not(any(
        target_os = "macos",
        target_os = "freebsd",
        target_os = "openbsd"
      )))]
      // SAFETY: `cpath` is NUL-terminated and result is pointer to valid statfs memory.
      let (code, result) = unsafe {
        let mut result: libc::statfs64 = std::mem::zeroed();
        (libc::statfs64(cpath.as_ptr() as _, &mut result), result)
      };
      #[cfg(any(
        target_os = "macos",
        target_os = "freebsd",
        target_os = "openbsd"
      ))]
      // SAFETY: `cpath` is NUL-terminated and result is pointer to valid statfs memory.
      let (code, result) = unsafe {
        let mut result: libc::statfs = std::mem::zeroed();
        (libc::statfs(cpath.as_ptr() as _, &mut result), result)
      };
      if code == -1 {
        return Err(std::io::Error::last_os_error().into());
      }
      Ok(StatFs {
        #[cfg(not(target_os = "openbsd"))]
        typ: result.f_type as _,
        #[cfg(target_os = "openbsd")]
        typ: 0 as _,
        bsize: result.f_bsize as _,
        blocks: result.f_blocks as _,
        bfree: result.f_bfree as _,
        bavail: result.f_bavail as _,
        files: result.f_files as _,
        ffree: result.f_ffree as _,
      })
    } else {
      // SAFETY: `cpath` is NUL-terminated and result is pointer to valid statfs memory.
      let (code, result) = unsafe {
        let mut result: libc::statfs = std::mem::zeroed();
        (libc::statfs(cpath.as_ptr() as _, &mut result), result)
      };
      if code == -1 {
        return Err(std::io::Error::last_os_error().into());
      }
      Ok(StatFs {
        #[cfg(not(target_os = "openbsd"))]
        typ: result.f_type as _,
        #[cfg(target_os = "openbsd")]
        typ: 0 as _,
        bsize: result.f_bsize as _,
        blocks: result.f_blocks as _,
        bfree: result.f_bfree as _,
        bavail: result.f_bavail as _,
        files: result.f_files as _,
        ffree: result.f_ffree as _,
      })
    }
  }
  #[cfg(windows)]
  {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::GetDiskFreeSpaceW;

    let _ = bigint;
    // Using a vfs here doesn't make sense, it won't align with the windows API
    // call below.
    #[allow(clippy::disallowed_methods)]
    let path = path.canonicalize()?;
    let root = path.ancestors().last().ok_or(FsError::PathHasNoRoot)?;
    let mut root = OsStr::new(root).encode_wide().collect::<Vec<_>>();
    root.push(0);
    let mut sectors_per_cluster = 0;
    let mut bytes_per_sector = 0;
    let mut available_clusters = 0;
    let mut total_clusters = 0;
    let mut code = 0;
    let mut retries = 0;
    // We retry here because libuv does: https://github.com/libuv/libuv/blob/fa6745b4f26470dae5ee4fcbb1ee082f780277e0/src/win/fs.c#L2705
    while code == 0 && retries < 2 {
      // SAFETY: Normal GetDiskFreeSpaceW usage.
      code = unsafe {
        GetDiskFreeSpaceW(
          root.as_ptr(),
          &mut sectors_per_cluster,
          &mut bytes_per_sector,
          &mut available_clusters,
          &mut total_clusters,
        )
      };
      retries += 1;
    }
    if code == 0 {
      return Err(std::io::Error::last_os_error().into());
    }
    Ok(StatFs {
      typ: 0,
      bsize: (bytes_per_sector * sectors_per_cluster) as _,
      blocks: total_clusters as _,
      bfree: available_clusters as _,
      bavail: available_clusters as _,
      files: 0,
      ffree: 0,
    })
  }
  #[cfg(not(any(unix, windows)))]
  {
    let _ = path;
    let _ = bigint;
    Err(FsError::UnsupportedPlatform)
  }
}

#[op2(fast, stack_trace)]
pub fn op_node_lutimes_sync<P>(
  state: &mut OpState,
  #[string] path: &str,
  #[number] atime_secs: i64,
  #[smi] atime_nanos: u32,
  #[number] mtime_secs: i64,
  #[smi] mtime_nanos: u32,
) -> Result<(), FsError>
where
  P: NodePermissions + 'static,
{
  let path = state
    .borrow_mut::<P>()
    .check_write_with_api_name(path, Some("node:fs.lutimes"))?;

  let fs = state.borrow::<FileSystemRc>();
  fs.lutime_sync(&path, atime_secs, atime_nanos, mtime_secs, mtime_nanos)?;
  Ok(())
}

#[op2(async, stack_trace)]
pub async fn op_node_lutimes<P>(
  state: Rc<RefCell<OpState>>,
  #[string] path: String,
  #[number] atime_secs: i64,
  #[smi] atime_nanos: u32,
  #[number] mtime_secs: i64,
  #[smi] mtime_nanos: u32,
) -> Result<(), FsError>
where
  P: NodePermissions + 'static,
{
  let (fs, path) = {
    let mut state = state.borrow_mut();
    let path = state
      .borrow_mut::<P>()
      .check_write_with_api_name(&path, Some("node:fs.lutimesSync"))?;
    (state.borrow::<FileSystemRc>().clone(), path)
  };

  fs.lutime_async(path, atime_secs, atime_nanos, mtime_secs, mtime_nanos)
    .await?;

  Ok(())
}

#[op2(stack_trace)]
pub fn op_node_lchown_sync<P>(
  state: &mut OpState,
  #[string] path: String,
  uid: Option<u32>,
  gid: Option<u32>,
) -> Result<(), FsError>
where
  P: NodePermissions + 'static,
{
  let path = state
    .borrow_mut::<P>()
    .check_write_with_api_name(&path, Some("node:fs.lchownSync"))?;
  let fs = state.borrow::<FileSystemRc>();
  fs.lchown_sync(&path, uid, gid)?;
  Ok(())
}

#[op2(async, stack_trace)]
pub async fn op_node_lchown<P>(
  state: Rc<RefCell<OpState>>,
  #[string] path: String,
  uid: Option<u32>,
  gid: Option<u32>,
) -> Result<(), FsError>
where
  P: NodePermissions + 'static,
{
  let (fs, path) = {
    let mut state = state.borrow_mut();
    let path = state
      .borrow_mut::<P>()
      .check_write_with_api_name(&path, Some("node:fs.lchown"))?;
    (state.borrow::<FileSystemRc>().clone(), path)
  };
  fs.lchown_async(path, uid, gid).await?;
  Ok(())
}
