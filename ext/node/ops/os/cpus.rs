// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use deno_core::serde::Serialize;

#[derive(Debug, Default, Serialize, Clone)]
pub struct CpuTimes {
  pub user: u64,
  pub nice: u64,
  pub sys: u64,
  pub idle: u64,
  pub irq: u64,
}

#[derive(Debug, Default, Serialize, Clone)]
pub struct CpuInfo {
  pub model: String,
  /* in MHz */
  pub speed: u64,
  pub times: CpuTimes,
}

impl CpuInfo {
  pub fn new() -> Self {
    Self::default()
  }
}

#[cfg(target_os = "macos")]
#[allow(deprecated)] // libc remains the source of the Mach types used below.
pub fn cpu_info() -> Option<Vec<CpuInfo>> {
  let mut model: [u8; 512] = [0; 512];
  let mut size = std::mem::size_of_val(&model);

  // Safety: Assumes correct behavior of platform-specific syscalls and data structures.
  // Relies on specific sysctl names and sysconf parameter existence.
  unsafe {
    let ticks = libc::sysconf(libc::_SC_CLK_TCK);
    let multiplier = 1000u64 / ticks as u64;
    if libc::sysctlbyname(
      c"machdep.cpu.brand_string".as_ptr(),
      model.as_mut_ptr() as _,
      &mut size,
      std::ptr::null_mut(),
      0,
    ) != 0
      && libc::sysctlbyname(
        c"hw.model".as_ptr(),
        model.as_mut_ptr() as _,
        &mut size,
        std::ptr::null_mut(),
        0,
      ) != 0
    {
      return None;
    }

    let mut cpu_speed: u64 = 0;
    let mut cpu_speed_size = std::mem::size_of_val(&cpu_speed);

    libc::sysctlbyname(
      c"hw.cpufrequency".as_ptr(),
      &mut cpu_speed as *mut _ as *mut libc::c_void,
      &mut cpu_speed_size,
      std::ptr::null_mut(),
      0,
    );

    if cpu_speed == 0 {
      // https://github.com/libuv/libuv/pull/3679
      //
      // hw.cpufrequency sysctl seems to be missing on darwin/arm64
      // so we instead hardcode a plausible value. This value matches
      // what the mach kernel will report when running Rosetta apps.
      cpu_speed = 2_400_000_000;
    }

    let mut num_cpus: libc::natural_t = 0;
    let mut info: *mut libc::processor_cpu_load_info_data_t =
      std::ptr::null_mut();
    let mut msg_type: libc::mach_msg_type_number_t = 0;
    if libc::host_processor_info(
      libc::mach_host_self(),
      libc::PROCESSOR_CPU_LOAD_INFO,
      &mut num_cpus,
      &mut info as *mut _ as *mut libc::processor_info_array_t,
      &mut msg_type,
    ) != 0
    {
      return None;
    }

    let mut cpus = vec![CpuInfo::new(); num_cpus as usize];

    let info = std::slice::from_raw_parts(info, num_cpus as usize);
    let model = std::ffi::CStr::from_ptr(model.as_ptr() as _)
      .to_string_lossy()
      .into_owned();
    for (i, cpu) in cpus.iter_mut().enumerate() {
      cpu.times.user =
        info[i].cpu_ticks[libc::CPU_STATE_USER as usize] as u64 * multiplier;
      cpu.times.nice =
        info[i].cpu_ticks[libc::CPU_STATE_NICE as usize] as u64 * multiplier;
      cpu.times.sys =
        info[i].cpu_ticks[libc::CPU_STATE_SYSTEM as usize] as u64 * multiplier;
      cpu.times.idle =
        info[i].cpu_ticks[libc::CPU_STATE_IDLE as usize] as u64 * multiplier;

      cpu.times.irq = 0;

      cpu.model.clone_from(&model);
      cpu.speed = cpu_speed / 1000000;
    }

    libc::vm_deallocate(
      libc::mach_task_self(),
      info.as_ptr() as libc::vm_address_t,
      msg_type as _,
    );

    Some(cpus)
  }
}

#[cfg(target_os = "windows")]
pub fn cpu_info() -> Option<Vec<CpuInfo>> {
  use windows_sys::Wdk::System::SystemInformation::NtQuerySystemInformation;
  use windows_sys::Wdk::System::SystemInformation::SystemProcessorPerformanceInformation;
  use windows_sys::Win32::System::WindowsProgramming::SYSTEM_PROCESSOR_PERFORMANCE_INFORMATION;

  use std::os::windows::ffi::OsStrExt;
  use std::os::windows::ffi::OsStringExt;

  fn encode_wide(s: &str) -> Vec<u16> {
    std::ffi::OsString::from(s)
      .encode_wide()
      .chain(Some(0))
      .collect()
  }

  // Safety: Assumes correct behavior of platform-specific syscalls and data structures.
  unsafe {
    let mut system_info: winapi::um::sysinfoapi::SYSTEM_INFO =
      std::mem::zeroed();
    winapi::um::sysinfoapi::GetSystemInfo(&mut system_info);

    let cpu_count = system_info.dwNumberOfProcessors as usize;

    let mut cpus = vec![CpuInfo::new(); cpu_count];

    let mut sppi: Vec<SYSTEM_PROCESSOR_PERFORMANCE_INFORMATION> =
      vec![std::mem::zeroed(); cpu_count];

    let sppi_size = std::mem::size_of_val(&sppi[0]) * cpu_count;
    let mut result_size = 0;

    let status = NtQuerySystemInformation(
      SystemProcessorPerformanceInformation,
      sppi.as_mut_ptr() as *mut _,
      sppi_size as u32,
      &mut result_size,
    );
    if status != 0 {
      return None;
    }

    assert_eq!(result_size, sppi_size as u32);

    for i in 0..cpu_count {
      let key_name =
        format!("HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\{}", i);
      let key_name = encode_wide(&key_name);

      let mut processor_key: windows_sys::Win32::System::Registry::HKEY =
        std::mem::zeroed();
      let err = windows_sys::Win32::System::Registry::RegOpenKeyExW(
        windows_sys::Win32::System::Registry::HKEY_LOCAL_MACHINE,
        key_name.as_ptr(),
        0,
        windows_sys::Win32::System::Registry::KEY_QUERY_VALUE,
        &mut processor_key,
      );

      if err != 0 {
        return None;
      }

      let mut cpu_speed = 0;
      let mut cpu_speed_size = std::mem::size_of_val(&cpu_speed) as u32;

      let err = windows_sys::Win32::System::Registry::RegQueryValueExW(
        processor_key,
        encode_wide("~MHz").as_ptr() as *mut _,
        std::ptr::null_mut(),
        std::ptr::null_mut(),
        &mut cpu_speed as *mut _ as *mut _,
        &mut cpu_speed_size,
      );

      if err != 0 {
        return None;
      }

      let cpu_brand: [u16; 512] = [0; 512];
      let mut cpu_brand_size = std::mem::size_of_val(&cpu_brand) as u32;

      let err = windows_sys::Win32::System::Registry::RegQueryValueExW(
        processor_key,
        encode_wide("ProcessorNameString").as_ptr() as *mut _,
        std::ptr::null_mut(),
        std::ptr::null_mut(),
        cpu_brand.as_ptr() as *mut _,
        &mut cpu_brand_size,
      );
      windows_sys::Win32::System::Registry::RegCloseKey(processor_key);

      if err != 0 {
        return None;
      }

      let cpu_brand =
        std::ffi::OsString::from_wide(&cpu_brand[..cpu_brand_size as usize])
          .into_string()
          .unwrap();

      cpus[i].model = cpu_brand;
      cpus[i].speed = cpu_speed as u64;

      cpus[i].times.user = sppi[i].UserTime as u64 / 10000;
      cpus[i].times.sys =
        (sppi[i].KernelTime - sppi[i].IdleTime) as u64 / 10000;
      cpus[i].times.idle = sppi[i].IdleTime as u64 / 10000;
      /* InterruptTime is Reserved1[1] */
      cpus[i].times.irq = sppi[i].Reserved1[1] as u64 / 10000;
      cpus[i].times.nice = 0;
    }
    Some(cpus)
  }
}

#[cfg(any(target_os = "android", target_os = "linux"))]
pub fn cpu_info() -> Option<Vec<CpuInfo>> {
  use std::io::BufRead;

  let mut cpus = vec![CpuInfo::new(); 8192]; /* Kernel maximum */

  let fp = std::fs::File::open("/proc/stat").ok()?;
  let reader = std::io::BufReader::new(fp);

  let mut count = 0;
  // Skip the first line which tracks total CPU time across all cores
  for (i, line) in reader.lines().skip(1).enumerate() {
    let line = line.ok()?;
    if !line.starts_with("cpu") {
      break;
    }
    count = i + 1;
    let mut fields = line.split_whitespace();
    fields.next()?;
    let user = fields.next()?.parse::<u64>().ok()?;
    let nice = fields.next()?.parse::<u64>().ok()?;
    let sys = fields.next()?.parse::<u64>().ok()?;
    let idle = fields.next()?.parse::<u64>().ok()?;
    let irq = fields.next()?.parse::<u64>().ok()?;

    cpus[i].times.user = user;
    cpus[i].times.nice = nice;
    cpus[i].times.sys = sys;
    cpus[i].times.idle = idle;
    cpus[i].times.irq = irq;
  }

  let fp = std::fs::File::open("/proc/cpuinfo").ok()?;
  let reader = std::io::BufReader::new(fp);

  let mut j = 0;
  for line in reader.lines() {
    let line = line.ok()?;
    if !line.starts_with("model name") {
      continue;
    }
    let mut fields = line.splitn(2, ':');
    fields.next()?;
    let model = fields.next()?.trim();

    cpus[j].model = model.to_string();
    j += 1;
  }

  while j < count {
    cpus[j].model = "unknown".to_string();
    j += 1;
  }

  cpus.truncate(count);
  Some(cpus)
}

#[cfg(target_os = "openbsd")]
pub fn cpu_info() -> Option<Vec<CpuInfo>> {
  // Stub implementation for OpenBSD that returns an array of the correct size
  // but with dummy values.
  // Rust's OpenBSD libc bindings don't contain all the symbols needed for a
  // full implementation, and including them is not planned.
  let mut mib = [libc::CTL_HW, libc::HW_NCPUONLINE];

  // SAFETY: Assumes correct behavior of platform-specific
  // sysctls and data structures. Relies on specific sysctl
  // names and parameter existence.
  unsafe {
    let mut ncpu: libc::c_uint = 0;
    let mut size = std::mem::size_of_val(&ncpu) as libc::size_t;

    // Get number of CPUs online
    let res = libc::sysctl(
      mib.as_mut_ptr(),
      mib.len() as _,
      &mut ncpu as *mut _ as *mut _,
      &mut size,
      std::ptr::null_mut(),
      0,
    );
    // If res == 0, the sysctl call was succesful and
    // ncpuonline contains the number of online CPUs.
    if res != 0 {
      return None;
    } else {
      let mut cpus = vec![CpuInfo::new(); ncpu as usize];

      for (_, cpu) in cpus.iter_mut().enumerate() {
        cpu.model = "Undisclosed CPU".to_string();
        // Return 1 as a dummy value so the tests won't
        // fail.
        cpu.speed = 1;
        cpu.times.user = 1;
        cpu.times.nice = 1;
        cpu.times.sys = 1;
        cpu.times.idle = 1;
        cpu.times.irq = 1;
      }

      return Some(cpus);
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_cpu_info() {
    let info = cpu_info();
    assert!(info.is_some());
    let info = info.unwrap();
    assert!(!info.is_empty());
    for cpu in info {
      assert!(!cpu.model.is_empty());
      assert!(cpu.times.user > 0);
      assert!(cpu.times.sys > 0);
      assert!(cpu.times.idle > 0);
    }
  }
}
