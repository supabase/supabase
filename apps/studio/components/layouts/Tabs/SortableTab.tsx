import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useMemo, type MouseEvent } from 'react'
import { cn, TabsTrigger_Shadcn_, ToggleGroupItem } from 'ui'

import { useEditorType } from '../editors/EditorsLayout.hooks'
import { SQL_EDITOR_SIDEBAR_SEARCH_ROW_HEIGHT_CLASSNAME } from '../SQLEditorLayout/SQLEditorNavV2/SQLEditorNav.constants'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { useTabsStateSnapshot, type Tab } from '@/state/tabs'

/**
 * Individual draggable tab component that handles:
 * - Drag
 * - Drop functionality
 * - Dynamic schema name display
 * - Tab label animations
 * - Close button interactions
 */
export const SortableTab = ({
  tab,
  index,
  openTabs,
  onClose,
  variant = 'default',
}: {
  tab: Tab
  index: number
  openTabs: Tab[]
  onClose: (id: string) => void
  variant?: 'default' | 'toggle-group'
}) => {
  const editor = useEditorType()
  const tabs = useTabsStateSnapshot()
  const { selectedSchema: currentSchema } = useQuerySchemaState()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  }

  // Update schema visibility check to include URL param comparison
  const shouldShowSchema = useMemo(() => {
    // For both table and schema tabs, show schema if:
    // Any tab has a different schema than the current schema parameter
    return openTabs.some((t) => editor === 'table' && t.metadata?.schema !== currentSchema)
  }, [openTabs, currentSchema, editor])

  const isToggleGroupTab = variant === 'toggle-group'

  const tabLabel = (
    <>
      <span className={cn(isToggleGroupTab && 'shrink-0')}>
        <EntityTypeIcon type={tab.type} />
      </span>
      <div
        className={cn(
          'flex min-w-0 items-center gap-0',
          isToggleGroupTab && 'flex-1 overflow-hidden'
        )}
      >
        <AnimatePresence mode="popLayout" initial>
          {shouldShowSchema && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'shrink-0 text-foreground-muted',
                isToggleGroupTab
                  ? 'group-data-[state=on]:text-foreground-lighter'
                  : 'group-data-[state=active]:text-foreground-lighter'
              )}
            >
              {tab?.metadata?.schema}.
            </motion.span>
          )}
        </AnimatePresence>
        <span className={cn(isToggleGroupTab && 'truncate')}>{tab.label || 'Untitled'}</span>
      </div>
      <span
        role="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        className={cn(
          'ml-1 cursor-pointer rounded-xs p-0.5 opacity-0 group-hover:opacity-100 hover:bg-200',
          isToggleGroupTab && 'shrink-0'
        )}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onClose(tab.id)
        }}
      >
        <X size={12} className="text-foreground-light" />
      </span>
    </>
  )

  const tabInteractionProps = {
    onAuxClick: (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault()
        onClose(tab.id)
      }
    },
    onDoubleClick: () => tabs.makeTabPermanent(tab.id),
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      layoutId={tab.id}
      transition={{ duration: 0.045 }}
      animate={{ opacity: isDragging ? 0 : 1 }}
      className={cn(
        'flex items-center',
        isToggleGroupTab
          ? 'min-w-0 max-w-[240px] shrink'
          : 'h-(--header-height) shrink-0 first-of-type:border-l'
      )}
    >
      {variant === 'toggle-group' ? (
        <ToggleGroupItem
          value={tab.id}
          aria-label={tab.label || 'Untitled'}
          className={cn(
            'group relative flex w-auto min-w-0 max-w-full items-center gap-1.5 overflow-hidden px-2 text-xs',
            SQL_EDITOR_SIDEBAR_SEARCH_ROW_HEIGHT_CLASSNAME,
            tab.isPreview && 'italic font-light'
          )}
          {...tabInteractionProps}
          {...listeners}
        >
          {tabLabel}
        </ToggleGroupItem>
      ) : (
        <TabsTrigger_Shadcn_
          value={tab.id}
          className={cn(
            'flex items-center gap-2 pl-3 pr-2.5 text-xs',
            'bg-dash-sidebar/50 dark:bg-surface-100/50',
            'data-[state=active]:bg-dash-sidebar dark:data-[state=active]:bg-surface-100',
            'border-b border-default',
            'data-[state=active]:border-b-background-dash-sidebar dark:data-[state=active]:border-b-background-surface-100',
            'relative group h-full',
            'hover:bg-surface-300 dark:hover:bg-surface-100',
            tab.isPreview && 'italic font-light'
          )}
          {...tabInteractionProps}
          {...listeners}
        >
          {tabLabel}
          <div className="absolute w-full top-0 left-0 right-0 h-px bg-foreground opacity-0 group-data-[state=active]:opacity-100" />
        </TabsTrigger_Shadcn_>
      )}
      {variant === 'default' && index < openTabs.length && (
        <div role="separator" className="h-full w-px bg-border" key={`separator-${tab.id}`} />
      )}
    </motion.div>
  )
}
