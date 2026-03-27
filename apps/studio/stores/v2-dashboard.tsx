'use client'

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react'

export type RightPanelType = 'chat' | 'sql' | 'adv' | null
export type DataTabDomain = 'db' | 'auth' | 'st' | 'fn' | 'rt'
export type DataTabType = 'list' | 'detail'

export interface DataTab {
  id: string
  label: string
  type: DataTabType
  category: string
  domain: DataTabDomain
  path: string
}

export interface RecentItem {
  id: string
  label: string
  path: string
  category: string
  domain: DataTabDomain
  timestamp: number
}

// Exported so components can reference canonical mappings
export const CATEGORY_DOMAIN: Record<string, DataTabDomain> = {
  tables: 'db',
  functions: 'db',
  triggers: 'db',
  types: 'db',
  roles: 'db',
  extensions: 'db',
  indexes: 'db',
  publications: 'db',
  users: 'auth',
  providers: 'auth',
  'oauth-apps': 'auth',
  buckets: 'st',
  'edge-functions': 'fn',
  channels: 'rt',
  integrations: 'db',
}

export const CATEGORY_LABELS: Record<string, string> = {
  tables: 'Tables',
  functions: 'Functions',
  triggers: 'Triggers',
  types: 'Enumerated types',
  roles: 'Roles',
  extensions: 'Extensions',
  indexes: 'Indexes',
  publications: 'Publications',
  users: 'Users',
  providers: 'Providers',
  'oauth-apps': 'OAuth apps',
  buckets: 'Buckets',
  'edge-functions': 'Edge functions',
  channels: 'Channels',
  integrations: 'Integrations',
}

/** Legacy global keys (pre–per-project persistence); read once for migration. */
const LEGACY_RECENT_ITEMS_STORAGE_KEY = 'v2-recent-items'
const LEGACY_DATA_TABS_STORAGE_KEY = 'v2-data-tabs'

const INSIGHT_EXPANDED_STORAGE_KEY = 'v2-insight-expanded'

function projectStorageKey(projectRef: string, suffix: string) {
  return `v2-${projectRef}-${suffix}`
}

function parseRecentItems(raw: string): RecentItem[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const normalized = parsed
      .filter((x) => x && typeof x === 'object')
      .map((x) => x as Partial<RecentItem>)
      .filter(
        (x) =>
          typeof x.id === 'string' && typeof x.label === 'string' && typeof x.path === 'string'
      )
      .map((x) => ({
        id: x.id as string,
        label: x.label as string,
        path: x.path as string,
        category: typeof x.category === 'string' ? x.category : 'tables',
        domain: (typeof x.domain === 'string' ? x.domain : 'db') as DataTabDomain,
        timestamp: typeof x.timestamp === 'number' ? x.timestamp : 0,
      }))
    return normalized.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)
  } catch {
    return null
  }
}

function parseDataTabs(raw: string): DataTab[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const normalized = parsed
      .filter((x) => x && typeof x === 'object')
      .map((x) => x as Partial<DataTab>)
      .filter(
        (x) =>
          typeof x.id === 'string' &&
          typeof x.label === 'string' &&
          typeof x.type === 'string' &&
          typeof x.category === 'string' &&
          typeof x.domain === 'string' &&
          typeof x.path === 'string'
      )
      .map((x) => ({
        id: x.id as string,
        label: x.label as string,
        type: x.type as DataTabType,
        category: x.category as string,
        domain: x.domain as DataTabDomain,
        path: x.path as string,
      }))
    return normalized
  } catch {
    return null
  }
}

function filterByProjectPath<T extends { path: string }>(items: T[], projectRef: string): T[] {
  const prefix = `/v2/project/${projectRef}/`
  return items.filter((x) => x.path.startsWith(prefix))
}

const defaultExpandedGroups: Record<string, boolean> = {
  'obs-logs': true,
  'obs-metrics': true,
  'obs-alerts': true,
  'settings-project': true,
  'settings-branches': true,
  'settings-modules': true,
  'settings-org': true,
}

interface V2DashboardState {
  // Flat data tabs (Figma model)
  dataTabs: DataTab[]
  expandedGroups: Record<string, boolean>
  rightPanel: RightPanelType
  recentItems: RecentItem[]
  insightExpanded: Record<string, boolean>

  openDataTab: (tab: DataTab) => void
  closeDataTab: (id: string) => void
  reorderDataTabs: (activeId: string, overId: string) => void
  replaceDataTabs: (tabs: DataTab[]) => void
  addRecentItem: (item: Omit<RecentItem, 'timestamp'>) => void
  toggleGroup: (groupId: string) => void
  setExpandedGroup: (groupId: string, expanded: boolean) => void
  toggleRightPanel: (panel: 'chat' | 'sql' | 'adv') => void
  closeRightPanel: () => void
  toggleInsight: (tabId: string) => void
  setInsightExpanded: (tabId: string, expanded: boolean) => void
}

const V2DashboardContext = createContext<V2DashboardState | null>(null)

export function V2DashboardProvider({
  children,
  projectRef,
}: {
  children: ReactNode
  /** When absent, open tabs and recents stay in memory only (not persisted). */
  projectRef: string | null
}) {
  const [dataTabs, setDataTabs] = useState<DataTab[]>([])
  const [expandedGroups, setExpandedGroups] =
    useState<Record<string, boolean>>(defaultExpandedGroups)
  const [rightPanel, setRightPanel] = useState<RightPanelType>(null)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [insightExpanded, setInsightExpandedState] = useState<Record<string, boolean>>({})

  // Load project-scoped recents + data tabs before paint so project switches never write the wrong key.
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    if (!projectRef) {
      setDataTabs([])
      setRecentItems([])
      return
    }

    const recentsKey = projectStorageKey(projectRef, 'recent-items')
    const tabsKey = projectStorageKey(projectRef, 'data-tabs')

    try {
      let recentsRaw = localStorage.getItem(recentsKey)
      if (!recentsRaw) {
        const legacy = localStorage.getItem(LEGACY_RECENT_ITEMS_STORAGE_KEY)
        if (legacy) {
          const all = parseRecentItems(legacy)
          if (all && all.length > 0) {
            const scoped = filterByProjectPath(all, projectRef)
            if (scoped.length > 0) {
              recentsRaw = JSON.stringify(scoped)
              localStorage.setItem(recentsKey, recentsRaw)
            }
          }
        }
      }
      if (recentsRaw) {
        const parsed = parseRecentItems(recentsRaw)
        if (parsed) setRecentItems(parsed)
        else setRecentItems([])
      } else {
        setRecentItems([])
      }
    } catch {
      setRecentItems([])
    }

    try {
      let tabsRaw = localStorage.getItem(tabsKey)
      if (!tabsRaw) {
        const legacy = localStorage.getItem(LEGACY_DATA_TABS_STORAGE_KEY)
        if (legacy) {
          const all = parseDataTabs(legacy)
          if (all && all.length > 0) {
            const scoped = filterByProjectPath(all, projectRef)
            if (scoped.length > 0) {
              tabsRaw = JSON.stringify(scoped)
              localStorage.setItem(tabsKey, tabsRaw)
            }
          }
        }
      }
      if (tabsRaw) {
        const parsed = parseDataTabs(tabsRaw)
        if (parsed) setDataTabs(parsed)
        else setDataTabs([])
      } else {
        setDataTabs([])
      }
    } catch {
      setDataTabs([])
    }
  }, [projectRef])

  // Load persisted insight expand state from localStorage once (user-global)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(INSIGHT_EXPANDED_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as unknown
      if (!parsed || typeof parsed !== 'object') return
      setInsightExpandedState(parsed as Record<string, boolean>)
    } catch {
      // Ignore corrupted localStorage
    }
  }, [])

  // Persist recents to localStorage on change (per project)
  useEffect(() => {
    if (typeof window === 'undefined' || !projectRef) return
    try {
      localStorage.setItem(
        projectStorageKey(projectRef, 'recent-items'),
        JSON.stringify(recentItems)
      )
    } catch {
      // Ignore write failures
    }
  }, [projectRef, recentItems])

  // Persist open data tabs to localStorage on change (per project)
  useEffect(() => {
    if (typeof window === 'undefined' || !projectRef) return
    try {
      localStorage.setItem(projectStorageKey(projectRef, 'data-tabs'), JSON.stringify(dataTabs))
    } catch {
      // Ignore write failures
    }
  }, [projectRef, dataTabs])

  // Persist insight expand state to localStorage on change
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(INSIGHT_EXPANDED_STORAGE_KEY, JSON.stringify(insightExpanded))
    } catch {
      // Ignore write failures
    }
  }, [insightExpanded])

  const addRecentItem = useCallback((item: Omit<RecentItem, 'timestamp'>) => {
    setRecentItems((prev) => {
      const without = prev.filter((x) => x.id !== item.id)
      return [{ ...item, timestamp: Date.now() }, ...without].slice(0, 20)
    })
  }, [])

  const openDataTab = useCallback(
    (tab: DataTab) => {
      setDataTabs((prev) => {
        if (prev.some((t) => t.id === tab.id)) return prev
        return [...prev, tab]
      })
      // Add to recents for detail tabs only
      if (tab.type === 'detail') {
        addRecentItem({
          id: tab.id,
          label: tab.label,
          path: tab.path,
          category: tab.category,
          domain: tab.domain,
        })
      }
    },
    [addRecentItem]
  )

  const closeDataTab = useCallback((id: string) => {
    setDataTabs((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const reorderDataTabs = useCallback((activeId: string, overId: string) => {
    setDataTabs((prev) => {
      if (activeId === overId) return prev
      const oldIndex = prev.findIndex((t) => t.id === activeId)
      const newIndex = prev.findIndex((t) => t.id === overId)
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return prev

      const next = [...prev]
      const [moved] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, moved)
      return next
    })
  }, [])

  const replaceDataTabs = useCallback((tabs: DataTab[]) => {
    setDataTabs(tabs)
  }, [])

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((state) => ({ ...state, [groupId]: !state[groupId] }))
  }, [])

  const setExpandedGroup = useCallback((groupId: string, expanded: boolean) => {
    setExpandedGroups((state) => ({ ...state, [groupId]: expanded }))
  }, [])

  const toggleRightPanel = useCallback((panel: 'chat' | 'sql' | 'adv') => {
    setRightPanel((current) => (current === panel ? null : panel))
  }, [])

  const closeRightPanel = useCallback(() => setRightPanel(null), [])

  const toggleInsight = useCallback((tabId: string) => {
    setInsightExpandedState((state) => ({ ...state, [tabId]: !state[tabId] }))
  }, [])

  const setInsightExpanded = useCallback((tabId: string, expanded: boolean) => {
    setInsightExpandedState((state) => ({ ...state, [tabId]: expanded }))
  }, [])

  const value = useMemo<V2DashboardState>(
    () => ({
      dataTabs,
      expandedGroups,
      rightPanel,
      recentItems,
      insightExpanded,
      openDataTab,
      closeDataTab,
      reorderDataTabs,
      replaceDataTabs,
      addRecentItem,
      toggleGroup,
      setExpandedGroup,
      toggleRightPanel,
      closeRightPanel,
      toggleInsight,
      setInsightExpanded,
    }),
    [
      dataTabs,
      expandedGroups,
      rightPanel,
      recentItems,
      insightExpanded,
      openDataTab,
      closeDataTab,
      reorderDataTabs,
      replaceDataTabs,
      addRecentItem,
      toggleGroup,
      setExpandedGroup,
      toggleRightPanel,
      closeRightPanel,
      toggleInsight,
      setInsightExpanded,
    ]
  )

  return <V2DashboardContext.Provider value={value}>{children}</V2DashboardContext.Provider>
}

export function useV2DashboardStore(): V2DashboardState
export function useV2DashboardStore<T>(selector: (s: V2DashboardState) => T): T
export function useV2DashboardStore<T>(selector?: (s: V2DashboardState) => T) {
  const ctx = useContext(V2DashboardContext)
  if (!ctx) throw new Error('useV2DashboardStore must be used within V2DashboardProvider')
  if (selector) return selector(ctx)
  return ctx
}
