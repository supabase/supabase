import Link from 'next/link'
import { cn } from 'ui'
import { AnimatedGridBackground } from '../AnimatedGridBackground'

type Announcement = {
  title: string
  url: string
}

type Month = {
  name: string
  isLaunchWeek?: boolean
  announcements: Announcement[]
}

const months: Month[] = [
  {
    name: 'January 2025',
    announcements: [
      {
        title: 'Third-party Auth providers are now GA',
        url: 'https://supabase.link/docs-third-party-auth-ga-jan2025',
      },
      {
        title: 'Easier errors and logs',
        url: 'https://supabase.link/link-easier-errors-logs-jan2025',
      },
      {
        title: 'Enhanced JSON types',
        url: 'https://supabase.link/github-enhanced-json-types-jan2025',
      },
      {
        title: 'New Supabase integrations',
        url: 'https://supabase.link/link-new-supabase-integrations-jan2025',
      },
      {
        title: 'Performance improvements for Storage CDN',
        url: 'https://supabase.link/link-performance-improvements-storage-cdn-jan2025',
      },
    ],
  },
  {
    name: 'February 2025',
    announcements: [
      {
        title: 'Deploy Edge Functions via GitHub',
        url: 'https://supabase.link/link-deploy-edge-functions-feb2025-riur',
      },
      {
        title: 'Connect AI agents to Supabase',
        url: 'https://supabase.link/link-connect-ai-supabase-feb2025-nwod',
      },
      {
        title: 'Enhanced JSON query operators',
        url: 'https://supabase.link/link-enhanced-json-query-operators-feb2025-d6ho',
      },
      {
        title: 'New community integrations',
        url: 'https://supabase.link/link-new-community-integrations-feb2025-hrhx',
      },
    ],
  },
  {
    name: 'March 2025',
    isLaunchWeek: true,
    announcements: [
      {
        title: 'Supabase MCP Server',
        url: 'https://supabase.link/link-supabase-mcp-server-mar2025-67zo',
      },
      {
        title: 'Supabase UI Library',
        url: 'https://supabase.link/link-supabase-ui-library-mar2025-sy2o',
      },
      {
        title: 'Supabase Templates',
        url: 'https://supabase.link/link-supabase-templates-mar2025-fqbo',
      },
      {
        title: 'Queue: Postgres-native Job Queue',
        url: 'https://supabase.link/link-postgres-queue-mar2025-zrz3',
      },
      {
        title: 'Supabase Logs: Open-Source Logging Infrastructure',
        url: 'https://supabase.link/link-supabase-logs-mar2025-oeuf',
      },
      {
        title: 'Anonymous Sign-ins',
        url: 'https://supabase.link/link-anon-sign-ins-mar2025-g4ms',
      },
      {
        title: 'Storage: Resumable Uploads',
        url: 'https://supabase.link/link-storage-resumable-uploads-mar2025-f3ds',
      },
      {
        title: 'Custom Access Tokens',
        url: 'https://supabase.link/link-custom-access-tokens-mar2025-9u9z',
      },
      {
        title: 'Realtime: Broadcast from Database',
        url: 'https://supabase.link/link-realtime-broadcast-database-mar2025-6lhq',
      },
      {
        title: 'Database Webhooks',
        url: 'https://supabase.link/link-database-webhooks-mar2025-bvj9',
      },
      {
        title: 'Functions: Background Tasks',
        url: 'https://supabase.link/link-functions-background-tasks-mar2025-4hf3',
      },
      {
        title: 'Postgres Language Server',
        url: 'https://supabase.link/link-postgres-language-server-mar2025-gvt7',
      },
    ],
  },
  {
    name: 'April 2025',
    announcements: [
      {
        title: 'Project-scoped roles',
        url: 'https://supabase.link/github-project-scoped-roles-apr2025-k2mz',
      },
      {
        title: 'MCP Server + VSCode setup',
        url: 'https://supabase.link/twitter-mcp-server-vscode-setup-apr2025-0580',
      },
      {
        title: 'AI Agent integrations',
        url: 'https://supabase.link/link-ai-agent-integrations-apr2025-8jkl',
      },
      {
        title: 'Database branching improvements',
        url: 'https://supabase.link/link-database-branching-apr2025-3mnp',
      },
    ],
  },
  {
    name: 'May 2025',
    announcements: [
      {
        title: 'Dashboard visual update',
        url: 'https://supabase.link/twitter-supabase-dashboard-update-may2025-6btg',
      },
      {
        title: 'Figma + Make + Supabase workflow',
        url: 'https://supabase.link/twitter-figma-make-supabase-may2025-7kjy',
      },
      {
        title: 'Edge Functions monitoring',
        url: 'https://supabase.link/link-edge-functions-monitoring-may2025-9qrs',
      },
    ],
  },
  {
    name: 'August 2025',
    isLaunchWeek: true,
    announcements: [
      { title: 'JWT Signing Keys', url: 'https://supabase.com/blog/jwt-signing-keys' },
      { title: 'Automatic Embeddings', url: 'https://supabase.com/blog/automatic-embeddings' },
      { title: 'Storage v4', url: 'https://supabase.com/blog/storage-v4' },
      { title: 'Realtime 3.0', url: 'https://supabase.com/blog/realtime-broadcast-authorization' },
      {
        title: 'pg_replicate: Build Postgres Replicas',
        url: 'https://supabase.com/blog/pg-replicate',
      },
      { title: 'Supavisor 2.0', url: 'https://supabase.com/blog/supavisor-v2' },
      {
        title: 'Edge Functions: Deploy Previews',
        url: 'https://supabase.com/blog/edge-functions-deploy-previews',
      },
      { title: 'Logs: Sources and Sinks', url: 'https://supabase.com/blog/log-drains' },
      { title: 'Database Migration UI', url: 'https://supabase.com/blog/database-migrations-ui' },
      { title: 'AI Assistant v2', url: 'https://supabase.com/blog/ai-assistant-v2' },
      { title: 'Supabase Studio 2.0', url: 'https://supabase.com/blog/supabase-studio-2' },
      {
        title: 'Auth Helpers Everywhere',
        url: 'https://supabase.com/blog/auth-helpers-everywhere',
      },
    ],
  },
  {
    name: 'September 2025',
    announcements: [
      {
        title: 'Broadcast Replay',
        url: 'https://supabase.com/docs/guides/realtime/broadcast#broadcast-replay',
      },
      {
        title: 'Performance Advisor improvements',
        url: 'https://github.com/orgs/supabase/discussions/33287',
      },
      { title: 'MCP Server updates', url: 'https://supabase.com/docs/guides/ai/mcp' },
    ],
  },
  {
    name: 'October 2025',
    announcements: [
      {
        title: 'Supabase Series E announcement',
        url: 'https://supabase.com/blog/supabase-series-e',
      },
      { title: 'Remote MCP Server', url: 'https://supabase.com/blog/remote-mcp-server' },
      {
        title: 'Enhanced database observability',
        url: 'https://supabase.com/docs/guides/platform/metrics',
      },
    ],
  },
  {
    name: 'November 2025',
    announcements: [
      {
        title: 'Realtime Broadcast Replay',
        url: 'https://supabase.com/blog/realtime-broadcast-replay',
      },
      {
        title: 'Auth email template customization',
        url: 'https://supabase.com/docs/guides/auth/auth-email-templates',
      },
      {
        title: 'Edge Functions cold start improvements',
        url: 'https://supabase.com/docs/guides/functions',
      },
    ],
  },
  {
    name: 'December 2025',
    isLaunchWeek: true,
    announcements: [
      { title: 'Supabase ETL', url: 'https://supabase.com/blog/introducing-supabase-etl' },
      {
        title: 'Analytics Buckets',
        url: 'https://supabase.com/blog/introducing-analytics-buckets',
      },
      { title: 'Vector Buckets', url: 'https://supabase.com/blog/vector-buckets' },
      { title: 'iceberg-js', url: 'https://supabase.com/blog/introducing-iceberg-js' },
      {
        title: 'Supabase for Platforms',
        url: 'https://supabase.com/blog/introducing-supabase-for-platforms',
      },
      {
        title: 'Sign in with Your App (OAuth2 Provider)',
        url: 'https://supabase.com/blog/oauth2-provider',
      },
      { title: 'Supabase for Kiro IDE', url: 'https://supabase.com/blog/supabase-power-for-kiro' },
      {
        title: 'Async Streaming for Postgres Foreign Data Wrappers',
        url: 'https://supabase.com/blog/async-postgres-fdws',
      },
      {
        title: 'Own Your Observability: Supabase Metrics API',
        url: 'https://supabase.com/blog/metrics-api-observability',
      },
    ],
  },
]

function MonthSection({ month }: { month: Month }) {
  return (
    <div>
      <div className="px-6 lg:px-8 py-2.5 md:py-4 flex flex-wrap items-center gap-1 [&>*]:whitespace-nowrap [&>*]:mr-2">
        <span className="text-base font-medium">{month.name}</span>
        {month.isLaunchWeek && (
          <span className="text-xs bg-brand/10 text-brand-link dark:text-brand px-2 py-0.5 rounded-full">
            Launch Week
          </span>
        )}
        <span className="text-sm text-foreground-muted">
          {month.announcements.length} announcements
        </span>
      </div>

      <ul className="px-6 lg:px-8 pb-4 space-y-2">
        {month.announcements.map((announcement) => (
          <li key={announcement.title}>
            <Link
              href={announcement.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-sm text-foreground-light hover:text-foreground transition-colors"
            >
              <span className="text-foreground-muted group-hover:text-foreground transition-colors">
                →
              </span>
              {announcement.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const ProductAnnouncements = () => {
  return (
    <>
      <section className="relative max-w-[60rem] h-[240px] md:h-[360px] mx-auto border-x border-b w-[95%] md:w-full">
        {/* Grid background */}
        <AnimatedGridBackground
          cols={5}
          rows={{ mobile: 2, desktop: 3 }}
          tiles={[
            { cell: 1, type: 'stripes' },
            { cell: 4, type: 'dots' },
            { cell: 6, type: 'dots' },
            { cell: 9, type: 'stripes' },
          ]}
          initialDelay={0.35}
        />

        {/* Content */}
        <div className="flex flex-col justify-end h-full px-4 lg:px-8 py-0 relative">
          <h2 className="font-medium tracking-tighter text-6xl md:text-7xl lg:text-[5.6rem] translate-y-2 lg:translate-y-[10px]">
            Launch <span className="line-through text-foreground-muted">Week</span> Year
          </h2>
        </div>
      </section>

      <div className="relative max-w-[60rem] mx-auto border-x border-b px-4 lg:px-8 py-12 w-[95%] md:w-full">
        <h3 className="text-lg">Product Announcements — Everything we shipped in 2025.</h3>
      </div>

      {/* Months accordion - 2 columns, top-to-bottom flow */}
      <div className="relative max-w-[60rem] mx-auto border-x border-b w-[95%] md:w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Smaller breakpoint: chronological order for one column */}
          {months.map((month, index) => (
            <div
              key={`mobile-${month.name}`}
              className={cn(
                'border-b border-muted lg:hidden',
                index === months.length - 1 && 'border-b-0'
              )}
            >
              <MonthSection month={month} />
            </div>
          ))}
          {/* Larger breakpoint: zig-zag/top-to-bottom flow for two columns */}
          {(() => {
            const half = Math.ceil(months.length / 2)
            const reordered: Month[] = []
            for (let i = 0; i < half; i++) {
              reordered.push(months[i])
              if (i + half < months.length) {
                reordered.push(months[i + half])
              }
            }
            const lastRow = Math.floor((reordered.length - 1) / 2)
            return reordered.map((month, index) => (
              <div
                key={`desktop-${month.name}`}
                className={cn(
                  'hidden lg:block border-b border-muted lg:border-r',
                  'lg:[&:nth-child(2n)]:border-r-0',
                  Math.floor(index / 2) === lastRow && 'lg:border-b-0',
                  index === reordered.length - 1 && 'border-b-0'
                )}
              >
                <MonthSection month={month} />
              </div>
            ))
          })()}
        </div>
      </div>
    </>
  )
}
