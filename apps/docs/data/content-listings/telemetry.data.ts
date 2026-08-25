import { monitoringAgents } from '~/data/monitoring-agents.data'
import { getScheduleLabel } from '~/data/monitoring-agents.utils'
import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const telemetryAccessWhat: ContentListingGroup = {
  id: 'telemetry-access-what',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Logs',
      href: '/guides/monitoring-and-debugging/advanced-log-filtering',
      description:
        'Query ClickHouse logs from Studio, MCP, or the API. Filter events in the Logs UI.',
    },
    {
      title: 'Metrics API',
      href: '/guides/monitoring-and-debugging/metrics',
      description: 'Scrape Prometheus-compatible database metrics, or chart a subset in Reports.',
    },
    {
      title: 'Database',
      href: '/guides/monitoring-and-debugging/inspect',
      description: 'Inspect live Postgres stats from the CLI, the SQL Editor, or MCP.',
    },
    {
      title: 'Advisors',
      href: '/guides/monitoring-and-debugging/advisors',
      description: 'Pull security and performance findings from Studio, MCP, the CLI, or the API.',
    },
    {
      title: 'Reports',
      href: '/guides/monitoring-and-debugging/reports',
      description: 'Studio dashboards for API, Auth, Storage, Realtime, and database signals.',
    },
  ],
}

export const telemetryDetectResolve: ContentListingGroup = {
  id: 'telemetry-detect-resolve',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Detecting',
      href: '/guides/monitoring-and-debugging/debugging',
      description:
        'Use logs, metrics, inspect, and advisors to pick up a signal. If you already have an error, go to Diagnosing.',
    },
    {
      title: 'Diagnosing',
      href: '/guides/troubleshooting',
      description: 'Browse known symptoms, error codes, and fixes by product or type.',
    },
  ],
}

export const telemetryHireAgent: ContentListingGroup = {
  id: 'telemetry-hire-agent',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Generalist',
      href: '/guides/monitoring-and-debugging/automate-with-agents/all',
      subtitle: getScheduleLabel(monitoringAgents.all),
      description:
        'Run all four checks — health, security, performance, and usage — in one daily pass.',
    },
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

export const telemetryExport: ContentListingGroup = {
  id: 'telemetry-export',
  type: 'grid',
  columns: 3,
  items: [
    {
      title: 'Log drains',
      href: '/guides/monitoring-and-debugging/log-drains',
      description: 'Send project logs to your own destination.',
    },
    {
      title: 'Client-side tracing',
      href: '/guides/monitoring-and-debugging/client-side-tracing',
      description: 'Propagate W3C trace context from the client through Supabase services.',
    },
    {
      title: 'Sentry integration',
      href: '/guides/monitoring-and-debugging/sentry-monitoring',
      description: 'Capture supabase-js errors and spans in Sentry.',
    },
  ],
}
