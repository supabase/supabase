import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TabIcon } from 'components/explorer/tabs/TabIcon'
import { AnimatePresence, motion } from 'framer-motion'
import { useFlag } from 'hooks/ui/useFlag'
import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import {
  getTabsStore,
  handleTabClose,
  handleTabDragEnd,
  handleTabNavigation,
  makeTabPermanent,
  type Tab,
} from 'state/tabs'
import { cn, Tabs_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { useSnapshot } from 'valtio'
import { useEditorType } from '../editors/editors-layout.hooks'
import { CollapseButton } from './collapse-button'
import { sidebarState } from './sidebar-state'
import { useParams } from 'common'
import { EntityTypeIcon } from 'components/explorer/entity-type-icon'

interface TabsProps {
  storeKey: string
  onClose?: (id: string) => void
}

/**
 * Individual draggable tab component that handles:
 * - Drag
 * - Drop functionality
 * - Dynamic schema name display
 * - Tab label animations
 * - Close button interactions
 */
const SortableTab = ({
  tab,
  index,
  openTabs,
  onClose,
  storeKey,
}: {
  tab: Tab
  index: number
  openTabs: Tab[]
  onClose: (id: string) => void
  storeKey: string
}) => {
  const router = useRouter()
  const { ref } = useParams()
  const currentSchema = (router.query.schema as string) || 'public'

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
    if (tab.type === 'r' || tab.type === 'schema') {
      const anyTabHasDifferentSchema = openTabs
        .filter((t) => t.type === 'r' || t.type === 'schema')
        .some((t) => t.metadata?.schema !== currentSchema)

      return anyTabHasDifferentSchema
    }

    return false
  }, [openTabs, currentSchema, tab.type])

  // Create a motion version of TabsTrigger while preserving all functionality
  // const MotionTabsTrigger = motion(TabsTrigger_Shadcn_)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center h-10 first-of-type:border-l"
    >
      <TabsTrigger_Shadcn_
        value={tab.id}
        onDoubleClick={() => makeTabPermanent(ref, tab.id)}
        className={cn(
          'flex items-center gap-2 px-3 text-xs',
          'bg-dash-sidebar/50 dark:bg-surface-100/50',
          'data-[state=active]:bg-dash-sidebar dark:data-[state=active]:bg-surface-100',
          'relative group h-full border-t-2 !border-b-0',
          'hover:bg-surface-300 dark:hover:bg-surface-100',
          tab.isPreview && 'italic font-light' // Optional: style preview tabs differently
        )}
        {...listeners}
      >
        {/* <TabIcon type={tab.type} /> */}
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
          <span>{tab.type === 'schema' ? 'schema' : tab.label || 'Untitled'}</span>
        </div>
        <span
          role="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClose(tab.id)
          }}
          className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-200 rounded-sm cursor-pointer"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <X size={12} className="text-foreground-light" />
        </span>
        <div className="absolute w-full -bottom-[1px] left-0 right-0 h-px bg-dash-sidebar dark:bg-surface-100 opacity-0 group-data-[state=active]:opacity-100" />
      </TabsTrigger_Shadcn_>
      {index < openTabs.length && (
        <div role="separator" className="h-full w-px bg-border" key={`separator-${tab.id}`} />
      )}
    </div>
  )
}

export function ExplorerTabs({ storeKey, onClose }: TabsProps) {
  const { ref } = useParams()
  const editor = useEditorType()
  const router = useRouter()
  const store = getTabsStore(ref)
  const tabs = useSnapshot(store)
  const sidebar = useSnapshot(sidebarState)
  const sensors = useSensors(useSensor(PointerSensor))

  const openTabs = tabs.openTabs
    .map((id) => tabs.tabsMap[id])
    .filter((tab) => tab !== undefined) as Tab[]

  const entityTypes = {
    table: ['r', 'v', 'm', 'f', 'p', 'schema'],
    sql: ['sql'],
  }

  // Separate new tab from regular tabs
  const regularTabs = openTabs.filter((tab) => {
    // Filter by editor type - only show SQL tabs for SQL editor and table tabs for table editor
    return entityTypes[editor]?.includes(tab.type)
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tabs.openTabs.indexOf(active.id.toString())
    const newIndex = tabs.openTabs.indexOf(over.id.toString())

    if (oldIndex !== newIndex) {
      handleTabDragEnd(ref, oldIndex, newIndex, active.id.toString(), router)
    }
  }

  const handleClose = (id: string) => {
    handleTabClose(ref, id, router, editor, onClose)
  }

  const handleTabChange = (id: string) => {
    handleTabNavigation(ref, id, router)
  }

  const hasNewTab = router.pathname.includes('/new') // Object.values(tabs.tabsMap).some((tab) => tab.type === 'new')
  const isOnNewPage = router.pathname.endsWith('/explorer/new')

  return (
    <Tabs_Shadcn_
      value={hasNewTab ? 'new' : tabs.activeTab ?? undefined}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList_Shadcn_ className="bg-surface-200 dark:bg-alternative rounded-b-none gap-0 h-10 flex items-center">
        <CollapseButton hideTabs={sidebar.isOpen} />

        {/* Draggable regular tabs */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={regularTabs.map((tab) => tab.id)}
            strategy={horizontalListSortingStrategy}
          >
            {regularTabs.map((tab, index) => (
              <SortableTab
                key={tab.id}
                tab={tab}
                index={index}
                openTabs={openTabs}
                onClose={() => handleClose(tab.id)}
                storeKey={storeKey}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Non-draggable new tab */}
        {hasNewTab && (
          <>
            <TabsTrigger_Shadcn_
              value={'new'}
              className={cn(
                'flex items-center gap-2 px-3 text-xs',
                'bg-dash-sidebar/50 dark:bg-surface-100/50',
                'data-[state=active]:bg-dash-sidebar dark:data-[state=active]:bg-surface-100',
                'relative group h-full border-t-2 !border-b-0',
                'hover:bg-surface-300 dark:hover:bg-surface-100'
              )}
            >
              <TabIcon type={'new'} />
              <div className="flex items-center gap-0">
                <span>New</span>
              </div>
              <span
                role="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleClose('new')
                }}
                className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-200 rounded-sm cursor-pointer"
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <X size={12} className="text-foreground-light" />
              </span>{' '}
              <div className="absolute w-full -bottom-[1px] left-0 right-0 h-px bg-dash-sidebar dark:bg-surface-100 opacity-0 group-data-[state=active]:opacity-100" />
            </TabsTrigger_Shadcn_>
          </>
        )}

        <AnimatePresence initial={false}>
          {!isOnNewPage && !hasNewTab && (
            <motion.button
              className="flex items-center justify-center w-10 h-10 hover:bg-surface-100 shrink-0"
              onClick={() =>
                router.push(
                  `/project/${router.query.ref}/${editor === 'table' ? 'editor' : 'sql'}/new`
                )
              }
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus
                size={16}
                strokeWidth={1.5}
                className="text-foreground-lighter hover:text-foreground-light"
              />
            </motion.button>
          )}
        </AnimatePresence>
      </TabsList_Shadcn_>
    </Tabs_Shadcn_>
  )
}
