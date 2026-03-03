import { compactNumberFormatter, numberFormatter } from 'components/ui/Charts/Charts.utils'
import { ReportAttributes } from 'components/ui/Charts/ComposedChart.utils'
import { DOCS_URL } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import type { Organization } from 'types'

import { DiskAttributesData } from '../config/disk-attributes-query'
import { MaxConnectionsData } from '../database/max-connections-query'
import { Project } from '../projects/project-detail-query'

export const getReportAttributesV2: (
  org: Organization,
  project: Project,
  diskConfig?: DiskAttributesData,
  maxConnections?: MaxConnectionsData,
  pgBouncerMaxConnections?: number
) => ReportAttributes[] = (org, project, diskConfig, maxConnections, pgBouncerMaxConnections) => {
  const isFreePlan = org?.plan?.id === 'free'
  const isSpendCapEnabled =
    org?.plan.id !== 'free' && !org?.usage_billing_enabled && project?.cloud_provider !== 'FLY'

  return [
    {
      id: 'ram-usage',
      label: 'Memory usage',
      docsUrl: `${DOCS_URL}/guides/telemetry/reports#memory-usage`,
      availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
      hide: false,
      showTooltip: true,
      showLegend: true,
      hideChartType: false,
      defaultChartStyle: 'bar',
      showMaxValue: false,
      showGrid: true,
      syncId: 'database-reports',
      valuePrecision: 2,
      YAxisProps: {
        width: 75,
        tickFormatter: (value: any) => formatBytes(value, 2),
      },
      attributes: [
        {
          attribute: 'ram_usage_used',
          provider: 'infra-monitoring',
          label: 'Used',
          tooltip:
            'RAM in use by Postgres and the operating system. Sustained high usage may indicate memory pressure',
        },
        {
          attribute: 'ram_usage_cache_and_buffers',
          provider: 'infra-monitoring',
          label: 'Cache + Buffers',
          tooltip:
            'RAM used by the operating system page cache and PostgreSQL buffers to accelerate disk reads/writes',
        },
        {
          attribute: 'ram_usage_free',
          provider: 'infra-monitoring',
          label: 'Free',
          tooltip:
            'Unallocated memory available for use. A small portion is always reserved by the operating system',
        },
      ],
    },
    {
      id: 'cpu-usage',
      label: 'CPU usage',
      docsUrl: `${DOCS_URL}/guides/telemetry/reports#cpu-usage`,
      syncId: 'database-reports',
      format: '%',
      valuePrecision: 2,
      availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
      hide: false,
      showTooltip: true,
      showLegend: true,
      showMaxValue: false,
      showGrid: true,
      YAxisProps: {
        width: 45,
        tickFormatter: (value: any) => {
          // avoid displaying 100.00%
          if (value === 100) return '100%'
          return `${numberFormatter(value, 2)}%`
        },
      },
      hideChartType: false,
      defaultChartStyle: 'bar',
      attributes: [
        {
          attribute: 'cpu_usage_busy_system',
          provider: 'infra-monitoring',
          label: 'System',
          format: '%',
          tooltip:
            'CPU time spent on kernel operations (e.g., process scheduling, memory management). High values may indicate system overhead',
        },
        {
          attribute: 'cpu_usage_busy_user',
          provider: 'infra-monitoring',
          label: 'User',
          format: '%',
          tooltip:
            'CPU time used by database queries and user-space processes. High values may suggest CPU-intensive queries',
        },
        {
          attribute: 'cpu_usage_busy_iowait',
          provider: 'infra-monitoring',
          label: 'IOwait',
          format: '%',
          tooltip:
            'CPU time waiting for disk or network I/O. High values may indicate disk bottlenecks',
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
            'CPU time spent on other tasks (e.g., background processes, software interrupts)',
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
      label: 'Disk Input/Output operations per second (IOPS)',
      docsUrl: `${DOCS_URL}/guides/telemetry/reports#disk-inputoutput-operations-per-second-iops`,
      syncId: 'database-reports',
      availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
      hide: false,
      showTooltip: true,
      valuePrecision: 0,
      showLegend: true,
      hideChartType: false,
      showGrid: true,
      showMaxValue: true,
      YAxisProps: {
        width: 55,
        tickFormatter: (value: any) => compactNumberFormatter(value),
      },
      defaultChartStyle: 'bar',
      attributes: [
        {
          attribute: 'disk_iops_write',
          provider: 'infra-monitoring',
          label: 'Write IOPS',
          tooltip:
            'Number of write operations per second. High values indicate frequent data writes, logging, or transaction activity',
        },
        {
          attribute: 'disk_iops_read',
          provider: 'infra-monitoring',
          label: 'Read IOPS',
          tooltip:
            'Number of read operations per second. High values suggest frequent disk reads due to queries or poor caching',
        },
        {
          attribute: 'disk_iops_max',
          provider: 'reference-line',
          label: 'Max IOPS',
          value: diskConfig?.attributes?.iops,
          tooltip:
            'Maximum IOPS (Input/Output Operations Per Second) for your current compute size',
          isMaxValue: true,
        },
      ],
    },
    {
      id: 'disk-throughput',
      label: 'Disk throughput',
      docsUrl: `${DOCS_URL}/guides/platform/compute-add-ons#disk-throughput`,
      syncId: 'database-reports',
      availableIn: ['team', 'enterprise', 'platform'],
      hide: false,
      showTooltip: true,
      format: 'bytes-per-second',
      valuePrecision: 1,
      showLegend: true,
      showMaxValue: true,
      hideChartType: false,
      showGrid: true,
      YAxisProps: {
        width: 70,
        tickFormatter: (value: any) => `${formatBytes(value, 1)}/s`,
      },
      defaultChartStyle: 'stackedAreaLine',
      attributes: [
        {
          attribute: 'disk_bytes_read',
          provider: 'infra-monitoring',
          label: 'Read throughput',
          tooltip: 'Disk read throughput (bytes per second)',
        },
        {
          attribute: 'disk_bytes_written',
          provider: 'infra-monitoring',
          label: 'Write throughput',
          tooltip: 'Disk write throughput (bytes per second)',
        },
        {
          attribute: 'disk_throughput_max',
          provider: 'reference-line',
          label: 'Max throughput',
          value:
            diskConfig?.attributes?.type === 'gp3' &&
            typeof diskConfig.attributes.throughput_mbps === 'number'
              ? diskConfig.attributes.throughput_mbps * 1024 * 1024
              : undefined,
          tooltip: 'Maximum disk throughput for your current compute size',
          isMaxValue: true,
        },
      ],
    },
    {
      // Client Connections metric for free tier
      id: 'client-connections-basic',
      label: 'Database Connections',
      syncId: 'database-reports',
      valuePrecision: 0,
      availableIn: ['free'],
      hide: !isFreePlan,
      showTooltip: false,
      showLegend: false,
      showMaxValue: true,
      hideChartType: false,
      showGrid: true,
      YAxisProps: { width: 30 },
      defaultChartStyle: 'bar',
      docsUrl: `${DOCS_URL}/guides/telemetry/reports#database-connections`,
      attributes: [
        {
          attribute: 'pg_stat_database_num_backends',
          provider: 'infra-monitoring',
          label: 'Total connections',
          tooltip: 'Total number of active database connections',
        },
        {
          attribute: 'max_db_connections',
          provider: 'reference-line',
          label: 'Max connections',
          value: maxConnections?.maxConnections,
          tooltip: 'Max available connections for your current compute size',
          isMaxValue: true,
        },
      ],
    },
    {
      // advanced client connections metric for paid and above
      id: 'client-connections',
      label: 'Database Connections',
      syncId: 'database-reports',
      valuePrecision: 0,
      availableIn: ['pro', 'team', 'enterprise', 'platform'],
      hide: isFreePlan,
      showTooltip: true,
      showLegend: true,
      showMaxValue: true,
      hideChartType: false,
      showGrid: true,
      YAxisProps: { width: 30 },
      defaultChartStyle: 'bar',
      docsUrl: `${DOCS_URL}/guides/telemetry/reports#database-connections`,
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
        {
          attribute: 'max_db_connections',
          provider: 'reference-line',
          label: 'Max connections',
          value: maxConnections?.maxConnections,
          tooltip: 'Max available connections for your current compute size',
          isMaxValue: true,
        },
      ],
    },
    {
      id: 'pgbouncer-connections',
      label: 'Dedicated Pooler Client Connections',
      syncId: 'database-reports',
      valuePrecision: 0,
      availableIn: ['pro', 'team', 'enterprise', 'platform'],
      hide: isFreePlan,
      showTooltip: true,
      showLegend: true,
      showMaxValue: true,
      showGrid: true,
      YAxisProps: { width: 30 },
      hideChartType: false,
      defaultChartStyle: 'bar',
      docsUrl: `${DOCS_URL}/guides/platform/compute-and-disk#limits-and-constraints`,
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
          value: pgBouncerMaxConnections,
          tooltip: 'Maximum allowed pooler connections for your current compute size',
          isMaxValue: true,
        },
      ],
    },
    {
      id: 'supavisor-connections-active',
      label: 'Shared Pooler (Supavisor) client connections',
      syncId: 'database-reports',
      valuePrecision: 0,
      availableIn: ['pro', 'team', 'enterprise', 'platform'],
      hide: isFreePlan,
      showTooltip: false,
      showLegend: false,
      showMaxValue: false,
      showGrid: true,
      YAxisProps: { width: 30 },
      hideChartType: false,
      defaultChartStyle: 'bar',
      attributes: [
        {
          attribute: 'supavisor_connections_active',
          provider: 'infra-monitoring',
          label: 'supavisor',
          tooltip: 'Supavisor connections',
        },
      ],
    },
    {
      id: 'disk-size',
      label: 'Disk Usage',
      syncId: 'database-reports',
      valuePrecision: 2,
      availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
      hide: false,
      showTooltip: true,
      showLegend: true,
      showMaxValue: true,
      showGrid: true,
      YAxisProps: {
        width: 65,
        tickFormatter: (value: any) => formatBytes(value, 1),
      },
      hideChartType: false,
      defaultChartStyle: 'bar',
      docsUrl: `${DOCS_URL}/guides/telemetry/reports#disk-size`,
      attributes: [
        {
          attribute: 'disk_fs_used_system',
          provider: 'infra-monitoring',
          format: 'bytes',
          label: 'System',
          tooltip: 'Reserved space for the system to ensure your database runs smoothly',
        },
        {
          attribute: 'disk_fs_used_wal',
          provider: 'infra-monitoring',
          format: 'bytes',
          label: 'WAL',
          tooltip:
            'Disk usage by the write-ahead log. The usage depends on your WAL settings and the amount of data being written to the database',
        },
        {
          attribute: 'pg_database_size',
          provider: 'infra-monitoring',
          format: 'bytes',
          label: 'Database',
          tooltip: 'Disk usage by your database (tables, indexes, data, ...)',
        },
        {
          attribute: 'disk_fs_size',
          provider: 'infra-monitoring',
          isMaxValue: true,
          format: 'bytes',
          label: 'Disk Size',
          tooltip: 'Disk Size refers to the total space your project occupies on disk',
        },
        !isFreePlan &&
          (isSpendCapEnabled
            ? {
                attribute: 'pg_database_size_percent_paid_spendCap',
                provider: 'reference-line',
                isReferenceLine: true,
                strokeDasharray: '4 2',
                label: 'Spend cap enabled',
                value: diskConfig?.attributes?.size_gb! * 1024 * 1024 * 1024,
                className: '[&_line]:!stroke-yellow-800 [&_line]:!opacity-100',
                opacity: 1,
              }
            : {
                attribute: 'pg_database_size_percent_paid',
                provider: 'reference-line',
                isReferenceLine: true,
                label: '90% - Disk resize threshold',
                className: '[&_line]:!stroke-yellow-800',
                value: diskConfig?.attributes?.size_gb! * 1024 * 1024 * 1024 * 0.9,
              }),
      ],
    },
  ]
}
