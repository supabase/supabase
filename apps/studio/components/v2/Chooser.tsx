'use client'

import { EdgeFunctions, Realtime } from 'icons'
import {
  Box,
  Database,
  Fingerprint,
  FunctionSquare,
  Globe,
  HardDrive,
  Plug,
  KeyRound,
  Layers,
  ShieldCheck,
  Table2,
  Users,
  Zap,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from 'ui/src/components/shadcn/ui/input'

import { TypeBadge } from './TypeBadge'
import { useV2DataCounts } from './useV2DataCounts'
import { useV2Params } from '@/app/v2/V2ParamsContext'
import {
  CATEGORY_DOMAIN,
  CATEGORY_LABELS,
  useV2DashboardStore,
  type RecentItem,
} from '@/stores/v2-dashboard'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  tables: <Table2 className="size-3" strokeWidth={1.5} />,
  functions: <FunctionSquare className="size-3" strokeWidth={1.5} />,
  triggers: <Zap className="size-3" strokeWidth={1.5} />,
  types: <Layers className="size-3" strokeWidth={1.5} />,
  roles: <ShieldCheck className="size-3" strokeWidth={1.5} />,
  extensions: <Box className="size-3" strokeWidth={1.5} />,
  indexes: <Database className="size-3" strokeWidth={1.5} />,
  publications: <Globe className="size-3" strokeWidth={1.5} />,
  users: <Users className="size-3" strokeWidth={1.5} />,
  providers: <Fingerprint className="size-3" strokeWidth={1.5} />,
  'oauth-apps': <KeyRound className="size-3" strokeWidth={1.5} />,
  buckets: <HardDrive className="size-3" strokeWidth={1.5} />,
  'edge-functions': <EdgeFunctions className="size-3" strokeWidth={1.5} />,
  channels: <Realtime className="size-3" strokeWidth={1.5} />,
  integrations: <Plug className="size-3" strokeWidth={1.5} />,
}

const CATEGORY_GROUPS: Array<{ label: string; categories: string[] }> = [
  {
    label: 'Database',
    categories: [
      'tables',
      'functions',
      'triggers',
      'types',
      'roles',
      'extensions',
      'indexes',
      'publications',
    ],
  },
  {
    label: 'Integrations',
    categories: ['integrations'],
  },
  {
    label: 'Auth',
    categories: ['users', 'providers', 'oauth-apps'],
  },
  {
    label: 'Storage',
    categories: ['buckets'],
  },
  {
    label: 'Compute',
    categories: ['edge-functions', 'channels'],
  },
]

const COUNT_KEY_MAP: Record<string, keyof ReturnType<typeof useV2DataCounts>> = {
  tables: 'tables',
  functions: 'functions',
  triggers: 'triggers',
  types: 'types',
  roles: 'roles',
  extensions: 'extensions',
  publications: 'publications',
  users: 'users',
  buckets: 'buckets',
  'edge-functions': 'edgeFunctions',
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function Chooser() {
  const router = useRouter()
  const { projectRef } = useV2Params()
  const { openDataTab, recentItems } = useV2DashboardStore()
  const counts = useV2DataCounts(projectRef)
  const [search, setSearch] = useState('')
  const lowerSearch = search.toLowerCase()

  const base = projectRef ? `/v2/project/${projectRef}` : ''

  const openCategory = (category: string) => {
    const domain = CATEGORY_DOMAIN[category] ?? 'db'
    const path = `${base}/data/${category}`
    openDataTab({
      id: category,
      label: CATEGORY_LABELS[category] ?? category,
      type: 'list',
      category,
      domain,
      path,
    })
    router.push(path)
  }

  const openRecent = (item: RecentItem) => {
    openDataTab({
      id: item.id,
      label: item.label,
      type: 'detail',
      category: item.category,
      domain: item.domain,
      path: item.path,
    })
    router.push(item.path)
  }

  const filteredGroups = CATEGORY_GROUPS.map((group) => ({
    ...group,
    categories: group.categories.filter((c) => {
      if (!lowerSearch) return true
      return (
        c.toLowerCase().includes(lowerSearch) ||
        (CATEGORY_LABELS[c] ?? c).toLowerCase().includes(lowerSearch)
      )
    }),
  })).filter((g) => g.categories.length > 0)

  const filteredRecents = recentItems.filter(
    (r) =>
      !lowerSearch ||
      r.label.toLowerCase().includes(lowerSearch) ||
      r.category.toLowerCase().includes(lowerSearch)
  )

  return (
    <div className="flex flex-col gap-4 p-6 max-w-3xl mx-auto w-full">
      {/* Search */}
      <div>
        <Input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tables, users, buckets, functions…"
          className="w-full"
        />
      </div>

      {/* Category groups */}
      {filteredGroups.map((group) => (
        <div key={group.label}>
          <h3 className="text-xs text-foreground-lighter uppercase tracking-wider mb-2">
            {group.label}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {group.categories.map((cat) => {
              const label = CATEGORY_LABELS[cat] ?? cat
              const countKey = COUNT_KEY_MAP[cat]
              const count = countKey != null ? counts[countKey] : undefined
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => openCategory(cat)}
                  className="flex flex-col items-start gap-1 rounded-md border border-border p-3 text-left bg-surface-100 hover:bg-sidebar-accent/50 hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-foreground-lighter">{CATEGORY_ICONS[cat]}</span>
                    <span className="text-sm text-foreground-light truncate">{label}</span>
                  </div>
                  <div>
                    <span className="text-foreground-lighter font-mono text-base leading-none">
                      {count}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Recents */}
      {filteredRecents.length > 0 && (
        <div>
          <h3 className="text-xs text-foreground-lighter uppercase tracking-wider mb-3">Recent</h3>
          <div className="flex flex-col divide-y divide-border border border-border rounded-md overflow-hidden">
            {filteredRecents.slice(0, 10).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openRecent(item)}
                className="flex items-center gap-3 px-3 py-2.5 text-left hover:bg-sidebar-accent/50 transition-colors"
              >
                <TypeBadge domain={item.domain} type="detail" />
                <span className="flex-1 min-w-0 truncate text-sm text-foreground-light">
                  {item.label}
                </span>
                <span className="text-xs text-foreground-lighter shrink-0">
                  {timeAgo(item.timestamp)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredGroups.length === 0 && filteredRecents.length === 0 && (
        <p className="text-sm text-foreground-lighter">No results for "{search}"</p>
      )}
    </div>
  )
}
