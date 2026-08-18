import { monitoringAgents } from '~/data/monitoring-agents.data'
import { getScheduleLabel } from '~/data/monitoring-agents.utils'
import type { ContentListingGroup } from '~/lib/content-listings.schema'

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

export const telemetryDetectResolve: ContentListingGroup = {
  id: 'telemetry-detect-resolve',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Detecting',
      href: '/guides/monitoring-and-debugging/debugging',
      description:
        'Run checks if you are observing, or pick a log source if you already have an error.',
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
      title: 'Doctor',
      href: '/guides/monitoring-and-debugging/automate-with-agents/health',
      subtitle: getScheduleLabel(monitoringAgents.health),
      description: 'Watch logs for 5xx spikes and Auth failures.',
    },
    {
      title: 'Security officer',
      href: '/guides/monitoring-and-debugging/automate-with-agents/security',
      subtitle: getScheduleLabel(monitoringAgents.security),
      description: 'Review advisor findings and authorization failures.',
    },
    {
      title: 'Personal trainer',
      href: '/guides/monitoring-and-debugging/automate-with-agents/performance',
      subtitle: getScheduleLabel(monitoringAgents.performance),
      description: 'Find slow queries, lock waits, and missing indexes.',
    },
    {
      title: 'Accountant',
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
