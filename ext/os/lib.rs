use deno_core::op2;
use serde::Serialize;

#[derive(Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MemInfo {
  pub total: u64,
  pub free: u64,
  pub available: u64,
  pub buffers: u64,
  pub cached: u64,
  pub swap_total: u64,
  pub swap_free: u64,
}

#[op2]
#[serde]
fn op_system_memory_info() -> Option<MemInfo> {
  #[cfg(any(target_os = "android", target_os = "linux"))]
  {
    let mut mem_info = MemInfo::default();
    let mut info = std::mem::MaybeUninit::uninit();
    // SAFETY: `info` is a valid pointer to a `libc::sysinfo` struct.
    let res = unsafe { libc::sysinfo(info.as_mut_ptr()) };
    if res == 0 {
      // SAFETY: `sysinfo` initializes the struct.
      let info = unsafe { info.assume_init() };
      let mem_unit = info.mem_unit as u64;
      mem_info.swap_total = info.totalswap * mem_unit;
      mem_info.swap_free = info.freeswap * mem_unit;
      mem_info.total = info.totalram * mem_unit;
      mem_info.free = info.freeram * mem_unit;
      mem_info.available = mem_info.free;
      mem_info.buffers = info.bufferram * mem_unit;
    }

    Some(mem_info)
  }

  #[cfg(not(any(target_os = "android", target_os = "linux")))]
  {
    Some(MemInfo::default())
  }
}

deno_core::extension!(
  os,
  ops = [op_system_memory_info],
  esm_entry_point = "ext:os/os.js",
  esm = ["os.js"]
);
