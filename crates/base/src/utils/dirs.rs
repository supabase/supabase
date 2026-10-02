/// To avoid the poorly managed dirs crate
#[cfg(not(windows))]
mod internal {
  use std::path::PathBuf;

  pub fn cache_dir() -> Option<PathBuf> {
    if cfg!(target_os = "macos") {
      home_dir().map(|h| h.join("Library/Caches"))
    } else {
      std::env::var_os("XDG_CACHE_HOME")
        .map(PathBuf::from)
        .or_else(|| home_dir().map(|h| h.join(".cache")))
    }
  }

  pub fn home_dir() -> Option<PathBuf> {
    std::env::var_os("HOME")
      .filter(|h| !h.is_empty())
      .or_else(|| {
        // TODO(bartlomieju):
        #[allow(clippy::undocumented_unsafe_blocks)]
        unsafe {
          fallback()
        }
      })
      .map(PathBuf::from)
  }

  // This piece of code is taken from the deprecated home_dir() function in Rust's standard library: https://github.com/rust-lang/rust/blob/master/src/libstd/sys/unix/os.rs#L579
  // The same code is used by the dirs crate
  unsafe fn fallback() -> Option<std::ffi::OsString> {
    let amt = match libc::sysconf(libc::_SC_GETPW_R_SIZE_MAX) {
      n if n < 0 => 512_usize,
      n => n as usize,
    };
    let mut buf = Vec::with_capacity(amt);
    let mut passwd: libc::passwd = std::mem::zeroed();
    let mut result = std::ptr::null_mut();
    match libc::getpwuid_r(
      libc::getuid(),
      &mut passwd,
      buf.as_mut_ptr(),
      buf.capacity(),
      &mut result,
    ) {
      0 if !result.is_null() => {
        let ptr = passwd.pw_dir as *const _;
        let bytes = std::ffi::CStr::from_ptr(ptr).to_bytes().to_vec();
        Some(std::os::unix::ffi::OsStringExt::from_vec(bytes))
      }
      _ => None,
    }
  }
}

/// To avoid the poorly managed dirs crate
// Copied from
// https://github.com/dirs-dev/dirs-sys-rs/blob/ec7cee0b3e8685573d847f0a0f60aae3d9e07fa2/src/lib.rs#L140-L164
// MIT license. Copyright (c) 2018-2019 dirs-rs contributors
#[cfg(windows)]
mod internal {
  use std::ffi::OsString;
  use std::os::windows::ffi::OsStringExt;
  use std::path::PathBuf;
  use winapi::shared::winerror;
  use winapi::um::combaseapi;
  use winapi::um::knownfolders;
  use winapi::um::shlobj;
  use winapi::um::shtypes;
  use winapi::um::winbase;
  use winapi::um::winnt;

  fn known_folder(folder_id: shtypes::REFKNOWNFOLDERID) -> Option<PathBuf> {
    // SAFETY: winapi calls
    unsafe {
      let mut path_ptr: winnt::PWSTR = std::ptr::null_mut();
      let result = shlobj::SHGetKnownFolderPath(
        folder_id,
        0,
        std::ptr::null_mut(),
        &mut path_ptr,
      );
      if result == winerror::S_OK {
        let len = winbase::lstrlenW(path_ptr) as usize;
        let path = std::slice::from_raw_parts(path_ptr, len);
        let ostr: OsString = OsStringExt::from_wide(path);
        combaseapi::CoTaskMemFree(path_ptr as *mut winapi::ctypes::c_void);
        Some(PathBuf::from(ostr))
      } else {
        None
      }
    }
  }

  pub fn cache_dir() -> Option<PathBuf> {
    known_folder(&knownfolders::FOLDERID_LocalAppData)
  }

  pub fn home_dir() -> Option<PathBuf> {
    known_folder(&knownfolders::FOLDERID_Profile)
  }
}

pub use internal::cache_dir;
pub use internal::home_dir;
