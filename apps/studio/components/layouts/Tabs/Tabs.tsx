import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { TabsUpdateTooltip } from 'components/interfaces/App/FeaturePreview/TableEditorTabs'
import { useAppStateSnapshot } from 'state/app-state'
import { editorEntityTypes, useTabsStateSnapshot, type Tab } from 'state/tabs'
import { cn, Tabs_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { useEditorType } from '../editors/EditorsLayout.hooks'
import { CollapseButton } from './CollapseButton'
import { SortableTab } from './SortableTab'
import { TabPreview } from './TabPreview'

export const EditorTabs = () => {
  const { ref } = useParams()
  const router = useRouter()
  const appSnap = useAppStateSnapshot()

  const editor = useEditorType()
  const tabs = useTabsStateSnapshot()
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
      tabs.handleTabDragEnd(oldIndex, newIndex, active.id.toString(), router)
    }
  }

  const handleClose = (id: string) => {
    const onClearDashboardHistory = () => {
      if (ref && editor) {
        appSnap.setDashboardHistory(ref, editor === 'table' ? 'editor' : editor, undefined)
      }
    }
    tabs.handleTabClose({ id, router, editor, onClearDashboardHistory })
  }

  const handleTabChange = (id: string) => {
    tabs.handleTabNavigation(id, router)
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

        <TabsUpdateTooltip />
      </Tabs_Shadcn_>

      <DragOverlay dropAnimation={null}>
        {tabs.activeTab ? <TabPreview tab={tabs.activeTab} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
