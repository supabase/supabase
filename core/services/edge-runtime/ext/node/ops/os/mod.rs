// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::mem::MaybeUninit;

use crate::NodePermissions;
use deno_core::op2;
use deno_core::OpState;

mod cpus;
pub mod priority;

#[derive(Debug, thiserror::Error)]
pub enum OsError {
  #[error(transparent)]
  Priority(priority::PriorityError),
  #[error(transparent)]
  Permission(#[from] deno_permissions::PermissionCheckError),
  #[error("Failed to get cpu info")]
  FailedToGetCpuInfo,
  #[error("Failed to get user info")]
  FailedToGetUserInfo(#[source] std::io::Error),
}

#[op2(fast, stack_trace)]
pub fn op_node_os_get_priority<P>(
  state: &mut OpState,
  pid: u32,
) -> Result<i32, OsError>
where
  P: NodePermissions + 'static,
{
  {
    let permissions = state.borrow_mut::<P>();
    permissions.check_sys("getPriority", "node:os.getPriority()")?;
  }

  priority::get_priority(pid).map_err(OsError::Priority)
}

#[op2(fast, stack_trace)]
pub fn op_node_os_set_priority<P>(
  state: &mut OpState,
  pid: u32,
  priority: i32,
) -> Result<(), OsError>
where
  P: NodePermissions + 'static,
{
  {
    let permissions = state.borrow_mut::<P>();
    permissions.check_sys("setPriority", "node:os.setPriority()")?;
  }

  priority::set_priority(pid, priority).map_err(OsError::Priority)
}

#[derive(serde::Serialize)]
pub struct UserInfo {
  username: String,
  homedir: String,
  shell: Option<String>,
}

#[cfg(unix)]
fn get_user_info(uid: u32) -> Result<UserInfo, OsError> {
  use std::ffi::CStr;
  let mut pw: MaybeUninit<libc::passwd> = MaybeUninit::uninit();
  let mut result: *mut libc::passwd = std::ptr::null_mut();
  // SAFETY: libc call, no invariants
  let max_buf_size = unsafe { libc::sysconf(libc::_SC_GETPW_R_SIZE_MAX) };
  let buf_size = if max_buf_size < 0 {
    // from the man page
    16_384
  } else {
    max_buf_size as usize
  };
  let mut buf = {
    let mut b = Vec::<MaybeUninit<libc::c_char>>::with_capacity(buf_size);
    // SAFETY: MaybeUninit has no initialization invariants, and len == cap
    unsafe {
      b.set_len(buf_size);
    }
    b
  };
  // SAFETY: libc call, args are correct
  let s = unsafe {
    libc::getpwuid_r(
      uid,
      pw.as_mut_ptr(),
      buf.as_mut_ptr().cast(),
      buf_size,
      std::ptr::addr_of_mut!(result),
    )
  };
  if result.is_null() {
    if s != 0 {
      return Err(
        OsError::FailedToGetUserInfo(std::io::Error::last_os_error()),
      );
    } else {
      return Err(OsError::FailedToGetUserInfo(std::io::Error::from(
        std::io::ErrorKind::NotFound,
      )));
    }
  }
  // SAFETY: pw was initialized by the call to `getpwuid_r` above
  let pw = unsafe { pw.assume_init() };
  // SAFETY: initialized above, pw alive until end of function, nul terminated
  let username = unsafe { CStr::from_ptr(pw.pw_name) };
  // SAFETY: initialized above, pw alive until end of function, nul terminated
  let homedir = unsafe { CStr::from_ptr(pw.pw_dir) };
  // SAFETY: initialized above, pw alive until end of function, nul terminated
  let shell = unsafe { CStr::from_ptr(pw.pw_shell) };
  Ok(UserInfo {
    username: username.to_string_lossy().into_owned(),
    homedir: homedir.to_string_lossy().into_owned(),
    shell: Some(shell.to_string_lossy().into_owned()),
  })
}

#[cfg(windows)]
fn get_user_info(_uid: u32) -> Result<UserInfo, OsError> {
  use std::ffi::OsString;
  use std::os::windows::ffi::OsStringExt;

  use windows_sys::Win32::Foundation::CloseHandle;
  use windows_sys::Win32::Foundation::GetLastError;
  use windows_sys::Win32::Foundation::ERROR_INSUFFICIENT_BUFFER;
  use windows_sys::Win32::Foundation::HANDLE;
  use windows_sys::Win32::System::Threading::GetCurrentProcess;
  use windows_sys::Win32::System::Threading::OpenProcessToken;
  use windows_sys::Win32::UI::Shell::GetUserProfileDirectoryW;
  struct Handle(HANDLE);
  impl Drop for Handle {
    fn drop(&mut self) {
      // SAFETY: win32 call
      unsafe {
        CloseHandle(self.0);
      }
    }
  }
  let mut token: MaybeUninit<HANDLE> = MaybeUninit::uninit();

  // Get a handle to the current process
  // SAFETY: win32 call
  unsafe {
    if OpenProcessToken(
      GetCurrentProcess(),
      windows_sys::Win32::Security::TOKEN_READ,
      token.as_mut_ptr(),
    ) == 0
    {
      return Err(
        OsError::FailedToGetUserInfo(std::io::Error::last_os_error()),
      );
    }
  }

  // SAFETY: initialized by call above
  let token = Handle(unsafe { token.assume_init() });

  let mut bufsize = 0;
  // get the size for the homedir buf (it'll end up in `bufsize`)
  // SAFETY: win32 call
  unsafe {
    GetUserProfileDirectoryW(token.0, std::ptr::null_mut(), &mut bufsize);
    let err = GetLastError();
    if err != ERROR_INSUFFICIENT_BUFFER {
      return Err(OsError::FailedToGetUserInfo(
        std::io::Error::from_raw_os_error(err as i32),
      ));
    }
  }
  let mut path = vec![0; bufsize as usize];
  // Actually get the homedir
  // SAFETY: path is `bufsize` elements
  unsafe {
    if GetUserProfileDirectoryW(token.0, path.as_mut_ptr(), &mut bufsize) == 0 {
      return Err(
        OsError::FailedToGetUserInfo(std::io::Error::last_os_error()),
      );
    }
  }
  // remove trailing nul
  path.pop();
  let homedir_wide = OsString::from_wide(&path);
  let homedir = homedir_wide.to_string_lossy().into_owned();

  Ok(UserInfo {
    username: deno_whoami::username(),
    homedir,
    shell: None,
  })
}

#[op2(stack_trace)]
#[serde]
pub fn op_node_os_user_info<P>(
  state: &mut OpState,
  #[smi] uid: u32,
) -> Result<UserInfo, OsError>
where
  P: NodePermissions + 'static,
{
  {
    let permissions = state.borrow_mut::<P>();
    permissions
      .check_sys("userInfo", "node:os.userInfo()")
      .map_err(OsError::Permission)?;
  }

  get_user_info(uid)
}

#[op2(fast, stack_trace)]
pub fn op_geteuid<P>(
  _state: &mut OpState,
) -> Result<u32, deno_core::error::AnyError>
where
  P: NodePermissions + 'static,
{
  // {
  //   let permissions = state.borrow_mut::<P>();
  //   permissions.check_sys("uid", "node:os.geteuid()")?;
  // }

  // #[cfg(windows)]
  // let euid = 0;
  // #[cfg(unix)]
  // // SAFETY: Call to libc geteuid.
  // let euid = unsafe { libc::geteuid() };

  // Ok(euid)
  Ok(0)
}

#[op2(fast, stack_trace)]
pub fn op_getegid<P>(
  _state: &mut OpState,
) -> Result<u32, deno_core::error::AnyError>
where
  P: NodePermissions + 'static,
{
  // {
  //   let permissions = state.borrow_mut::<P>();
  //   permissions.check_sys("getegid", "node:os.getegid()")?;
  // }

  // #[cfg(windows)]
  // let egid = 0;
  // #[cfg(unix)]
  // // SAFETY: Call to libc getegid.
  // let egid = unsafe { libc::getegid() };

  // Ok(egid)
  Ok(0)
}

#[op2(stack_trace)]
#[serde]
pub fn op_cpus<P>(state: &mut OpState) -> Result<Vec<cpus::CpuInfo>, OsError>
where
  P: NodePermissions + 'static,
{
  {
    let permissions = state.borrow_mut::<P>();
    permissions.check_sys("cpus", "node:os.cpus()")?;
  }

  cpus::cpu_info().ok_or(OsError::FailedToGetCpuInfo)
}

#[op2(stack_trace)]
#[string]
pub fn op_homedir<P>(
  state: &mut OpState,
) -> Result<Option<String>, deno_core::error::AnyError>
where
  P: NodePermissions + 'static,
{
  {
    let permissions = state.borrow_mut::<P>();
    permissions.check_sys("homedir", "node:os.homedir()")?;
  }

  Ok(home::home_dir().map(|path| path.to_string_lossy().to_string()))
}
