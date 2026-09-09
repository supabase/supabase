import { motion } from 'framer-motion'
import { Database, MessageSquare, NotebookText } from 'lucide-react'
import { type ComponentType, type PropsWithChildren } from 'react'
import { cn } from 'ui'
import { InnerSideBarFilters, InnerSideBarFilterSearchInput } from 'ui-patterns/InnerSideMenu'

import { onSearchInputEscape } from '@/lib/keyboard'

/** Explorer resources the sidebar can both list and create. */
export type ExplorerResourceType = 'notebook' | 'chat'

/**
 * A level in the sidebar's drill-down stack. The layout keeps these on a stack, so going
 * back is a pop and a new level costs one member here plus the panel that renders it.
 */
export type ExplorerNavLevel = ExplorerResourceType | 'database'

export type ExplorerNavEntry =
  | { level: ExplorerNavLevel }
  | { level: 'database-schema' | 'database-tables'; schema: string }

type ExplorerNavIcon = ComponentType<{ size?: number; className?: string }>

/** Icon and filter copy per resource, shared by its panel and the recently updated list. */
export const EXPLORER_RESOURCES: Record<
  ExplorerResourceType,
  { icon: ExplorerNavIcon; searchPlaceholder: string }
> = {
  notebook: { icon: NotebookText, searchPlaceholder: 'Search notebooks' },
  chat: { icon: MessageSquare, searchPlaceholder: 'Search chats' },
}

/** Top-level sidebar destinations, in display order. */
export const EXPLORER_SECTIONS: Array<{
  level: ExplorerNavLevel
  label: string
  icon: ExplorerNavIcon
}> = [
  { level: 'database', label: 'Database', icon: Database },
  { level: 'notebook', label: 'Notebooks', icon: EXPLORER_RESOURCES.notebook.icon },
  { level: 'chat', label: 'Chats', icon: EXPLORER_RESOURCES.chat.icon },
]

export const LEVEL_OFFSET = 8
export const LEVEL_TRANSITION = { duration: 0.09, ease: 'easeOut' } as const

export const rowClassName = (isActive: boolean) =>
  cn(
    'group relative flex h-7 w-full items-center gap-2 rounded-md pl-3 pr-2 text-sm',
    isActive
      ? 'bg-selection text-foreground'
      : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
  )

/** Sliding sidebar content with an optional search field. Navigation lives in the header. */
export const ExplorerNavPanel = ({
  label,
  className,
  children,
  search,
  setSearch,
  searchPlaceholder,
}: PropsWithChildren<{
  label: string
  className?: string
  search?: string
  /** Renders the filter input when given. */
  setSearch?: (value: string) => void
  searchPlaceholder?: string
}>) => {
  return (
    <motion.div
      role="group"
      aria-label={label}
      initial={{ opacity: 0, x: LEVEL_OFFSET }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: LEVEL_OFFSET }}
      transition={LEVEL_TRANSITION}
      className={cn('absolute inset-0 flex flex-col', setSearch === undefined && 'pt-3', className)}
    >
      {setSearch !== undefined && (
        <div className="p-3 pb-2">
          <span id="explorer-sidebar-search-label" className="sr-only">
            {searchPlaceholder}
          </span>
          <InnerSideBarFilters className="w-full gap-0 p-0">
            <InnerSideBarFilterSearchInput
              name="explorer-sidebar-search"
              value={search}
              placeholder={searchPlaceholder}
              aria-labelledby="explorer-sidebar-search-label"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={onSearchInputEscape(search ?? '', setSearch)}
            />
          </InnerSideBarFilters>
        </div>
      )}
      {children}
    </motion.div>
  )
}

/** A resource panel with its shared label and search copy. */
export const ExplorerNavResourceWrapper = ({
  type,
  label,
  className,
  children,
  search,
  setSearch,
}: PropsWithChildren<{
  type: ExplorerResourceType
  label?: string
  className?: string
  search?: string
  setSearch: (value: string) => void
}>) => {
  const { searchPlaceholder } = EXPLORER_RESOURCES[type]

  return (
    <ExplorerNavPanel
      label={label ?? EXPLORER_SECTIONS.find((section) => section.level === type)?.label ?? type}
      className={className}
      search={search}
      setSearch={setSearch}
      searchPlaceholder={searchPlaceholder}
    >
      {children}
    </ExplorerNavPanel>
  )
}
