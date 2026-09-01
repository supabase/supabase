import { monitoringAgents } from '~/data/monitoring-agents.data'
import { getScheduleLabel } from '~/data/monitoring-agents.utils'
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

export const telemetryAccessWhat: ContentListingGroup = {
  id: 'telemetry-access-what',
  heading: 'What data you can observe',
  headingLevel: 'h3',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Logs',
      href: '/guides/monitoring-and-debugging/advanced-log-filtering',
      description:
        'Query project logs and look up sources and fields. Record extra Postgres, API, and Realtime events.',
    },
    {
      title: 'Metrics API',
      href: '/guides/monitoring-and-debugging/metrics',
      description: 'Scrape Prometheus-compatible database metrics for dashboards and alerting.',
    },
    {
      title: 'Database',
      href: '/guides/monitoring-and-debugging/inspect',
      description:
        'Inspect live Postgres stats such as bloat, cache hit rate, locks, and slow queries.',
    },
    {
      title: 'Advisors',
      href: '/guides/monitoring-and-debugging/advisors',
      description:
        'Pull deterministic security and performance findings as part of ongoing observability.',
    },
  ],
}

export const telemetryAccessWhere: ContentListingGroup = {
  id: 'telemetry-access-where',
  heading: 'Where you can observe it',
  headingLevel: 'h3',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'MCP',
      href: '/guides/monitoring-and-debugging/access-data#mcp',
      description:
        'Query logs, run read-only SQL, and fetch advisor findings from an agent harness.',
    },
    {
      title: 'API',
      href: '/guides/monitoring-and-debugging/access-data#api',
      description: 'Read logs, advisors, and usage counts, or scrape the Metrics API.',
    },
    {
      title: 'CLI',
      href: '/guides/monitoring-and-debugging/access-data#cli',
      description:
        'Inspect the database and run security or performance advisors from the terminal.',
    },
    {
      title: 'Studio',
      href: '/guides/monitoring-and-debugging/access-data#studio',
      description: 'Open Logs, Reports, and Advisors in the browser.',
    },
  ],
}

export const telemetryHireAgent: ContentListingGroup = {
  id: 'telemetry-hire-agent',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: monitoringAgents.health.name,
      href: '/guides/monitoring-and-debugging/automate-with-agents/health',
      subtitle: getScheduleLabel(monitoringAgents.health),
      description: 'Watch logs for 5xx spikes and Auth failures.',
    },
    {
      title: monitoringAgents.security.name,
      href: '/guides/monitoring-and-debugging/automate-with-agents/security',
      subtitle: getScheduleLabel(monitoringAgents.security),
      description: 'Review advisor findings and authorization failures.',
    },
    {
      title: monitoringAgents.performance.name,
      href: '/guides/monitoring-and-debugging/automate-with-agents/performance',
      subtitle: getScheduleLabel(monitoringAgents.performance),
      description: 'Find slow queries, lock waits, and missing indexes.',
    },
    {
      title: monitoringAgents.usage.name,
      href: '/guides/monitoring-and-debugging/automate-with-agents/usage',
      subtitle: getScheduleLabel(monitoringAgents.usage),
      description: 'Track request growth, error rates, and approaching limits.',
    },
  ],
}
