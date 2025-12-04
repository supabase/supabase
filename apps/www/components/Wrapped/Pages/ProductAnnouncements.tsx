'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { AnimatedGridBackground } from '../AnimatedGridBackground'
import { cn } from 'ui'

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
        title: 'Broadcast Replay GA',
        url: 'https://supabase.com/docs/guides/realtime/broadcast#broadcast-replay',
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
    announcements: [
      { title: 'Supabase ETL (private alpha)', url: 'https://supabase.com/blog' },
      { title: 'Analytics Buckets (public alpha)', url: 'https://supabase.com/blog' },
      { title: 'Vector Buckets (public alpha)', url: 'https://supabase.com/blog' },
      { title: 'New Auth Templates', url: 'https://supabase.com/blog' },
      { title: 'Supabase OAuth Server', url: 'https://supabase.com/blog' },
      { title: 'Supabase in AWS Marketplace', url: 'https://supabase.com/blog' },
      { title: 'NodeJS Edge Functions support', url: 'https://supabase.com/blog' },
      { title: 'Edge Functions download without Docker', url: 'https://supabase.com/blog' },
    ],
  },
]

function MonthAccordion({
  month,
  isOpen,
  onToggle,
}: {
  month: Month
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-75 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-medium">{month.name}</span>
          {month.isLaunchWeek && (
            <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">
              Launch Week
            </span>
          )}
          <span className="text-sm text-foreground-muted">
            {month.announcements.length} announcements
          </span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-foreground-muted" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <ul className="px-6 pb-4 space-y-2">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const ProductAnnouncements = () => {
  const [openMonth, setOpenMonth] = useState<string | null>('December 2025')

  const handleToggle = (monthName: string) => {
    setOpenMonth(openMonth === monthName ? null : monthName)
  }

  return (
    <>
      <section className="relative max-w-[60rem] h-[420px] mx-auto border-x border-b">
        {/* Grid background */}
        <AnimatedGridBackground
          cols={5}
          rows={3}
          tiles={[
            { cell: 1, type: 'stripes' },
            { cell: 4, type: 'dots' },
            { cell: 6, type: 'dots' },
            { cell: 9, type: 'stripes' },
          ]}
          initialDelay={0.35}
        />

        {/* Content */}
        <div className="flex flex-col justify-end h-full px-8 py-0 relative">
          <h1 className="font-bold tracking-tight text-[5.6rem]">
            Launch <span className="line-through text-foreground-muted">Week</span> Year
          </h1>
        </div>
      </section>

      <div className="relative max-w-[60rem] mx-auto border-x border-b px-8 py-12">
        <h2 className="text-2xl">Product Announcements</h2>
        <p className="text-base text-foreground-lighter mt-4">
          Everything we shipped in 2025. Click on a month to explore.
        </p>
      </div>

      {/* Months accordion - 2 columns */}
      <div className="relative max-w-[60rem] mx-auto border-x border-b">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {months.map((month, index) => (
            <div
              key={month.name}
              className={cn(
                'border-b border-muted lg:border-r',
                'lg:[&:nth-child(2n)]:border-r-0',
                index >= months.length - 2 && 'lg:border-b-0',
                index === months.length - 1 && 'border-b-0'
              )}
            >
              <MonthAccordion
                month={month}
                isOpen={openMonth === month.name}
                onToggle={() => handleToggle(month.name)}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
