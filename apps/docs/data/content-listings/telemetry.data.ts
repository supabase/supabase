import { monitoringAgents } from '~/data/monitoring-agents.data'
import { getScheduleLabel } from '~/data/monitoring-agents.utils'
import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const telemetryAccessWhat: ContentListingGroup = {
  id: 'telemetry-access-what',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Query logs with SQL',
      href: '/guides/observability/advanced-log-filtering',
      description: 'Query ClickHouse events through MCP, the API, or Explorer.',
    },
    {
      title: 'Logs in Studio',
      href: '/guides/observability/logs',
      description: 'Filter, inspect, and export events in the unified Logs view.',
    },
    {
      title: 'Log sources and fields',
      href: '/guides/observability/log-field-reference',
      description: 'Look up sources, ClickHouse query fields, and capture limits.',
    },
    {
      title: 'Metrics API',
      href: '/guides/observability/metrics',
      description: 'Scrape Prometheus-compatible database metrics, or chart a subset in Reports.',
    },
    {
      title: 'Inspect the database',
      href: '/guides/observability/inspect',
      description: 'Inspect live Postgres stats from the CLI, Explorer, or MCP.',
    },
    {
      title: 'Advisors',
      href: '/guides/observability/advisors',
      description: 'Pull security and performance findings from Studio, MCP, the CLI, or the API.',
    },
    {
      title: 'Reports',
      href: '/guides/observability/reports',
      description: 'Studio dashboards for API, Auth, Storage, Realtime, and database signals.',
    },
  ],
}

export const telemetryDetect: ContentListingGroup = {
  id: 'telemetry-detect',
  type: 'grid',
  items: [
    {
      title: 'Detect issues',
      href: '/guides/observability/detecting',
      description:
        'Run health, security, performance, and capacity checks against logs and database statistics to pick up a signal.',
    },
  ],
}

export const telemetryDiagnose: ContentListingGroup = {
  id: 'telemetry-diagnose',
  type: 'grid',
  items: [
    {
      title: 'Diagnose and resolve',
      href: '/guides/troubleshooting',
      description:
        'Use a concrete finding, symptom, or error code to identify the cause and apply a known solution.',
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
      href: '/guides/observability/automate-with-agents/all',
      subtitle: getScheduleLabel(monitoringAgents.all),
      description:
        'Run all four checks — health, security, performance, and capacity — in one daily pass.',
    },
    {
      title: monitoringAgents.health.name,
      href: '/guides/observability/automate-with-agents/health',
      subtitle: getScheduleLabel(monitoringAgents.health),
      description: 'Check API and Auth server errors and connection pressure.',
    },
    {
      title: monitoringAgents.security.name,
      href: '/guides/observability/automate-with-agents/security',
      subtitle: getScheduleLabel(monitoringAgents.security),
      description: 'Review advisor findings and authorization failures.',
    },
    {
      title: monitoringAgents.performance.name,
      href: '/guides/observability/automate-with-agents/performance',
      subtitle: getScheduleLabel(monitoringAgents.performance),
      description: 'Review sessions, query regressions, and performance advisors.',
    },
    {
      title: monitoringAgents.usage.name,
      href: '/guides/observability/automate-with-agents/usage',
      subtitle: getScheduleLabel(monitoringAgents.usage),
      description: 'Track sizes, connections, request growth, and supported forecasts.',
    },
  ],
}

export const telemetryExport: ContentListingGroup = {
  id: 'telemetry-export',
  type: 'grid',
  columns: 3,
  items: [
    {
      title: 'Configure logging',
      href: '/guides/observability/configure-logging',
      description: 'Record additional Postgres and Realtime events.',
    },
    {
      title: 'Log drains',
      href: '/guides/observability/log-drains',
      description: 'Send project logs to your own destination.',
    },
    {
      title: 'Client-side tracing',
      href: '/guides/observability/client-side-tracing',
      description: 'Propagate W3C trace context from the client through Supabase services.',
    },
    {
      title: 'Sentry integration',
      href: '/guides/observability/sentry-monitoring',
      description: 'Capture supabase-js errors and spans in Sentry.',
    },
  ],
}
