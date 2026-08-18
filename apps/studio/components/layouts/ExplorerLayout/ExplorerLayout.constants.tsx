import { motion } from 'framer-motion'
import { ChevronLeft, MessageSquare, NotebookText, Plus } from 'lucide-react'
import { type ComponentType, type PropsWithChildren } from 'react'
import { Button, cn } from 'ui'
import { InnerSideBarFilters, InnerSideBarFilterSearchInput } from 'ui-patterns/InnerSideMenu'

import { useCreateChat, useCreateNotebook } from '@/components/interfaces/Explorer/hooks'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

export type ExplorerResourceType = 'notebook' | 'chat'

export const LEVEL_OFFSET = 8
export const LEVEL_TRANSITION = { duration: 0.09, ease: 'easeOut' } as const

export const EXPLORER_SECTIONS: Array<{
  type: ExplorerResourceType
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
  searchPlaceholder: string
}> = [
  {
    type: 'notebook',
    label: 'Notebooks',
    icon: NotebookText,
    searchPlaceholder: 'Search notebooks',
  },
  { type: 'chat', label: 'Chats', icon: MessageSquare, searchPlaceholder: 'Search chats' },
]

export const rowClassName = (isActive: boolean) =>
  cn(
    'group relative flex h-7 w-full items-center gap-2 rounded-md pl-3 pr-2 text-sm',
    isActive
      ? 'bg-selection text-foreground'
      : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
  )

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
  const searchPlaceholder = EXPLORER_SECTIONS.find((x) => x.type === type)?.searchPlaceholder

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
      </div>
      {children}
    </motion.div>
  )
}
