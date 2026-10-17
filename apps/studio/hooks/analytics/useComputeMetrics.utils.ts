import type {
  InfraMonitoringAttribute,
  InfraMonitoringResponse,
} from '@/data/analytics/infra-monitoring-query'

const COMPUTE_METRIC_ATTRIBUTES = {
  cpu: ['avg_cpu_usage'],
  memory: ['ram_usage'],
  disk: ['disk_fs_used_system', 'disk_fs_used_wal', 'pg_database_size', 'disk_fs_size'],
  connections: ['pg_stat_database_num_backends'],
} satisfies Record<string, InfraMonitoringAttribute[]>

export const COMPUTE_METRICS_ATTRIBUTES = Object.values(COMPUTE_METRIC_ATTRIBUTES).flat()

export function getComputeMetricAvailability(data: InfraMonitoringResponse | undefined) {
  const hasMetricData = (attributes: InfraMonitoringAttribute[]) =>
    !!data &&
    'series' in data &&
    attributes.every((attribute) => !!data.series[attribute] && !data.errors?.[attribute])

  return {
    cpu: hasMetricData(COMPUTE_METRIC_ATTRIBUTES.cpu),
    memory: hasMetricData(COMPUTE_METRIC_ATTRIBUTES.memory),
    disk: hasMetricData(COMPUTE_METRIC_ATTRIBUTES.disk),
    connections: hasMetricData(COMPUTE_METRIC_ATTRIBUTES.connections),
  }
}
