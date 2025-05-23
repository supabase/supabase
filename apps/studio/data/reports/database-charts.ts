import { numberFormatter } from 'components/ui/Charts/Charts.utils'
import { formatBytes } from 'lib/helpers'
import { Organization } from '../../types'
import { Project } from '../projects/project-detail-query'

export const getReportAttributes = (isFreePlan: boolean) => [
  { id: 'ram_usage', label: 'Memory usage', hide: false },
  { id: 'avg_cpu_usage', label: 'Average CPU usage', hide: false },
  { id: 'max_cpu_usage', label: 'Max CPU usage', hide: false },
  { id: 'disk_iops_write', label: 'Disk IOps write', hide: false },
  { id: 'disk_iops_read', label: 'Disk IOps read', hide: false },
  {
    id: 'pg_stat_database_num_backends',
    label: 'Pooler to database connections',
    hide: false,
  },
  {
    id: 'supavisor_connections_active',
    label: 'Client to Shared Pooler connections',
    hide: false,
  },
  {
    id: 'client_connections_pgbouncer',
    label: 'Client to Dedicated Pooler connections',
    hide: isFreePlan,
  },
]

export const getReportAttributesV2 = (org: Organization, project: Project) => {
  const isFreePlan = org?.plan?.id === 'free'
  const computeSize = project?.infra_compute_size || 'medium'
  const isSpendCapEnabled =
    org?.plan.id !== 'free' && !org?.usage_billing_enabled && project?.cloud_provider !== 'FLY'

  return [
    {
      id: 'ram-usage',
      label: 'Memory usage',
      hide: false,
      showTooltip: true,
      showLegend: true,
      hideChartType: false,
      defaultChartStyle: 'line',
      showMaxValue: true,
      showGrid: true,
      syncId: 'database-reports',
      valuePrecision: 2,
      YAxisProps: {
        width: 60,
        tickFormatter: (value: any) => formatBytes(value, 2),
      },
      attributes: [
        {
          attribute: 'ram_usage_used',
          provider: 'infra-monitoring',
          label: 'Used',
          tooltip:
            'Total RAM currently in use by the system and applications. High usage may indicate memory pressure.',
        },
        {
          attribute: 'ram_usage_cache_and_buffers',
          provider: 'infra-monitoring',
          label: 'Cache + buffers',
          tooltip:
            'RAM used for caching and buffering disk operations. Higher values improve read performance.',
        },
        {
          attribute: 'ram_usage_free',
          provider: 'infra-monitoring',
          label: 'Free',
          tooltip:
            'Available unused RAM. A small amount is always reserved. High unused RAM present with erratic Used RAM may indicate unoptimized queries disrupting cache.',
        },
        {
          attribute: 'ram_usage_swap',
          provider: 'infra-monitoring',
          label: 'Swap',
          omitFromTotal: false, // we can set this to true if we want to omit the swap from the total
          tooltip:
            'Memory swapped to disk when RAM is full. An instance has 1GB of SWAP. High swap with high disk I/O signals memory stress.',
        },
        {
          attribute: 'ram_usage_total',
          provider: 'infra-monitoring',
          label: 'Max',
          isMaxValue: true,
          tooltip: 'Total RAM',
        },
      ],
    },
    {
      id: 'cpu-usage',
      label: 'CPU usage',
      syncId: 'database-reports',
      format: '%',
      valuePrecision: 2,
      hide: false,
      showTooltip: true,
      showLegend: true,
      showMaxValue: false,
      showGrid: true,
      YAxisProps: { width: 45, tickFormatter: (value: any) => `${numberFormatter(value, 2)}%` },
      hideChartType: false,
      defaultChartStyle: 'line',
      attributes: [
        {
          attribute: 'cpu_usage_busy_system',
          provider: 'infra-monitoring',
          label: 'System',
          format: '%',
          tooltip:
            'CPU time spent on kernel operations (e.g., process scheduling, memory management). High values may indicate system overhead.',
        },
        {
          attribute: 'cpu_usage_busy_user',
          provider: 'infra-monitoring',
          label: 'User',
          format: '%',
          tooltip:
            'CPU time used by database queries and user-space processes. High values may suggest CPU-intensive queries.',
        },
        {
          attribute: 'cpu_usage_busy_iowait',
          provider: 'infra-monitoring',
          label: 'IOwait',
          format: '%',
          tooltip:
            'CPU time waiting for disk or network I/O. High values may indicate disk bottlenecks.',
        },
        {
          attribute: 'cpu_usage_busy_irqs',
          provider: 'infra-monitoring',
          label: 'IRQs',
          format: '%',
          tooltip: 'CPU time handling hardware interrupt requests (IRQ)',
        },
        {
          attribute: 'cpu_usage_busy_other',
          provider: 'infra-monitoring',
          label: 'Other',
          format: '%',
          tooltip:
            'CPU time spent on other tasks (e.g., background processes, software interrupts).',
        },
        {
          attribute: 'cpu_usage_max',
          provider: 'reference-line',
          label: 'Max',
          value: 100,
          tooltip: 'Max CPU usage',
          isMaxValue: true,
        },
      ],
    },
    {
      id: 'disk-iops',
      label: 'Disk IOps',
      syncId: 'database-reports',
      hide: false,
      showTooltip: true,
      valuePrecision: 2,
      showLegend: true,
      hideChartType: false,
      showGrid: true,
      showMaxValue: true,
      YAxisProps: { width: 35, tickFormatter: (value: any) => numberFormatter(value, 2) },
      defaultChartStyle: 'line',
      docsUrl: 'https://supabase.com/docs/guides/platform/compute-and-disk#compute-size',
      attributes: [
        {
          attribute: 'disk_iops_write',
          provider: 'infra-monitoring',
          label: 'IOps write/s',
          tooltip:
            'Number of write operations per second. High values indicate frequent data writes, logging, or transaction activity.',
        },
        {
          attribute: 'disk_iops_read',
          provider: 'infra-monitoring',
          label: 'IOps read/s',
          tooltip:
            'Number of read operations per second. High values suggest frequent disk reads due to queries or poor caching.',
        },
        {
          attribute: 'disk_iops_max',
          provider: 'reference-line',
          label: 'Max IOPS',
          value: getIOPSLimits(computeSize),
          tooltip:
            'Maximum IOPS (Input/Output Operations Per Second) for your current compute size',
          isMaxValue: true,
        },
      ],
    },
    {
      id: 'disk-io-usage',
      label: 'Disk IO Usage',
      syncId: 'database-reports',
      hide: false,
      showTooltip: true,
      format: '%',
      valuePrecision: 6,
      showLegend: false,
      showMaxValue: false,
      hideChartType: false,
      showGrid: true,
      YAxisProps: { width: 70, tickFormatter: (value: any) => `${numberFormatter(value, 6)}%` },
      defaultChartStyle: 'line',
      attributes: [
        {
          attribute: 'disk_io_usage',
          provider: 'infra-monitoring',
          label: 'IO Usage',
          tooltip:
            'The actual number of IO operations per second that the database is currently using.',
        },
      ],
    },
    {
      id: 'db-size',
      label: 'Database Size',
      syncId: 'database-reports',
      valuePrecision: 2,
      hide: false,
      showTooltip: true,
      showLegend: true,
      showMaxValue: true,
      showGrid: true,
      YAxisProps: { width: 65, tickFormatter: (value: any) => formatBytes(value, 1) },
      hideChartType: false,
      defaultChartStyle: 'line',
      docsUrl: 'https://supabase.com/docs/guides/platform/database-size',
      attributes: [
        {
          attribute: 'pg_database_size',
          provider: 'infra-monitoring',
          label: 'Database',
          tooltip: 'Total space on disk used by your database (tables, indexes, data, ...).',
        },
        {
          attribute: 'max_pg_database_size',
          provider: 'reference-line',
          label: 'Disk size',
          value: (project?.volumeSizeGb || getRecommendedDbSize(computeSize)) * 1024 * 1024 * 1024,
          tooltip: 'Disk Size refers to the total space your project occupies on disk',
          isMaxValue: true,
        },
        !isFreePlan &&
          (isSpendCapEnabled
            ? {
                attribute: 'pg_database_size_percent_paid_spendCap',
                provider: 'reference-line',
                isReferenceLine: true,
                strokeDasharray: '4 2',
                label: 'Spend cap enabled',
                value:
                  (project?.volumeSizeGb || getRecommendedDbSize(computeSize)) * 1024 * 1024 * 1024,
                className: '[&_line]:!stroke-yellow-800 [&_line]:!opacity-100',
                opacity: 1,
              }
            : {
                attribute: 'pg_database_size_percent_paid',
                provider: 'reference-line',
                isReferenceLine: true,
                label: '90% - Disk resize threshold',
                className: '[&_line]:!stroke-yellow-800',
                value:
                  (project?.volumeSizeGb || getRecommendedDbSize(computeSize)) *
                  1024 *
                  1024 *
                  1024 *
                  0.9, // reaching 90% of the disk size will trigger a disk resize https://supabase.com/docs/guides/platform/database-size
              }),
      ],
    },
    {
      id: 'network-traffic',
      label: 'Network Traffic',
      syncId: 'database-reports',
      valuePrecision: 1,
      showTooltip: true,
      showLegend: true,
      showMaxValue: false,
      showGrid: true,
      YAxisProps: { width: 65, tickFormatter: (value: any) => formatBytes(value, 1) },
      hideChartType: false,
      defaultChartStyle: 'line',
      hideHighlightedValue: true,
      showTotal: false,
      attributes: [
        {
          attribute: 'network_transmit_bytes',
          provider: 'infra-monitoring',
          label: 'Transmit',
          tooltip:
            'Data sent from your database to clients. High values may indicate large query results or numerous outgoing connections.',
          stackId: '2',
        },
        {
          attribute: 'network_receive_bytes',
          provider: 'infra-monitoring',
          label: 'Receive',
          tooltip:
            'Data received by your database from clients. High values may indicate frequent queries, large data inserts, or many incoming connections.',
          stackId: '1',
        },
      ],
    },
    {
      id: 'client-connections',
      label: 'Database client connections',
      syncId: 'database-reports',
      valuePrecision: 0,
      hide: false,
      showTooltip: true,
      showLegend: true,
      showMaxValue: true,
      showGrid: true,
      YAxisProps: { width: 30 },
      hideChartType: false,
      defaultChartStyle: 'line',
      docsUrl: 'https://supabase.com/docs/guides/platform/compute-and-disk#limits-and-constraints',
      attributes: [
        {
          attribute: 'pg_stat_database_num_backends',
          provider: 'infra-monitoring',
          label: 'Active connections',
        },
        {
          attribute: 'pg_database_max_connections',
          provider: 'reference-line',
          label: 'Max connections',
          value: getConnectionLimits(computeSize).direct,
          tooltip: 'Max available connections for your current compute size',
          isMaxValue: true,
        },
      ],
    },
    {
      id: 'pgbouncer-connections',
      label: 'Pooler client connections',
      syncId: 'database-reports',
      valuePrecision: 0,
      hide: false,
      showTooltip: true,
      showLegend: true,
      showMaxValue: true,
      showGrid: true,
      YAxisProps: { width: 30 },
      hideChartType: false,
      defaultChartStyle: 'line',
      docsUrl: 'https://supabase.com/docs/guides/platform/compute-and-disk#limits-and-constraints',
      attributes: [
        {
          attribute: 'client_connections_pgbouncer',
          provider: 'infra-monitoring',
          label: 'pgbouncer',
          tooltip: 'PgBouncer connections',
        },
        {
          attribute: 'pg_pooler_max_connections',
          provider: 'reference-line',
          label: 'Max pooler connections',
          value: getConnectionLimits(computeSize).pooler,
          tooltip: 'Maximum allowed pooler connections for your current compute size',
          isMaxValue: true,
        },
      ],
    },
    {
      id: 'supavisor-connections-active',
      label: 'Supavisor client connections',
      syncId: 'database-reports',
      valuePrecision: 0,
      hide: isFreePlan,
      showTooltip: false,
      showLegend: false,
      showMaxValue: false,
      showGrid: true,
      YAxisProps: { width: 30 },
      hideChartType: false,
      defaultChartStyle: 'line',
      attributes: [
        {
          attribute: 'supavisor_connections_active',
          provider: 'infra-monitoring',
          label: 'supavisor',
          tooltip: 'Supavisor connections',
        },
      ],
    },
  ]
}

// Helper function to get connection limits based on compute size
export const getConnectionLimits = (computeSize: string = 'medium') => {
  const connectionLimits = {
    nano: { direct: 60, pooler: 200 },
    micro: { direct: 60, pooler: 200 },
    small: { direct: 90, pooler: 400 },
    medium: { direct: 120, pooler: 600 },
    large: { direct: 160, pooler: 800 },
    xl: { direct: 240, pooler: 1000 },
    '2xl': { direct: 380, pooler: 1500 },
    '4xl': { direct: 480, pooler: 3000 },
    '8xl': { direct: 490, pooler: 6000 },
    '12xl': { direct: 500, pooler: 9000 },
    '16xl': { direct: 500, pooler: 12000 },
  }

  return (
    connectionLimits[computeSize?.toLowerCase() as keyof typeof connectionLimits] ||
    connectionLimits.medium
  )
}

// Helper function to get IOPS limits based on compute size
export const getIOPSLimits = (computeSize: string = 'medium') => {
  const iopsLimits = {
    nano: 250,
    micro: 500,
    small: 1000,
    medium: 2000,
    large: 3600,
    xl: 6000,
    '2xl': 12000,
    '4xl': 20000,
    '8xl': 40000,
    '12xl': 50000,
    '16xl': 80000,
  }

  return iopsLimits[computeSize?.toLowerCase() as keyof typeof iopsLimits] || iopsLimits.medium
}

// Helper function to get recommended DB size based on compute size (in GB)
export const getRecommendedDbSize = (computeSize: string = 'medium') => {
  const recommendedSizes = {
    nano: 0.5, // 500 MB
    micro: 10,
    small: 50,
    medium: 100,
    large: 200,
    xl: 500,
    '2xl': 1024, // 1 TB
    '4xl': 2048, // 2 TB
    '8xl': 4096, // 4 TB
    '12xl': 6144, // 6 TB
    '16xl': 10240, // 10 TB
  }

  return (
    recommendedSizes[computeSize?.toLowerCase() as keyof typeof recommendedSizes] ||
    recommendedSizes.medium
  )
}
