import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const telemetryDebugging: ContentListingGroup = {
  id: 'telemetry-debugging',
  heading: 'Debugging',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Debugging guide',
      href: '/guides/monitoring-and-debugging/debugging',
      description:
        'Isolate the failing layer, read logs as evidence, and match symptoms to troubleshooting guides.',
    },
    {
      title: 'Logs',
      href: '/guides/monitoring-and-debugging/logs',
      description: 'Inspect project log events in the unified Logs view in Studio.',
    },
    {
      title: 'Query and filter logs',
      href: '/guides/monitoring-and-debugging/advanced-log-filtering',
      description: 'Run ClickHouse SQL from Studio, MCP, the API, or a script.',
    },
    {
      title: 'Troubleshooting index',
      href: '/guides/troubleshooting',
      description: 'Searchable index of known error codes, symptoms, and fixes.',
    },
    {
      title: 'Diagnosing stuck and blocked queries',
      href: '/guides/database/connection-management#diagnosing-stuck-and-blocked-queries',
      description: 'Find sessions blocked by a lock, and cancel or terminate the one responsible.',
    },
  ],
}

export const telemetryMonitoring: ContentListingGroup = {
  id: 'telemetry-monitoring',
  heading: 'Monitoring',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Log drains',
      href: '/guides/monitoring-and-debugging/log-drains',
      description: 'Forward logs to Datadog, Loki, Axiom, S3, or a custom HTTP endpoint.',
    },
    {
      title: 'Reports',
      href: '/guides/monitoring-and-debugging/reports',
      description: 'Built-in dashboards for API, Auth, Storage, and Realtime activity.',
    },
    {
      title: 'Metrics',
      href: '/guides/monitoring-and-debugging/metrics',
      description: 'Prometheus-compatible database metrics for Grafana and other tools.',
    },
    {
      title: 'Client-side tracing',
      href: '/guides/monitoring-and-debugging/client-side-tracing',
      description: 'Correlate browser requests end-to-end using W3C Trace Context.',
    },
    {
      title: 'Query optimization',
      href: '/guides/database/query-optimization',
      description: 'Find and fix slow queries using indexes and query plan analysis.',
    },
    {
      title: 'Sentry integration',
      href: '/guides/monitoring-and-debugging/sentry-monitoring',
      description: 'Send errors to Sentry for alerting and grouping.',
    },
  ],
}
