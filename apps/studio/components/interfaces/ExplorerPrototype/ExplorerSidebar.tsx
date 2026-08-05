/**
 * PROTOTYPE — the Explorer sidebar, as a drill-down menu.
 *
 * Root level is saved resource types plus a mixed "Recent" group, ordered by
 * last modification. Choosing a type drills into that type's full list, with a
 * search field and a back button. The sidebar never renders a resource — it
 * only opens tabs.
 *
 * The drill-down is deliberately generic: `RESOURCE_SECTIONS` drives both
 * levels, so a fourth resource type is one array entry, not new UI.
 *
 * Levels cross-fade with a small directional nudge (`LEVEL_OFFSET`), not a
 * full-width slide — translating the whole panel reads as a zoom. Because
 * `AnimatePresence` is in `mode="wait"`, the outgoing level finishes before the
 * incoming one mounts, so only one level is ever in the DOM (and therefore in
 * the accessibility tree and tab order).
 */

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button, cn } from 'ui'
import { InnerSideBarFilters, InnerSideBarFilterSearchInput } from 'ui-patterns/InnerSideMenu'

import type {
  ChatSession,
  NotebookContent,
  RecentItem,
  TabResource,
} from './ExplorerPrototype.types'
import { useExplorerPrototype } from './ExplorerPrototypeContext'
import {
  notebookTitle,
  RESOURCE_ICON,
  RESOURCE_SECTIONS,
  type ResourceType,
  type SidebarResourceType,
} from './ExplorerResources'

/** One list entry, uniform across resource types. */
type ResourceEntry = { id: string; title: string }

const formatModifiedAt = (modifiedAt: number) => {
  const minutes = Math.round((Date.now() - modifiedAt) / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

/**
 * Small enough to read as a nudge rather than a slide. Root sits to the left of
 * the drilled level, so each direction keeps its sense: going deeper pushes the
 * root out to the left and brings the list in from the right.
 */
const LEVEL_OFFSET = 8
const LEVEL_TRANSITION = { duration: 0.09, ease: 'easeOut' } as const

/** Matches `InnerSideMenuItem`'s recipe — that component is a Link, and these are buttons. */
const rowClassName = (isActive: boolean) =>
  cn(
    'group relative flex h-7 w-full items-center gap-2 rounded-md pl-3 pr-2 text-sm',
    isActive
      ? 'bg-selection text-foreground'
      : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
  )

interface ExplorerSidebarProps {
  notebooks: Record<string, NotebookContent>
  chats: Record<string, ChatSession>
  recentItems: RecentItem[]
  activeResource?: TabResource
  onOpen: (resource: TabResource, title: string) => void
}

export const ExplorerSidebar = ({
  notebooks,
  chats,
  recentItems,
  activeResource,
  onOpen,
}: ExplorerSidebarProps) => {
  const [drilledType, setDrilledType] = useState<SidebarResourceType | undefined>(undefined)
  // Kept separately from `drilledType` so the level-1 panel still has a type to
  // render from while it animates out, after `drilledType` has been cleared.
  const [panelType, setPanelType] = useState<SidebarResourceType>('notebook')
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const isDrilled = drilledType !== undefined

  // Focus follows the drill-down. An effect rather than the click handler
  // because the input only exists after the level swap commits to the DOM.
  useEffect(() => {
    if (isDrilled) searchRef.current?.focus()
  }, [isDrilled])

  const isActive = (type: ResourceType, id: string) =>
    activeResource?.type === type && activeResource.id === id

  const titleFor = (resource: TabResource): string | undefined => {
    if (resource.type === 'notebook') {
      const notebook = notebooks[resource.id]
      return notebook ? notebookTitle(notebook) : undefined
    }
    if (resource.type === 'query') return undefined
    return chats[resource.id]?.name
  }

  const entriesFor = (type: SidebarResourceType): ResourceEntry[] => {
    if (type === 'notebook') {
      return Object.entries(notebooks).map(([id, notebook]) => ({
        id,
        title: notebookTitle(notebook),
      }))
    }
    return Object.entries(chats).map(([id, chat]) => ({ id, title: chat.name }))
  }

  const drillInto = (type: SidebarResourceType) => {
    setSearch('')
    setPanelType(type)
    setDrilledType(type)
  }

  const goBack = () => {
    setSearch('')
    setDrilledType(undefined)
  }

  const section = RESOURCE_SECTIONS.find((entry) => entry.type === panelType)
  const visibleEntries = entriesFor(panelType).filter((entry) =>
    entry.title.toLowerCase().includes(search.trim().toLowerCase())
  )

  // Resources can be deleted out from under a recent entry.
  const resolvedRecents = recentItems.flatMap((item) => {
    const title = titleFor(item.resource)
    return title === undefined ? [] : [{ ...item, title }]
  })

  return (
    <div className="relative h-full overflow-hidden">
      <AnimatePresence mode="wait">
        {!isDrilled ? (
          /* Level 0 — resource types + recents */
          <motion.div
            key="root"
            role="group"
            aria-label="All resources"
            initial={{ opacity: 0, x: -LEVEL_OFFSET }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -LEVEL_OFFSET }}
            transition={LEVEL_TRANSITION}
            className="absolute inset-0 flex flex-col gap-4 overflow-y-auto p-3"
          >
            <nav className="flex flex-col gap-px">
              {RESOURCE_SECTIONS.map(({ type, label }) => {
                const Icon = RESOURCE_ICON[type]
                return (
                  <button
                    key={type}
                    type="button"
                    tabIndex={0}
                    className={rowClassName(false)}
                    onClick={() => drillInto(type)}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span className="flex-1 text-left">{label}</span>
                    <span className="text-xs text-foreground-lighter">
                      {entriesFor(type).length}
                    </span>
                    <ChevronRight size={14} className="shrink-0 text-foreground-muted" />
                  </button>
                )
              })}
            </nav>

            <section className="flex flex-col gap-px">
              <h3 className="mb-2 px-3 font-mono text-sm font-normal uppercase text-foreground-lighter">
                Recent
              </h3>
              {resolvedRecents.map((item) => {
                const Icon = RESOURCE_ICON[item.resource.type]
                const isRecentActive = isActive(item.resource.type, item.resource.id)
                return (
                  <button
                    key={`${item.resource.type}-${item.resource.id}`}
                    type="button"
                    tabIndex={0}
                    className={rowClassName(isRecentActive)}
                    onClick={() => onOpen(item.resource, item.title)}
                  >
                    <Icon
                      size={14}
                      className={cn(
                        'shrink-0',
                        isRecentActive ? 'text-foreground' : 'text-tertiary-foreground'
                      )}
                    />
                    <span
                      className={cn(
                        'flex-1 truncate text-left',
                        isRecentActive ? 'text-foreground' : 'text-tertiary-foreground'
                      )}
                    >
                      {item.title}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 text-xs',
                        isRecentActive ? 'text-foreground' : 'text-tertiary-foreground'
                      )}
                    >
                      {formatModifiedAt(item.modifiedAt)}
                    </span>
                  </button>
                )
              })}
              {resolvedRecents.length === 0 && (
                <p className="px-3 text-xs text-foreground-lighter">Nothing edited yet</p>
              )}
            </section>
          </motion.div>
        ) : (
          /* Level 1 — one resource type, searchable */
          <motion.div
            key={panelType}
            role="group"
            aria-label={section?.label}
            initial={{ opacity: 0, x: LEVEL_OFFSET }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: LEVEL_OFFSET }}
            transition={LEVEL_TRANSITION}
            className="absolute inset-0 flex flex-col"
          >
            <div className="flex items-center gap-1 p-3 pb-2">
              <Button
                variant="outline"
                size="tiny"
                aria-label="Back to all resources"
                onClick={goBack}
                className="size-7 shrink-0 px-0"
                icon={<ChevronLeft size={16} />}
              />
              <span id="explorer-sidebar-search-label" className="sr-only">
                {section?.searchPlaceholder}
              </span>
              <InnerSideBarFilters className="w-full gap-0 p-0">
                <InnerSideBarFilterSearchInput
                  ref={searchRef}
                  name="explorer-sidebar-search"
                  value={search}
                  placeholder={section?.searchPlaceholder}
                  aria-labelledby="explorer-sidebar-search-label"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </InnerSideBarFilters>
            </div>

            <div className="flex flex-1 flex-col gap-px overflow-y-auto px-3 pb-3">
              {visibleEntries.map((entry) => {
                const Icon = RESOURCE_ICON[panelType]
                return (
                  <button
                    key={entry.id}
                    type="button"
                    tabIndex={0}
                    className={rowClassName(isActive(panelType, entry.id))}
                    onClick={() => onOpen({ type: panelType, id: entry.id }, entry.title)}
                  >
                    <Icon size={14} className="shrink-0 text-foreground-muted" />
                    <span className="flex-1 truncate text-left">{entry.title}</span>
                  </button>
                )
              })}

              {visibleEntries.length === 0 && (
                <p className="px-3 py-2 text-xs text-foreground-lighter">
                  {search.trim().length > 0
                    ? `No ${section?.label.toLowerCase()} match "${search.trim()}"`
                    : `No ${section?.label.toLowerCase()} yet`}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Connected wrapper for `ProjectLayout`'s `productMenu` slot — the same slot the
 * SQL editor fills with `SQLEditorMenu`.
 */
export const ExplorerSidebarMenu = () => {
  const state = useExplorerPrototype()
  const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId)

  return (
    <ExplorerSidebar
      notebooks={state.notebooks}
      chats={state.chats}
      recentItems={state.recentItems}
      activeResource={activeTab?.resource}
      onOpen={state.openTab}
    />
  )
}
