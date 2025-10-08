export interface MonitoringMetric {
  key: string
  title: string
  provider: 'infra-monitoring'
  format: (value: number) => string
}

export const MONITORING_METRICS = [
  {
    key: 'ram_usage',
    title: 'Memory Usage',
    provider: 'infra-monitoring',
    format: (value: number) => `${value.toFixed(1)}%`,
  },
  {
    key: 'avg_cpu_usage',
    title: 'CPU Usage',
    provider: 'infra-monitoring',
    format: (value: number) => `${value.toFixed(1)}%`,
  },
  {
    key: 'disk_io_consumption',
    title: 'IOPS',
    provider: 'infra-monitoring',
    format: (value: number) => `${value.toFixed(1)}%`,
  },
  {
    key: 'disk_io_budget',
    title: 'Disk Usage',
    provider: 'infra-monitoring',
    format: (value: number) => `${value.toFixed(1)}%`,
  },
] as const satisfies readonly MonitoringMetric[]

export type MonitoringMetricKey = (typeof MONITORING_METRICS)[number]['key']
