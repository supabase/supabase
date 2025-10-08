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

export const DATABASE_CONNECTIONS_CHART = {
  id: 'client-connections',
  label: 'Database Connections',
  syncId: 'auth-monitoring',
  valuePrecision: 0,
  showTooltip: true,
  showLegend: true,
  showMaxValue: false,
  hideChartType: false,
  showGrid: true,
  YAxisProps: { width: 30 },
  attributes: [
    {
      attribute: 'client_connections_postgres',
      provider: 'infra-monitoring',
      label: 'Postgres',
      tooltip:
        'Direct connections to the Postgres database from your application and external clients',
    },
    {
      attribute: 'client_connections_authenticator',
      provider: 'infra-monitoring',
      label: 'PostgREST',
      tooltip: 'Connection pool managed by PostgREST',
    },
    {
      attribute: 'client_connections_supabase_admin',
      provider: 'infra-monitoring',
      label: 'Reserved',
      tooltip:
        'Administrative connections used by various Supabase services for internal operations and maintenance tasks',
    },
    {
      attribute: 'client_connections_supabase_auth_admin',
      provider: 'infra-monitoring',
      label: 'Auth',
      tooltip: 'Connection pool managed by Supabase Auth',
    },
    {
      attribute: 'client_connections_supabase_storage_admin',
      provider: 'infra-monitoring',
      label: 'Storage',
      tooltip: 'Connection pool managed by Supabase Storage',
    },
    {
      attribute: 'client_connections_other',
      provider: 'infra-monitoring',
      label: 'Other roles',
      tooltip: "Miscellaneous database connections that don't fall into other categories.",
    },
  ],
} as const
