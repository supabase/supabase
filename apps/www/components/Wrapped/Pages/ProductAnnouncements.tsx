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
        title: 'Third-party Auth with Firebase is now GA',
        url: 'https://supabase.com/docs/guides/auth/third-party/firebase-auth',
      },
      {
        title: 'Easier to see errors in log charts',
        url: 'https://github.com/supabase/supabase/pull/32742',
      },
      {
        title: 'Enhanced type inference for JSON fields',
        url: 'https://github.com/orgs/supabase/discussions/32925',
      },
      {
        title: 'Type validation for query filter values',
        url: 'https://supabase.com/docs/guides/api/rest/generating-types',
      },
      {
        title: 'AI Prompt for writing Edge Functions',
        url: 'https://supabase.com/docs/guides/getting-started/ai-prompts/edge-functions',
      },
    ],
  },
  {
    name: 'February 2025',
    announcements: [
      {
        title: 'Deploy Edge Functions from the Supabase dashboard',
        url: 'https://x.com/kiwicopple/status/1889031271801905543',
      },
      {
        title: 'Deploy Edge Functions from the CLI',
        url: 'https://x.com/kiwicopple/status/1890284547897716762',
      },
      {
        title: 'Deploy Edge Functions using the API',
        url: 'https://x.com/kiwicopple/status/1892394059559231728',
      },
      {
        title: 'Connect AI tools and LLMs to Supabase',
        url: 'https://supabase.com/docs/guides/getting-started/mcp',
      },
      {
        title: 'Third-party Auth is now a lot cheaper',
        url: 'https://github.com/orgs/supabase/discussions/33959',
      },
      {
        title: 'New billing documentation',
        url: 'https://supabase.com/docs/guides/platform/billing-on-supabase',
      },
      {
        title: 'Using Postgres as a Graph Database',
        url: 'https://supabase.com/blog/pgrouting-postgres-graph-database',
      },
      {
        title: 'HubSpot Foreign Data Wrapper',
        url: 'https://fdw.dev/catalog/hubspot',
      },
      {
        title: 'Notion Foreign Data Wrapper',
        url: 'https://fdw.dev/catalog/notion',
      },
      {
        title: 'SQL Editor in Dashboard',
        url: 'https://github.com/orgs/supabase/discussions/33835',
      },
    ],
  },
  {
    name: 'March 2025',
    isLaunchWeek: true,
    announcements: [
      {
        title: 'Supabase MCP Server',
        url: 'https://supabase.com/blog/mcp-server',
      },
      {
        title: 'Supabase UI Library',
        url: 'https://supabase.com/blog/supabase-ui-library',
      },
      {
        title: 'Supabase Studio Improvements',
        url: 'https://supabase.com/blog/tabs-dashboard-updates',
      },
      {
        title: 'Edge Functions Deploy from the Supabase Dashboard',
        url: 'https://supabase.com/blog/supabase-edge-functions-deploy-dashboard-deno-2-1',
      },
      {
        title: 'Realtime Broadcast from Database',
        url: 'https://supabase.com/blog/realtime-broadcast-from-database',
      },
      {
        title: 'Declarative Schemas',
        url: 'https://supabase.com/blog/declarative-schemas',
      },
      {
        title: 'Postgres Language Server',
        url: 'https://supabase.com/blog/postgres-language-server',
      },
      {
        title: 'Clerk Support in Third-Party Auth',
        url: 'https://supabase.com/blog/clerk-tpa-pricing',
      },
      {
        title: 'Dedicated Poolers',
        url: 'https://supabase.com/blog/dedicated-poolers',
      },
    ],
  },
  {
    name: 'April 2025',
    announcements: [
      {
        title: 'Project scoped roles',
        url: 'https://github.com/orgs/supabase/discussions/35172',
      },
      {
        title: 'MCP Server now works with VS Code',
        url: 'https://x.com/kiwicopple/status/1911945478629179504',
      },
      {
        title: 'MCP Server can now create and deploy Edge Functions',
        url: 'https://x.com/dshukertjr/status/1917927485024449006',
      },
      {
        title: 'Supabase UI Library now includes Infinite Query block',
        url: 'https://supabase.com/ui/docs/infinite-query-hook',
      },
      {
        title: 'Supabase UI Library now includes Social Auth',
        url: 'https://supabase.com/ui/docs/nextjs/social-auth',
      },
      {
        title: 'New SOC2 Report',
        url: 'https://supabase.com/features/soc-2-compliance',
      },
    ],
  },
  {
    name: 'May 2025',
    announcements: [
      {
        title: 'New Supabase Dashboard homepage',
        url: 'https://x.com/kiwicopple/status/1922625094506967457',
      },
      {
        title: 'Figma Make supports Supabase',
        url: 'https://x.com/figma/status/1920169817807728834',
      },
      {
        title: 'Index Advisor',
        url: 'https://x.com/kiwicopple/status/1924414039700001142',
      },
    ],
  },
  {
    name: 'August 2025',
    isLaunchWeek: true,
    announcements: [
      {
        title: 'New API Keys + JWT Signing Keys',
        url: 'https://supabase.com/blog/jwt-signing-keys',
      },
      {
        title: 'Analytics Buckets with Apache Iceberg Support',
        url: 'https://supabase.com/blog/analytics-buckets',
      },
      {
        title: 'New Observability Features in Supabase',
        url: 'https://supabase.com/blog/new-observability-features-in-supabase',
      },
      {
        title: 'Build with Figma Make and Supabase',
        url: 'https://supabase.com/blog/figma-make-support-for-supabase',
      },
      {
        title: '10X Larger Supabase Storage Uploads, 3X Cheaper Egress',
        url: 'https://supabase.com/blog/storage-500gb-uploads-cheaper-egress-pricing',
      },
      {
        title: 'Edge Functions: Persistent Storage and 97% Faster Boot Times',
        url: 'https://supabase.com/blog/persistent-storage-for-faster-edge-functions',
      },
      {
        title: 'Improved Security Controls and a New Home for Security',
        url: 'https://supabase.com/blog/improved-security-controls',
      },
      {
        title: 'Branching 2.0: GitHub Optional',
        url: 'https://supabase.com/blog/branching-2-0',
      },
      {
        title: 'Supabase UI: Platform Kit',
        url: 'https://supabase.com/blog/supabase-ui-platform-kit',
      },
      {
        title: 'Stripe-To-Postgres Sync Engine as an NPM Package',
        url: 'https://supabase.com/blog/stripe-engine-as-sync-library',
      },
      {
        title: 'Algolia Connector for Supabase',
        url: 'https://supabase.com/blog/algolia-connector-for-supabase',
      },
      {
        title: 'MCP Server Can Query Docs',
        url: 'https://supabase.com/docs/guides/getting-started/mcp',
      },
      {
        title: 'Iceberg Foreign Data Wrapper',
        url: 'https://supabase.com/docs/guides/database/extensions/wrappers/iceberg',
      },
      {
        title: 'DuckDB Foreign Data Wrapper',
        url: 'https://supabase.com/docs/guides/database/extensions/wrappers/duckdb',
      },
    ],
  },
  {
    name: 'September 2025',
    announcements: [
      {
        title: '3X Cheaper Egress for Cache Hits',
        url: 'https://github.com/orgs/supabase/discussions/38119',
      },
      {
        title: 'Expiring personal access tokens',
        url: 'https://supabase.com/dashboard/account/tokens', // Direct dashboard link (intentional)
      },
      {
        title: 'Self-service SSO for Teams + Enterprise',
        url: 'https://supabase.com/docs/guides/platform/sso',
      },
      {
        title: 'Deno 2.1 in All Regions',
        url: 'https://github.com/orgs/supabase/discussions/37941',
      },
    ],
  },
  {
    name: 'October 2025',
    announcements: [
      {
        title: 'Supabase Remote MCP Server',
        url: 'https://supabase.com/blog/remote-mcp-server',
      },
      {
        title: 'Login with Solana and Ethereum',
        url: 'https://supabase.com/blog/login-with-solana-ethereum',
      },
      {
        title: 'Supabase Javascript Library MonoRepo',
        url: 'https://github.com/orgs/supabase/discussions/39197',
      },
    ],
  },
  {
    name: 'November 2025',
    announcements: [
      {
        title: 'Realtime Replay, available in alpha',
        url: 'https://supabase.com/blog/realtime-broadcast-replay',
      },
      {
        title: 'Log Drains in Self-Hosted Supabase',
        url: 'https://supabase.com/docs/guides/telemetry/log-drains',
      },
    ],
  },
  {
    name: 'December 2025',
    isLaunchWeek: true,
    announcements: [
      {
        title: 'Supabase ETL',
        url: 'https://supabase.com/blog/introducing-supabase-etl',
      },
      {
        title: 'Analytics Buckets',
        url: 'https://supabase.com/blog/introducing-analytics-buckets',
      },
      {
        title: 'Vector Buckets',
        url: 'https://supabase.com/blog/vector-buckets',
      },
      {
        title: 'iceberg-js',
        url: 'https://supabase.com/blog/introducing-iceberg-js',
      },
      {
        title: 'Supabase for Platforms',
        url: 'https://supabase.com/blog/introducing-supabase-for-platforms',
      },
      {
        title: 'New Auth Templates',
        url: 'https://supabase.com/docs/guides/auth/auth-email-templates',
      },
      {
        title: 'Sign in with Your App',
        url: 'https://www.supabase.com/blog/oauth2-provider',
      },
      {
        title: 'Supabase power for Amazon Kiro',
        url: 'https://supabase.com/blog/supabase-power-for-kiro',
      },
      {
        title: 'Supabase in the AWS Marketplace',
        url: 'https://www.linkedin.com/posts/paulcopplestone_you-can-now-purchase-supabase-through-the-activity-7392589414666792960-PAvn',
      },
      {
        title: 'Async Streaming to Postgres FDWs',
        url: 'https://www.supabase.com/blog/adding-async-streaming-to-pg-fdw',
      },
      {
        title: 'Supabase Metrics API',
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
