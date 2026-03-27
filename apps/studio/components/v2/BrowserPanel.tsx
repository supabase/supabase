'use client'

import { ChevronRight, PanelLeftClose, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { useV2DataCounts } from './useV2DataCounts'
import { useV2Params } from '@/app/v2/V2ParamsContext'
import { useV2DashboardStore } from '@/stores/v2-dashboard'

const DATA_GROUPS = [
  {
    id: 'data-database',
    label: 'Database',
    items: [
      { href: 'tables', label: 'Tables', countKey: 'tables' },
      { href: 'functions', label: 'Functions', countKey: 'functions' },
      { href: 'triggers', label: 'Triggers', countKey: 'triggers' },
      { href: 'types', label: 'Enumerated types', countKey: 'types' },
      { href: 'roles', label: 'Roles', countKey: 'roles' },
      { href: 'extensions', label: 'Extensions', countKey: 'extensions' },
      { href: 'indexes', label: 'Indexes', countKey: 'indexes' },
      { href: 'publications', label: 'Publications', countKey: 'publications' },
      { href: 'integrations', label: 'Integrations', countKey: 'integrations' },
    ],
  },
  {
    id: 'data-auth',
    label: 'Auth',
    items: [
      { href: 'users', label: 'Users', countKey: 'users' },
      { href: 'providers', label: 'Providers', countKey: 'providers' },
      { href: 'oauth-apps', label: 'OAuth apps', countKey: 'oauthApps' },
    ],
  },
  {
    id: 'data-storage',
    label: 'Storage',
    items: [{ href: 'buckets', label: 'Buckets', countKey: 'buckets' }],
  },
  {
    id: 'data-edge-functions',
    label: 'Edge functions',
    items: [{ href: 'edge-functions', label: 'Functions', countKey: 'edgeFunctions' }],
  },
  {
    id: 'data-realtime',
    label: 'Realtime',
    items: [{ href: 'channels', label: 'Channels', countKey: 'channels' }],
  },
]

const OBS_GROUPS = [
  {
    id: 'obs-alerts',
    label: 'Advisors',
    items: [
      { href: 'advisors/security', label: 'Security' },
      { href: 'advisors/performance', label: 'Performance' },
    ],
  },
  {
    id: 'obs-metrics',
    label: 'Observability',
    items: [
      { href: 'metrics/api-overview', label: 'API gateway' },
      { href: 'metrics/query-performance', label: 'Query Performance' },
      { href: 'metrics/database', label: 'Database' },
      { href: 'metrics/postgrest', label: 'Data API' },
      { href: 'metrics/auth', label: 'Auth' },
      { href: 'metrics/edge-functions', label: 'Edge Functions' },
      { href: 'metrics/storage', label: 'Storage' },
      { href: 'metrics/realtime', label: 'Realtime' },
    ],
  },
  {
    id: 'obs-logs',
    label: 'Logs',
    items: [
      { href: 'logs/api', label: 'API gateway' },
      { href: 'logs/postgres', label: 'Postgres' },
      { href: 'logs/postgrest', label: 'PostgREST' },
      { href: 'logs/pooler', label: 'Pooler' },
      { href: 'logs/dedicated-pooler', label: 'Dedicated Pooler' },
      { href: 'logs/auth', label: 'Auth' },
      { href: 'logs/storage', label: 'Storage' },
      { href: 'logs/realtime', label: 'Realtime' },
      { href: 'logs/edge-functions', label: 'Edge Functions' },
      { href: 'logs/cron', label: 'Cron' },
    ],
  },
]

const SETTINGS_GROUPS = [
  {
    id: 'settings-project',
    label: 'Project',
    items: [
      { href: 'general', label: 'General' },
      { href: 'compute', label: 'Compute & disk' },
      { href: 'network', label: 'Network' },
      { href: 'backups', label: 'Backups' },
      { href: 'api-keys', label: 'API keys' },
      { href: 'preferences', label: 'Preferences' },
    ],
  },
  {
    id: 'settings-branches',
    label: 'Branches',
    items: [
      { href: 'branches', label: 'Branches' },
      { href: 'merge-requests', label: 'Merge requests' },
    ],
  },
  {
    id: 'settings-modules',
    label: 'Modules',
    items: [
      { href: 'auth', label: 'Auth' },
      { href: 'storage', label: 'Storage' },
      { href: 'functions', label: 'Functions' },
      { href: 'realtime', label: 'Realtime' },
    ],
  },
]

function getCount(counts: ReturnType<typeof useV2DataCounts>, key: string): number | string {
  switch (key) {
    case 'tables':
      return counts.tables
    case 'functions':
      return counts.functions
    case 'triggers':
      return counts.triggers
    case 'types':
      return counts.types
    case 'roles':
      return counts.roles
    case 'extensions':
      return counts.extensions
    case 'indexes':
      return counts.indexes
    case 'publications':
      return counts.publications
    case 'users':
      return counts.users
    case 'providers':
      return counts.providers
    case 'oauthApps':
      return counts.oauthApps
    case 'channels':
      return counts.channels
    case 'buckets':
      return counts.buckets
    case 'edgeFunctions':
      return counts.edgeFunctions
    case 'integrations':
      return counts.integrations
    default:
      return 0
  }
}

export function BrowserPanel({ onCollapse }: { onCollapse?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const { projectRef } = useV2Params()
  const { expandedGroups, setExpandedGroup } = useV2DashboardStore()
  const counts = useV2DataCounts(projectRef)

  const base = projectRef ? `/v2/project/${projectRef}` : ''
  const isData = Boolean(pathname?.includes('/data/') || pathname?.endsWith('/data'))
  const isObs = pathname?.includes('/obs/')
  const isSettings = pathname?.includes('/settings/')

  const title = isData ? 'Data' : isObs ? 'Observe' : isSettings ? 'Settings' : ''

  const groups = isData ? DATA_GROUPS : isObs ? OBS_GROUPS : isSettings ? SETTINGS_GROUPS : []
  const addButtonHref = `${base}/data`

  return (
    <div className="w-full h-full flex flex-col border-r border-border bg-dash-sidebar">
      <div className="flex items-center justify-between pl-3 pr-2 py-1 border-b border-border shrink-0">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <div className="flex items-center gap-1">
          {onCollapse && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onCollapse}
                  className="flex items-center justify-center w-6 h-6 rounded text-foreground-lighter hover:text-foreground hover:bg-sidebar-accent"
                  aria-label="Collapse panel"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Collapse panel
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto py-1">
        {groups.map((group) => {
          const isExpanded = expandedGroups[group.id] !== false
          const renderedItems = group.items.map((item) => {
            const itemHref = isData
              ? `${base}/data/${item.href}`
              : isObs
                ? `${base}/obs/${item.href}`
                : `${base}/settings/${item.href}`
            const isActive = pathname === itemHref || pathname?.startsWith(itemHref + '/')
            return (
              <Link
                key={`${group.id}-${item.label}-${item.href}`}
                href={itemHref}
                className={cn(
                  'flex items-center justify-between pl-8 pr-4 py-1 text-xs',
                  isActive
                    ? 'bg-sidebar-accent text-foreground font-medium'
                    : 'text-foreground-light hover:text-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <span className="truncate">{item.label}</span>
                {'countKey' in item && (
                  <span className="text-xs text-foreground-muted shrink-0">
                    {getCount(counts, String(item.countKey))}
                  </span>
                )}
              </Link>
            )
          })

          return (
            <Collapsible_Shadcn_
              key={group.id}
              open={isExpanded}
              onOpenChange={(open) => setExpandedGroup(group.id, open)}
              className="py-0.5"
            >
              <CollapsibleTrigger_Shadcn_ asChild>
                <button
                  type="button"
                  className="group/browser-panel-collapsible flex items-center justify-between w-full px-3 py-1.5 text-left font-mono uppercase text-xs text-foreground-lighter hover:text-foreground-light hover:bg-sidebar-accent gap-2"
                >
                  <span className="truncate">{group.label}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform text-foreground-muted group-hover/browser-panel-collapsible:text-foreground-light',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  </span>
                </button>
              </CollapsibleTrigger_Shadcn_>
              <CollapsibleContent_Shadcn_>{renderedItems}</CollapsibleContent_Shadcn_>
            </Collapsible_Shadcn_>
          )
        })}
      </div>
      <div className="px-3 py-2 border-t">
        {isData && (
          <Button
            type="default"
            size="tiny"
            block
            onClick={() => router.push(addButtonHref)}
            className=""
            icon={<Plus className="h-3 w-3" strokeWidth={1.5} />}
          >
            Add module
          </Button>
        )}
      </div>
    </div>
  )
}
