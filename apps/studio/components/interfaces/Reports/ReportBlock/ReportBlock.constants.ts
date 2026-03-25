export const METRIC_THRESHOLDS = {
  max_cpu_usage: { check: 'gt', warning: 75, danger: 90 },
  avg_cpu_usage: { check: 'gt', warning: 75, danger: 90 },
  ram_usage: { check: 'gt', warning: 75, danger: 90 },
  disk_io_consumption: { check: 'gt', warning: 75, danger: 90 },
  disk_io_budget: { check: 'lt', warning: 25, danger: 10 },
}
