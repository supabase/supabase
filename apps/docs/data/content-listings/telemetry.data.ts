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
      href: '/guides/database/inspect',
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
      description: 'Read logs, advisors, and usage counts from the Management API.',
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
      description: 'Filter Logs and open Reports in the browser.',
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
        'If you are observing, run a few checks to see whether something is wrong.',
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
      description: 'Watch logs for 5xx spikes and Auth failures.',
    },
    {
      title: 'Security officer',
      href: '/guides/monitoring-and-debugging/automate-with-agents/security',
      description: 'Review advisor findings and authorization failures.',
    },
    {
      title: 'Personal trainer',
      href: '/guides/monitoring-and-debugging/automate-with-agents/performance',
      description: 'Find slow queries, lock waits, and missing indexes.',
    },
    {
      title: 'Accountant',
      href: '/guides/monitoring-and-debugging/automate-with-agents/usage',
      description: 'Track request growth, error rates, and approaching limits.',
    },
  ],
}
