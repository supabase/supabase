export const getReportAttributes = () => [
  {
    id: 'ram-usage',
    label: 'Memory usage',
    hide: false,
    showTooltip: true,
    showLegend: true,
    hideChartType: true,
    defaultChartStyle: 'line',
    showMaxValue: false,
    attributes: [
      // {
      //   attribute: 'ram_usage_max_available',
      //   provider: 'infra-monitoring',
      //   label: 'Max RAM Available',
      //   isMaxValue: true,
      // },
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
          'Available unused RAM. Low values may lead to increased swapping and slower performance.',
      },
      {
        attribute: 'ram_usage_swap',
        provider: 'infra-monitoring',
        label: 'Swap',
        tooltip:
          'Memory swapped to disk when RAM is full. High values indicate memory exhaustion, potentially causing slowdowns.',
      },
    ],
  },
  {
    id: 'cpu-usage',
    label: 'CPU usage',
    format: '%',
    valuePrecision: 2,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: true,
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
          'CPU time waiting for disk or network I/O. High values may indicate storage bottlenecks.',
      },
      {
        attribute: 'cpu_usage_busy_irqs',
        provider: 'infra-monitoring',
        label: 'IRQs',
        format: '%',
        tooltip: 'CPU time handling hardware',
      },
      {
        attribute: 'cpu_usage_busy_other',
        provider: 'infra-monitoring',
        label: 'Other',
        format: '%',
        tooltip: 'CPU time spent on other tasks (e.g., background processes, software interrupts).',
      },
      // {
      //   attribute: 'cpu_usage_busy_idle',
      //   provider: 'infra-monitoring',
      //   label: 'idle',
      //   format: '%',
      //   tooltip:
      //     'Percentage of CPU time that is not actively in use. High values mean low CPU utilization.',
      // },
    ],
  },
  {
    id: 'client-connections',
    label: 'Client connections',
    valuePrecision: 0,
    hide: false,
    showTooltip: false,
    showLegend: false,
    showMaxValue: false,
    hideChartType: true,
    defaultChartStyle: 'bar',
    attributes: [
      {
        attribute: 'pg_stat_database_num_backends',
        provider: 'infra-monitoring',
        label: 'active connections',
        tooltip: 'Active connections',
      },
      // {
      //   attribute: 'client_connections_postgres_active',
      //   provider: 'infra-monitoring',
      //   label: 'pg active',
      //   tooltip: 'Postgres active connections',
      // },
      // {
      //   attribute: 'client_connections_postgres_idle',
      //   provider: 'infra-monitoring',
      //   label: 'pg idle',
      //   tooltip: 'Postgres idle connections',
      // },
      // {
      //   attribute: 'client_connections_postgres_idle_in_transaction',
      //   provider: 'infra-monitoring',
      //   label: 'pg idle in transaction',
      //   tooltip: 'Postgres idle in transaction connections',
      // },
      // {
      //   attribute: 'supavisor_connections_active',
      //   provider: 'infra-monitoring',
      //   label: 'supavisor',
      //   tooltip: 'Supavisor connections',
      // },
      // {
      //   attribute: 'client_connections_realtime',
      //   provider: 'infra-monitoring',
      //   label: 'realtime',
      //   tooltip: 'Realtime connections',
      // },
      // {
      //   attribute: 'client_connections_max_limit',
      //   provider: 'infra-monitoring',
      //   label: 'Max connections',
      //   isMaxValue: true,
      // },
    ],
  },
  {
    id: 'pgbouncer-connections',
    label: 'pgbouncer connections',
    valuePrecision: 0,
    hide: false,
    showTooltip: false,
    showLegend: false,
    showMaxValue: false,
    hideChartType: true,
    defaultChartStyle: 'bar',
    attributes: [
      {
        attribute: 'client_connections_pgbouncer',
        provider: 'infra-monitoring',
        label: 'pgbouncer',
        tooltip: 'PgBouncer connections',
      },
    ],
  },
  {
    id: 'disk-iops',
    label: 'Disk IOps',
    hide: false,
    showTooltip: true,
    showLegend: true,
    hideChartType: true,
    defaultChartStyle: 'line',
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
      // {
      //   attribute: 'disk_iops_max',
      //   provider: 'infra-monitoring',
      //   label: 'IOps Max',
      //   isMaxValue: true,
      // },
    ],
  },
]
