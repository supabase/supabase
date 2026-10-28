import { TableEditor } from 'icons'
import { MessageSquareIcon, NotebookTextIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { type ComponentType, type PropsWithChildren, type ReactNode } from 'react'
import { cn } from 'ui'
import { InnerSideBarFilters, InnerSideBarFilterSearchInput } from 'ui-patterns/InnerSideMenu'
import { z } from 'zod'

import { onSearchInputEscape } from '@/lib/keyboard'

/** Explorer resources the sidebar can both list and create. */
export type ExplorerResourceType = 'notebook' | 'chat'

/**
 * A sidebar section below the root. Each is one level deep: anything that narrows a section,
 * like the tables' schema or object type, is a control within its panel, not another level.
 */
export const explorerNavLevelSchema = z.enum(['tables', 'notebook', 'chat'])
export type ExplorerNavLevel = z.infer<typeof explorerNavLevelSchema>

type ExplorerNavIcon = ComponentType<{ size?: number; className?: string }>

/** Icon and filter copy per resource, shared by its panel and the recently updated list. */
export const EXPLORER_RESOURCES: Record<
  ExplorerResourceType,
  { icon: ExplorerNavIcon; searchPlaceholder: string }
> = {
  notebook: { icon: NotebookTextIcon, searchPlaceholder: 'Search notebooks' },
  chat: { icon: MessageSquareIcon, searchPlaceholder: 'Search chats' },
}

export type ExplorerSection = { level: ExplorerNavLevel; label: string; icon: ExplorerNavIcon }

/**
 * The project's tables, first in the sidebar and grouped with Run SQL apart from saved work:
 * it's the Table Editor's job, and the destination people return to most. It shares the Table
 * Editor's icon.
 */
export const EXPLORER_TABLES_SECTION: ExplorerSection = {
  level: 'tables',
  label: 'Tables',
  icon: TableEditor,
}

/** Sections for the user's own work, below the tables and Run SQL, in display order. */
export const EXPLORER_RESOURCE_SECTIONS: ExplorerSection[] = [
  { level: 'notebook', label: 'Notebooks', icon: EXPLORER_RESOURCES.notebook.icon },
  { level: 'chat', label: 'Chats', icon: EXPLORER_RESOURCES.chat.icon },
]

export const EXPLORER_SECTIONS: ExplorerSection[] = [
  EXPLORER_TABLES_SECTION,
  ...EXPLORER_RESOURCE_SECTIONS,
]

export const LEVEL_OFFSET = 8
export const LEVEL_TRANSITION = { duration: 0.09, ease: 'easeOut' } as const

export const rowClassName = (isActive: boolean) =>
  cn(
    'group relative flex h-7 w-full items-center gap-2 rounded-md pl-2 pr-2 text-sm',
    isActive
      ? 'bg-selection text-foreground'
      : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
  )

/** Sliding sidebar content with an optional search field. Navigation lives in the header. */
export const ExplorerNavPanel = ({
  label,
  className,
  children,
  header,
  search,
  setSearch,
  searchPlaceholder,
  searchActions,
}: PropsWithChildren<{
  label: string
  className?: string
  /** Controls above the search field that scope the whole panel, like a schema selector. */
  header?: ReactNode
  search?: string
  /** Renders the filter input when given. */
  setSearch?: (value: string) => void
  searchPlaceholder?: string
  /** Controls beside the search field that refine the list, like a type filter. */
  searchActions?: ReactNode
}>) => {
  return (
    <motion.div
      role="group"
      aria-label={label}
      initial={{ opacity: 0, x: LEVEL_OFFSET }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: LEVEL_OFFSET }}
      transition={LEVEL_TRANSITION}
      className={cn('absolute inset-0 flex flex-col', className)}
    >
      {(header !== undefined || setSearch !== undefined) && (
        <div className="flex flex-col gap-2 px-3 pt-3">
          {header}
          {setSearch !== undefined && (
            <>
              <span id="explorer-sidebar-search-label" className="sr-only">
                {searchPlaceholder}
              </span>
              <InnerSideBarFilters className="w-full gap-2 p-0">
                <InnerSideBarFilterSearchInput
                  name="explorer-sidebar-search"
                  value={search}
                  placeholder={searchPlaceholder}
                  aria-labelledby="explorer-sidebar-search-label"
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={onSearchInputEscape(search ?? '', setSearch)}
                />
                {searchActions}
              </InnerSideBarFilters>
            </>
          )}
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
