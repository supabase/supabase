import { motion } from 'framer-motion'
import { ChevronLeft, Database, MessageSquare, NotebookText, Plus } from 'lucide-react'
import { type ComponentType, type PropsWithChildren, type ReactNode } from 'react'
import { Button, cn } from 'ui'
import { InnerSideBarFilters, InnerSideBarFilterSearchInput } from 'ui-patterns/InnerSideMenu'

import { useCreateChat, useCreateNotebook } from '@/components/interfaces/Explorer/hooks'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

/** Explorer resources the sidebar can both list and create. */
export type ExplorerResourceType = 'notebook' | 'chat'

/**
 * A level in the sidebar's drill-down stack. The layout keeps these on a stack, so going
 * back is a pop and a new level costs one member here plus the panel that renders it.
 */
export type ExplorerNavLevel = ExplorerResourceType | 'database' | 'database-tables'

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

/**
 * One level of the sidebar: the sliding panel, its back control, an optional filter input,
 * and an optional action. Levels differ only in what they list, so they compose this rather
 * than each rebuilding the header.
 */
export const ExplorerNavPanel = ({
  label,
  className,
  children,
  search,
  setSearch,
  searchPlaceholder,
  action,
  onBack,
}: PropsWithChildren<{
  label: string
  className?: string
  search?: string
  /** Renders the filter input when given; otherwise the header shows `label` as a title. */
  setSearch?: (value: string) => void
  searchPlaceholder?: string
  action?: ReactNode
  onBack: () => void
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
      <div className="flex items-center gap-2 p-3 pb-2">
        <Button
          size="tiny"
          variant="outline"
          aria-label="Back"
          onClick={onBack}
          className="size-7 shrink-0 px-0"
          icon={<ChevronLeft />}
        />
        {setSearch === undefined ? (
          <span className="flex-1 truncate text-sm text-foreground">{label}</span>
        ) : (
          <>
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
              />
            </InnerSideBarFilters>
          </>
        )}
        {action}
      </div>
      {children}
    </motion.div>
  )
}

/** An `ExplorerNavPanel` for a creatable resource, adding its "new" action to the header. */
export const ExplorerNavResourceWrapper = ({
  type,
  label,
  className,
  children,
  search,
  setSearch,
  onBack,
}: PropsWithChildren<{
  type: ExplorerResourceType
  label?: string
  className?: string
  search?: string
  setSearch: (value: string) => void
  onBack: () => void
}>) => {
  const { createNotebook } = useCreateNotebook()
  const { createChat } = useCreateChat()
  const { searchPlaceholder } = EXPLORER_RESOURCES[type]

  return (
    <ExplorerNavPanel
      label={label ?? EXPLORER_SECTIONS.find((section) => section.level === type)?.label ?? type}
      className={className}
      search={search}
      setSearch={setSearch}
      searchPlaceholder={searchPlaceholder}
      onBack={onBack}
      action={
        <ButtonTooltip
          size="tiny"
          variant="outline"
          aria-label={`New ${type}`}
          className="size-7 shrink-0 px-0"
          icon={<Plus />}
          tooltip={{ content: { side: 'bottom', text: `New ${type}` } }}
          onClick={() => {
            if (type === 'notebook') createNotebook()
            if (type === 'chat') createChat()
          }}
        />
      }
    >
      {children}
    </ExplorerNavPanel>
  )
}
