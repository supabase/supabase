use deno_core::v8;
use serde::Deserialize;
use serde::Serialize;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, Default)]
#[serde(rename_all = "camelCase")]
pub struct WorkerHeapStatistics {
  pub total_heap_size: usize,
  pub total_heap_size_executable: usize,
  pub total_physical_size: usize,
  pub total_available_size: usize,
  pub total_global_handles_size: usize,
  pub used_global_handles_size: usize,
  pub used_heap_size: usize,
  pub malloced_memory: usize,
  pub external_memory: usize,
  pub peak_malloced_memory: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct WorkerHeapStatisticsWithServicePath {
  pub service_path: String,
  pub stats: Option<WorkerHeapStatistics>,
}

impl From<&'_ v8::HeapStatistics> for WorkerHeapStatistics {
  fn from(value: &v8::HeapStatistics) -> Self {
    Self {
      total_heap_size: value.total_heap_size(),
      total_heap_size_executable: value.total_heap_size_executable(),
      total_physical_size: value.total_physical_size(),
      total_available_size: value.total_available_size(),
      total_global_handles_size: value.total_global_handles_size(),
      used_global_handles_size: value.used_global_handles_size(),
      used_heap_size: value.used_heap_size(),
      malloced_memory: value.malloced_memory(),
      external_memory: value.external_memory(),
      peak_malloced_memory: value.peak_malloced_memory(),
    }
  }
}

#[derive(Serialize, Deserialize, Debug, Default, Clone, Copy)]
pub struct MemCheckState {
  pub current: WorkerHeapStatistics,
  pub exceeded: bool,
}
