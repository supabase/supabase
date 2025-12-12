'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatedGridBackground } from '../AnimatedGridBackground'
import { cn } from 'ui'

type TimelineItem = {
  title: string
  description?: string
  url: string
  date: Date
  isLaunchWeek?: boolean
}

const timelineItems: TimelineItem[] = [
  // January 2025
  {
    title: 'Third-party Auth providers are now GA',
    date: new Date('2025-01-08'),
    url: 'https://supabase.link/docs-third-party-auth-ga-jan2025',
  },
  {
    title: 'Easier errors and logs',
    date: new Date('2025-01-15'),
    url: 'https://supabase.link/link-easier-errors-logs-jan2025',
  },
  {
    title: 'Enhanced JSON types',
    date: new Date('2025-01-20'),
    url: 'https://supabase.link/github-enhanced-json-types-jan2025',
  },
  {
    title: 'New Supabase integrations',
    date: new Date('2025-01-24'),
    url: 'https://supabase.link/link-new-supabase-integrations-jan2025',
  },
  {
    title: 'Performance improvements for Storage CDN',
    date: new Date('2025-01-28'),
    url: 'https://supabase.link/link-performance-improvements-storage-cdn-jan2025',
  },
  // February 2025
  {
    title: 'Deploy Edge Functions via GitHub',
    date: new Date('2025-02-05'),
    url: 'https://supabase.link/link-deploy-edge-functions-feb2025-riur',
  },
  {
    title: 'Connect AI agents to Supabase',
    date: new Date('2025-02-12'),
    url: 'https://supabase.link/link-connect-ai-supabase-feb2025-nwod',
  },
  {
    title: 'Enhanced JSON query operators',
    date: new Date('2025-02-18'),
    url: 'https://supabase.link/link-enhanced-json-query-operators-feb2025-d6ho',
  },
  {
    title: 'New community integrations',
    date: new Date('2025-02-25'),
    url: 'https://supabase.link/link-new-community-integrations-feb2025-hrhx',
  },
  // March 2025 - Launch Week
  {
    title: 'Supabase MCP Server',
    date: new Date('2025-03-10'),
    url: 'https://supabase.link/link-supabase-mcp-server-mar2025-67zo',
    isLaunchWeek: true,
  },
  {
    title: 'Supabase UI Library',
    date: new Date('2025-03-11'),
    url: 'https://supabase.link/link-supabase-ui-library-mar2025-sy2o',
    isLaunchWeek: true,
  },
  {
    title: 'Supabase Templates',
    date: new Date('2025-03-12'),
    url: 'https://supabase.link/link-supabase-templates-mar2025-fqbo',
    isLaunchWeek: true,
  },
  {
    title: 'Queue: Postgres-native Job Queue',
    date: new Date('2025-03-13'),
    url: 'https://supabase.link/link-postgres-queue-mar2025-zrz3',
    isLaunchWeek: true,
  },
  {
    title: 'Supabase Logs',
    description: 'Open-Source Logging Infrastructure',
    date: new Date('2025-03-14'),
    url: 'https://supabase.link/link-supabase-logs-mar2025-oeuf',
    isLaunchWeek: true,
  },
  {
    title: 'Anonymous Sign-ins',
    date: new Date('2025-03-15'),
    url: 'https://supabase.link/link-anon-sign-ins-mar2025-g4ms',
    isLaunchWeek: true,
  },
  {
    title: 'Storage: Resumable Uploads',
    date: new Date('2025-03-16'),
    url: 'https://supabase.link/link-storage-resumable-uploads-mar2025-f3ds',
    isLaunchWeek: true,
  },
  {
    title: 'Custom Access Tokens',
    date: new Date('2025-03-17'),
    url: 'https://supabase.link/link-custom-access-tokens-mar2025-9u9z',
    isLaunchWeek: true,
  },
  {
    title: 'Realtime: Broadcast from Database',
    date: new Date('2025-03-18'),
    url: 'https://supabase.link/link-realtime-broadcast-database-mar2025-6lhq',
    isLaunchWeek: true,
  },
  {
    title: 'Database Webhooks',
    date: new Date('2025-03-19'),
    url: 'https://supabase.link/link-database-webhooks-mar2025-bvj9',
    isLaunchWeek: true,
  },
  {
    title: 'Functions: Background Tasks',
    date: new Date('2025-03-20'),
    url: 'https://supabase.link/link-functions-background-tasks-mar2025-4hf3',
    isLaunchWeek: true,
  },
  {
    title: 'Postgres Language Server',
    date: new Date('2025-03-21'),
    url: 'https://supabase.link/link-postgres-language-server-mar2025-gvt7',
    isLaunchWeek: true,
  },
  // April 2025
  {
    title: 'Project-scoped roles',
    date: new Date('2025-04-08'),
    url: 'https://supabase.link/github-project-scoped-roles-apr2025-k2mz',
  },
  {
    title: 'MCP Server + VSCode setup',
    date: new Date('2025-04-15'),
    url: 'https://supabase.link/twitter-mcp-server-vscode-setup-apr2025-0580',
  },
  {
    title: 'AI Agent integrations',
    date: new Date('2025-04-20'),
    url: 'https://supabase.link/link-ai-agent-integrations-apr2025-8jkl',
  },
  {
    title: 'Database branching improvements',
    date: new Date('2025-04-25'),
    url: 'https://supabase.link/link-database-branching-apr2025-3mnp',
  },
  // May 2025
  {
    title: 'Dashboard visual update',
    date: new Date('2025-05-10'),
    url: 'https://supabase.link/twitter-supabase-dashboard-update-may2025-6btg',
  },
  {
    title: 'Figma + Make + Supabase workflow',
    date: new Date('2025-05-18'),
    url: 'https://supabase.link/twitter-figma-make-supabase-may2025-7kjy',
  },
  {
    title: 'Edge Functions monitoring',
    date: new Date('2025-05-25'),
    url: 'https://supabase.link/link-edge-functions-monitoring-may2025-9qrs',
  },
  // August 2025 - Launch Week
  {
    title: 'JWT Signing Keys',
    date: new Date('2025-08-04'),
    url: 'https://supabase.com/blog/jwt-signing-keys',
    isLaunchWeek: true,
  },
  {
    title: 'Automatic Embeddings',
    date: new Date('2025-08-05'),
    url: 'https://supabase.com/blog/automatic-embeddings',
    isLaunchWeek: true,
  },
  {
    title: 'Storage v4',
    date: new Date('2025-08-06'),
    url: 'https://supabase.com/blog/storage-v4',
    isLaunchWeek: true,
  },
  {
    title: 'Realtime 3.0',
    date: new Date('2025-08-07'),
    url: 'https://supabase.com/blog/realtime-broadcast-authorization',
    isLaunchWeek: true,
  },
  {
    title: 'pg_replicate',
    description: 'Build Postgres Replicas',
    date: new Date('2025-08-08'),
    url: 'https://supabase.com/blog/pg-replicate',
    isLaunchWeek: true,
  },
  {
    title: 'Supavisor 2.0',
    date: new Date('2025-08-09'),
    url: 'https://supabase.com/blog/supavisor-v2',
    isLaunchWeek: true,
  },
  {
    title: 'Edge Functions: Deploy Previews',
    date: new Date('2025-08-10'),
    url: 'https://supabase.com/blog/edge-functions-deploy-previews',
    isLaunchWeek: true,
  },
  {
    title: 'Logs: Sources and Sinks',
    date: new Date('2025-08-11'),
    url: 'https://supabase.com/blog/log-drains',
    isLaunchWeek: true,
  },
  {
    title: 'Database Migration UI',
    date: new Date('2025-08-12'),
    url: 'https://supabase.com/blog/database-migrations-ui',
    isLaunchWeek: true,
  },
  {
    title: 'AI Assistant v2',
    date: new Date('2025-08-13'),
    url: 'https://supabase.com/blog/ai-assistant-v2',
    isLaunchWeek: true,
  },
  {
    title: 'Supabase Studio 2.0',
    date: new Date('2025-08-14'),
    url: 'https://supabase.com/blog/supabase-studio-2',
    isLaunchWeek: true,
  },
  {
    title: 'Auth Helpers Everywhere',
    date: new Date('2025-08-15'),
    url: 'https://supabase.com/blog/auth-helpers-everywhere',
    isLaunchWeek: true,
  },
  // September 2025
  {
    title: 'Broadcast Replay',
    date: new Date('2025-09-10'),
    url: 'https://supabase.com/docs/guides/realtime/broadcast#broadcast-replay',
  },
  {
    title: 'Performance Advisor improvements',
    date: new Date('2025-09-18'),
    url: 'https://github.com/orgs/supabase/discussions/33287',
  },
  {
    title: 'MCP Server updates',
    date: new Date('2025-09-25'),
    url: 'https://supabase.com/docs/guides/ai/mcp',
  },
  // October 2025
  {
    title: 'Supabase Series E announcement',
    date: new Date('2025-10-08'),
    url: 'https://supabase.com/blog/supabase-series-e',
  },
  {
    title: 'Remote MCP Server',
    date: new Date('2025-10-15'),
    url: 'https://supabase.com/blog/remote-mcp-server',
  },
  {
    title: 'Enhanced database observability',
    date: new Date('2025-10-22'),
    url: 'https://supabase.com/docs/guides/platform/metrics',
  },
  // November 2025
  {
    title: 'Broadcast Replay GA',
    date: new Date('2025-11-05'),
    url: 'https://supabase.com/docs/guides/realtime/broadcast#broadcast-replay',
  },
  {
    title: 'Auth email template customization',
    date: new Date('2025-11-15'),
    url: 'https://supabase.com/docs/guides/auth/auth-email-templates',
  },
  {
    title: 'Edge Functions cold start improvements',
    date: new Date('2025-11-25'),
    url: 'https://supabase.com/docs/guides/functions',
  },
  // December 2025
  {
    title: 'Supabase ETL',
    description: 'Private Alpha',
    date: new Date('2025-12-02'),
    url: 'https://supabase.com/blog',
  },
  {
    title: 'Analytics Buckets',
    description: 'Public Alpha',
    date: new Date('2025-12-03'),
    url: 'https://supabase.com/blog',
  },
  {
    title: 'Vector Buckets',
    description: 'Public Alpha',
    date: new Date('2025-12-04'),
    url: 'https://supabase.com/blog',
  },
  {
    title: 'New Auth Templates',
    date: new Date('2025-12-05'),
    url: 'https://supabase.com/blog',
  },
  {
    title: 'Supabase OAuth Server',
    date: new Date('2025-12-06'),
    url: 'https://supabase.com/blog',
  },
  {
    title: 'Supabase in AWS Marketplace',
    date: new Date('2025-12-07'),
    url: 'https://supabase.com/blog',
  },
  {
    title: 'NodeJS Edge Functions support',
    date: new Date('2025-12-08'),
    url: 'https://supabase.com/blog',
  },
  {
    title: 'Edge Functions download without Docker',
    date: new Date('2025-12-09'),
    url: 'https://supabase.com/blog',
  },
]

// Calculate positions with gaps between month groups
const MONTH_GAP_PX = 32
const ITEM_GAP_PX = 8

function calculatePositions() {
  const months: { month: string; startIndex: number; count: number }[] = []
  let currentMonth = -1

  // Group items by month
  timelineItems.forEach((item, index) => {
    const itemMonth = item.date.getMonth()
    if (itemMonth !== currentMonth) {
      currentMonth = itemMonth
      const monthName = item.date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
      months.push({ month: `${monthName} 2025`, startIndex: index, count: 1 })
    } else {
      months[months.length - 1].count++
    }
  })

  // Calculate total width needed
  const totalItemGaps = timelineItems.length - months.length // gaps within months
  const totalMonthGaps = months.length - 1 // gaps between months
  const totalWidthPx = totalItemGaps * ITEM_GAP_PX + totalMonthGaps * MONTH_GAP_PX

  // Calculate positions
  const itemPositions: number[] = []
  const monthPositions: { month: string; position: number }[] = []
  let currentPx = 0

  months.forEach((monthData, monthIndex) => {
    monthPositions.push({
      month: monthData.month,
      position: (currentPx / totalWidthPx) * 100,
    })

    for (let i = 0; i < monthData.count; i++) {
      itemPositions.push((currentPx / totalWidthPx) * 100)
      if (i < monthData.count - 1) {
        currentPx += ITEM_GAP_PX
      }
    }

    if (monthIndex < months.length - 1) {
      currentPx += MONTH_GAP_PX
    }
  })

  return { itemPositions, monthPositions }
}

const { itemPositions, monthPositions } = calculatePositions()

function getPositionPercent(index: number): number {
  return itemPositions[index] ?? 0
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()
}

function TimelinePoint({
  item,
  index,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  item: TimelineItem
  index: number
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  const positionPercent = getPositionPercent(index)

  return (
    <div
      className="absolute"
      style={{ left: `${positionPercent}%` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Hit area + Dot */}
      <Link
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-0 -translate-y-1/2 z-10 p-4 -ml-4"
      >
        <div
          className={cn(
            'w-2 h-2 rounded-full transition-all duration-200',
            isHovered
              ? 'bg-brand ring-2 ring-brand ring-offset-2 ring-offset-background scale-125'
              : item.isLaunchWeek
                ? 'bg-brand/80'
                : 'bg-foreground-muted'
          )}
        />
      </Link>

      {/* Floating content anchored to the dot */}
      {isHovered && (
        <div className="absolute top-4 left-0 w-[280px] pt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-foreground-muted font-mono">{formatDate(item.date)}</span>
            {item.isLaunchWeek && (
              <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                Launch Week
              </span>
            )}
          </div>
          <Link href={item.url} target="_blank" rel="noopener noreferrer" className="group block">
            <h4 className="text-base font-medium group-hover:text-brand transition-colors">
              {item.title}
            </h4>
            {item.description && (
              <p className="text-sm text-foreground-muted mt-1">{item.description}</p>
            )}
          </Link>
        </div>
      )}
    </div>
  )
}

export const AnnouncementsTimeline = () => {
  const [hoveredItem, setHoveredItem] = useState<TimelineItem | null>(null)

  return (
    <>
      <section className="relative max-w-[60rem] h-[240px] md:h-[360px] mx-auto border-x">
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

        <div className="flex flex-col justify-end h-full px-4 lg:px-8 py-0 relative">
          <h2 className="font-medium tracking-tighter text-6xl md:text-7xl lg:text-[5.6rem] translate-y-2 lg:translate-y-[10px]">
            Launch <span className="line-through text-foreground-muted">Week</span> Year
          </h2>
        </div>
      </section>

      <div className="relative max-w-[60rem] mx-auto border-x px-4 lg:px-8 py-12">
        <h3 className="text-lg">Product Announcements — Everything we shipped in 2025.</h3>
      </div>

      {/* Timeline section - breaks out of container */}
      <div className="relative border-y">
        <div
          className="overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="min-w-[1200px] px-16 pt-24 pb-48">
            {/* Month markers */}
            <div className="relative h-6 mb-4">
              {monthPositions.map(({ month, position }) => (
                <div
                  key={month}
                  className="absolute text-xs text-foreground-muted font-mono"
                  style={{ left: `${position}%` }}
                >
                  {month}
                </div>
              ))}
            </div>

            {/* Timeline line with points */}
            <div className="relative h-8">
              {/* Base line */}
              <div className="absolute top-1/2 -left-64 -right-96 h-px bg-border -translate-y-1/2" />

              {/* Month tick marks */}
              {monthPositions.map(({ month, position }) => (
                <div
                  key={`tick-${month}`}
                  className="absolute top-1/2 w-px h-3 bg-border -translate-y-1/2"
                  style={{ left: `${position}%` }}
                />
              ))}

              {/* Points with floating content */}
              {timelineItems.map((item, index) => (
                <TimelinePoint
                  key={`${item.title}-${index}`}
                  item={item}
                  index={index}
                  isHovered={hoveredItem?.title === item.title}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
