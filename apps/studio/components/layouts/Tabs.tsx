import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { useSnapshot } from 'valtio'

import { useParams } from 'common'
import { EntityTypeIcon } from 'components/ui/EntityTypeIcon'
import { useAppStateSnapshot } from 'state/app-state'
import {
  editorEntityTypes,
  getTabsStore,
  handleTabClose,
  handleTabDragEnd,
  handleTabNavigation,
  makeTabPermanent,
  type Tab,
} from 'state/tabs'
import { cn, Tabs_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { useEditorType } from './editors/EditorsLayout.hooks'
import { CollapseButton } from './Tabs/CollapseButton'

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
}: {
  tab: Tab
  index: number
  openTabs: Tab[]
  onClose: (id: string) => void
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
    if (tab.type === 'r') {
      const anyTabHasDifferentSchema = openTabs
        .filter((t) => t.type === 'r')
        .some((t) => t.metadata?.schema !== currentSchema)

      return anyTabHasDifferentSchema
    }

    return false
  }, [openTabs, currentSchema, tab.type])

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
      className={cn('flex items-center h-10 first-of-type:border-l')}
    >
      <TabsTrigger_Shadcn_
        value={tab.id}
        onDoubleClick={() => makeTabPermanent(ref, tab.id)}
        className={cn(
          'flex items-center gap-2 px-3 text-xs',
          'bg-dash-sidebar/50 dark:bg-surface-100/50',
          'data-[state=active]:bg-dash-sidebar dark:data-[state=active]:bg-surface-100',
          'border-b border-default',
          // bottom border active rule
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
          className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-200 rounded-sm cursor-pointer"
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

const TabPreview = ({ tab }: { tab: string }) => {
  const { ref } = useParams()
  const store = getTabsStore(ref)
  const tabs = useSnapshot(store)

  const tabData = tabs.tabsMap[tab]

  if (!tabData) return null

  return (
    <motion.div
      layoutId={tab}
      transition={{ duration: 0.045 }}
      animate={{ opacity: 0.7 }}
      className="flex relative items-center gap-2 px-3 text-xs bg-dash-sidebar dark:bg-surface-100 shadow-lg rounded-sm h-10"
    >
      <EntityTypeIcon type={tabData.type} />
      <span>{tabData.label || 'Untitled'}</span>
      <div className="absolute w-full top-0 left-0 right-0 h-px bg-foreground-muted" />
    </motion.div>
  )
}

export function Tabs() {
  const { ref } = useParams()
  const router = useRouter()
  const appSnap = useAppStateSnapshot()

  const editor = useEditorType()
  const store = getTabsStore(ref)
  const tabs = useSnapshot(store)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Start with a very small distance
      },
    })
  )

  const openTabs = tabs.openTabs
    .map((id) => tabs.tabsMap[id])
    .filter((tab) => tab !== undefined) as Tab[]

  const hasNewTab = router.asPath.includes('/new')

  // Filter by editor type - only show SQL tabs for SQL editor and table tabs for table editor
  const editorTabs = !!editor
    ? openTabs.filter((tab) => editorEntityTypes[editor]?.includes(tab.type))
    : []

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
    const onClearDashboardHistory = () => {
      if (ref && editor) {
        appSnap.setDashboardHistory(ref, editor === 'table' ? 'editor' : editor, undefined)
      }
    }
    handleTabClose({ ref, id, router, editor, onClearDashboardHistory })
  }

  const handleTabChange = (id: string) => {
    handleTabNavigation(ref, id, router)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Tabs_Shadcn_
        className="w-full flex"
        value={hasNewTab ? 'new' : tabs.activeTab ?? undefined}
        onValueChange={handleTabChange}
      >
        <CollapseButton hideTabs={false} />
        <TabsList_Shadcn_ className="bg-surface-200 dark:bg-alternative rounded-b-none gap-0 h-10 flex items-center w-full z-[1] border-none overflow-clip overflow-x-auto ">
          <SortableContext
            items={editorTabs.map((tab) => tab.id)}
            strategy={horizontalListSortingStrategy}
          >
            {editorTabs.map((tab, index) => (
              <SortableTab
                key={tab.id}
                tab={tab}
                index={index}
                openTabs={openTabs}
                onClose={() => handleClose(tab.id)}
              />
            ))}
          </SortableContext>

          {/* Non-draggable new tab */}
          {hasNewTab && (
            <>
              <TabsTrigger_Shadcn_
                value="new"
                className={cn(
                  'flex items-center gap-2 px-3 text-xs',
                  'bg-dash-sidebar/50 dark:bg-surface-100/50',
                  'data-[state=active]:bg-dash-sidebar dark:data-[state=active]:bg-surface-100',
                  'relative group h-full border-t-2 !border-b-0',
                  'hover:bg-surface-300 dark:hover:bg-surface-100'
                )}
              >
                <Plus size={16} strokeWidth={1.5} className={'text-foreground-lighter'} />
                <div className="flex items-center gap-0">
                  <span>New</span>
                </div>
                <span
                  role="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-200 rounded-sm cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleClose('new')
                  }}
                >
                  <X size={12} className="text-foreground-light" />
                </span>{' '}
                <div className="absolute w-full -bottom-[1px] left-0 right-0 h-px bg-dash-sidebar dark:bg-surface-100 opacity-0 group-data-[state=active]:opacity-100" />
              </TabsTrigger_Shadcn_>
            </>
          )}

          <AnimatePresence initial={false}>
            {!hasNewTab && (
              <motion.button
                className="flex items-center justify-center w-10 h-10 hover:bg-surface-100 shrink-0 border-b"
                onClick={() =>
                  router.push(
                    `/project/${router.query.ref}/${editor === 'table' ? 'editor' : 'sql'}/new?skip=true`
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
          <div className="grow h-full border-b pr-6" />
        </TabsList_Shadcn_>
      </Tabs_Shadcn_>
      <DragOverlay dropAnimation={null}>
        {tabs.activeTab ? <TabPreview tab={tabs.activeTab} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
