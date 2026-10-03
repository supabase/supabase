// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

pub use impl_::*;

#[derive(Debug, thiserror::Error)]
pub enum PriorityError {
  #[error("{0}")]
  Io(#[from] std::io::Error),
  #[cfg(windows)]
  #[error("Invalid priority")]
  InvalidPriority,
}

#[cfg(unix)]
mod impl_ {
  use errno::errno;
  use errno::set_errno;
  use errno::Errno;
  use libc::id_t;
  use libc::PRIO_PROCESS;

  const PRIORITY_HIGH: i32 = -14;

  // Ref: https://github.com/libuv/libuv/blob/55376b044b74db40772e8a6e24d67a8673998e02/src/unix/core.c#L1533-L1547
  pub fn get_priority(pid: u32) -> Result<i32, super::PriorityError> {
    set_errno(Errno(0));
    match (
      // SAFETY: libc::getpriority is unsafe
      unsafe { libc::getpriority(PRIO_PROCESS, pid as id_t) },
      errno(),
    ) {
      (-1, Errno(0)) => Ok(PRIORITY_HIGH),
      (-1, _) => Err(std::io::Error::last_os_error().into()),
      (priority, _) => Ok(priority),
    }
  }

  pub fn set_priority(
    pid: u32,
    priority: i32,
  ) -> Result<(), super::PriorityError> {
    // SAFETY: libc::setpriority is unsafe
    match unsafe { libc::setpriority(PRIO_PROCESS, pid as id_t, priority) } {
      -1 => Err(std::io::Error::last_os_error().into()),
      _ => Ok(()),
    }
  }
}

#[cfg(windows)]
mod impl_ {
  use winapi::shared::minwindef::DWORD;
  use winapi::shared::minwindef::FALSE;
  use winapi::shared::ntdef::NULL;
  use winapi::um::handleapi::CloseHandle;
  use winapi::um::processthreadsapi::GetCurrentProcess;
  use winapi::um::processthreadsapi::GetPriorityClass;
  use winapi::um::processthreadsapi::OpenProcess;
  use winapi::um::processthreadsapi::SetPriorityClass;
  use winapi::um::winbase::ABOVE_NORMAL_PRIORITY_CLASS;
  use winapi::um::winbase::BELOW_NORMAL_PRIORITY_CLASS;
  use winapi::um::winbase::HIGH_PRIORITY_CLASS;
  use winapi::um::winbase::IDLE_PRIORITY_CLASS;
  use winapi::um::winbase::NORMAL_PRIORITY_CLASS;
  use winapi::um::winbase::REALTIME_PRIORITY_CLASS;
  use winapi::um::winnt::PROCESS_QUERY_LIMITED_INFORMATION;

  // Taken from: https://github.com/libuv/libuv/blob/a877ca2435134ef86315326ef4ef0c16bdbabf17/include/uv.h#L1318-L1323
  const PRIORITY_LOW: i32 = 19;
  const PRIORITY_BELOW_NORMAL: i32 = 10;
  const PRIORITY_NORMAL: i32 = 0;
  const PRIORITY_ABOVE_NORMAL: i32 = -7;
  const PRIORITY_HIGH: i32 = -14;
  const PRIORITY_HIGHEST: i32 = -20;

  // Ported from: https://github.com/libuv/libuv/blob/a877ca2435134ef86315326ef4ef0c16bdbabf17/src/win/util.c#L1649-L1685
  pub fn get_priority(pid: u32) -> Result<i32, super::PriorityError> {
    // SAFETY: Windows API calls
    unsafe {
      let handle = if pid == 0 {
        GetCurrentProcess()
      } else {
        OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid as DWORD)
      };
      if handle == NULL {
        Err(std::io::Error::last_os_error().into())
      } else {
        let result = match GetPriorityClass(handle) {
          0 => Err(std::io::Error::last_os_error().into()),
          REALTIME_PRIORITY_CLASS => Ok(PRIORITY_HIGHEST),
          HIGH_PRIORITY_CLASS => Ok(PRIORITY_HIGH),
          ABOVE_NORMAL_PRIORITY_CLASS => Ok(PRIORITY_ABOVE_NORMAL),
          NORMAL_PRIORITY_CLASS => Ok(PRIORITY_NORMAL),
          BELOW_NORMAL_PRIORITY_CLASS => Ok(PRIORITY_BELOW_NORMAL),
          IDLE_PRIORITY_CLASS => Ok(PRIORITY_LOW),
          _ => Ok(PRIORITY_LOW),
        };
        CloseHandle(handle);
        result
      }
    }
  }

  // Ported from: https://github.com/libuv/libuv/blob/a877ca2435134ef86315326ef4ef0c16bdbabf17/src/win/util.c#L1688-L1719
  pub fn set_priority(
    pid: u32,
    priority: i32,
  ) -> Result<(), super::PriorityError> {
    // SAFETY: Windows API calls
    unsafe {
      let handle = if pid == 0 {
        GetCurrentProcess()
      } else {
        OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid as DWORD)
      };
      if handle == NULL {
        Err(std::io::Error::last_os_error().into())
      } else {
        #[allow(clippy::manual_range_contains)]
        let priority_class =
          if priority < PRIORITY_HIGHEST || priority > PRIORITY_LOW {
            return Err(super::PriorityError::InvalidPriority);
          } else if priority < PRIORITY_HIGH {
            REALTIME_PRIORITY_CLASS
          } else if priority < PRIORITY_ABOVE_NORMAL {
            HIGH_PRIORITY_CLASS
          } else if priority < PRIORITY_NORMAL {
            ABOVE_NORMAL_PRIORITY_CLASS
          } else if priority < PRIORITY_BELOW_NORMAL {
            NORMAL_PRIORITY_CLASS
          } else if priority < PRIORITY_LOW {
            BELOW_NORMAL_PRIORITY_CLASS
          } else {
            IDLE_PRIORITY_CLASS
          };

        let result = match SetPriorityClass(handle, priority_class) {
          FALSE => Err(std::io::Error::last_os_error().into()),
          _ => Ok(()),
        };
        CloseHandle(handle);
        result
      }
    }
  }
}
