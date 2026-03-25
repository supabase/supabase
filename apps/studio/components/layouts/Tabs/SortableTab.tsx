import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EntityTypeIcon } from 'components/ui/EntityTypeIcon'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { useTabsStateSnapshot, type Tab } from 'state/tabs'
import { cn, TabsTrigger_Shadcn_ } from 'ui'

import { useEditorType } from '../editors/EditorsLayout.hooks'

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
}: {
  tab: Tab
  index: number
  openTabs: Tab[]
  onClose: (id: string) => void
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

  // Create a motion version of TabsTrigger while preserving all functionality
  // const MotionTabsTrigger = motion(TabsTrigger_Shadcn_)

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      layoutId={tab.id}
      transition={{ duration: 0.045 }}
      animate={{ opacity: isDragging ? 0 : 1 }}
      className={cn('flex items-center h-[var(--header-height)] first-of-type:border-l')}
    >
      <TabsTrigger_Shadcn_
        value={tab.id}
        onAuxClick={(e) => {
          // Middle click closes tab
          if (e.button === 1) {
            e.preventDefault()
            onClose(tab.id)
          }
        }}
        onDoubleClick={() => tabs.makeTabPermanent(tab.id)}
        className={cn(
          'flex items-center gap-2 pl-3 pr-2.5 text-xs',
          'bg-dash-sidebar/50 dark:bg-surface-100/50',
          'data-[state=active]:bg-dash-sidebar dark:data-[state=active]:bg-surface-100',
          'border-b border-default',
          'data-[state=active]:border-b-background-dash-sidebar dark:data-[state=active]:border-b-background-surface-100',
          'relative group h-full',
          'hover:bg-surface-300 dark:hover:bg-surface-100',
          tab.isPreview && 'italic font-light' // Optional: style preview tabs differently
        )}
        {...listeners}
      >
        <EntityTypeIcon type={tab.type} />
        <div className="flex items-center gap-0">
          <AnimatePresence mode="popLayout" initial>
            {shouldShowSchema && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="text-foreground-muted group-data-[state=active]:text-foreground-lighter"
              >
                {tab?.metadata?.schema}.
              </motion.span>
            )}
          </AnimatePresence>
          <span>{tab.label || 'Untitled'}</span>
        </div>
        <span
          role="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className="p-0.5 ml-1 opacity-0 group-hover:opacity-100 hover:bg-200 rounded-sm cursor-pointer"
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
        <div className="absolute w-full top-0 left-0 right-0 h-px bg-foreground opacity-0 group-data-[state=active]:opacity-100" />
      </TabsTrigger_Shadcn_>
      {index < openTabs.length && (
        <div role="separator" className="h-full w-px bg-border" key={`separator-${tab.id}`} />
      )}
    </motion.div>
  )
}
