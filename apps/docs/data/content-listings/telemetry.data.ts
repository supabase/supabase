import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const telemetryDebugging: ContentListingGroup = {
  id: 'telemetry-debugging',
  heading: 'Debugging',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Debugging guide',
      href: '/guides/telemetry/debugging',
      description:
        'Isolate the failing layer, read logs as evidence, and match symptoms to troubleshooting guides.',
    },
    {
      title: 'Logging',
      href: '/guides/telemetry/logs',
      description: 'Query events from any Supabase service using the Logs Explorer.',
    },
    {
      title: 'Advanced log filtering',
      href: '/guides/telemetry/advanced-log-filtering',
      description: 'Regex filtering, structured-field queries, and field discovery in ClickHouse.',
    },
    {
      title: 'Troubleshooting index',
      href: '/guides/troubleshooting',
      description: 'Searchable index of known error codes, symptoms, and fixes.',
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
      href: '/guides/telemetry/log-drains',
      description: 'Forward logs to Datadog, Loki, Axiom, S3, or a custom HTTP endpoint.',
    },
    {
      title: 'Reports',
      href: '/guides/telemetry/reports',
      description: 'Built-in dashboards for API, Auth, Storage, and Realtime activity.',
    },
    {
      title: 'Metrics',
      href: '/guides/telemetry/metrics',
      description: 'Prometheus-compatible database metrics for Grafana and other tools.',
    },
    {
      title: 'Client-side tracing',
      href: '/guides/telemetry/client-side-tracing',
      description: 'Correlate browser requests end-to-end using W3C Trace Context.',
    },
    {
      title: 'Sentry integration',
      href: '/guides/telemetry/sentry-monitoring',
      description: 'Send errors to Sentry for alerting and grouping.',
    },
  ],
}
