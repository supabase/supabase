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
      title: 'Logging',
      href: '/guides/monitoring-and-debugging/logs',
      description: 'Query events from any Supabase service using the Logs Explorer.',
    },
    {
      title: 'Advanced log filtering',
      href: '/guides/monitoring-and-debugging/advanced-log-filtering',
      description: 'Regex filtering, structured-field queries, and field discovery in ClickHouse.',
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
    {
      title: 'MCP server setup',
      href: '/docs/guides/ai-tools/mcp',
      description: 'Connect Claude, Cursor, or any MCP-compatible agent to your Supabase project.',
    },
  ],
}
