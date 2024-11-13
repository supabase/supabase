import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import { useActionKey } from 'hooks/useActionKey'
import {
  CirclePlus,
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Table2,
  Workflow,
  X,
} from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  getTabsStore,
  makeTabPermanent,
  openNewContentTab,
  removeTab,
  type Tab,
  type TabType,
  handleTabNavigation,
  handleTabClose,
  handleTabDragEnd,
} from 'state/tabs'
import { cn, SQL_ICON, Tabs_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { useSnapshot } from 'valtio'
import { sidebarState } from './sidebar-state'
import { TabIcon } from 'components/explorer/tabs/TabIcon'

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
  const currentSchema = (router.query.schema as string) || 'public'
  const store = getTabsStore(storeKey)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  }

  const snapV2 = useSqlEditorV2StateSnapshot()

  // For SQL tabs, get the snippet from the SQL editor state
  // This ensures tab labels stay in sync with snippet names
  const sqlSnippet =
    tab.type === 'sql' && tab.metadata?.sqlId ? snapV2.snippets[tab.metadata.sqlId]?.snippet : null

  // Check if we have tables from multiple schemas
  // Used to determine if we need to show schema names in table labels
  const hasMultipleSchemas = openTabs
    .filter((t) => t.type === 'table')
    .some((t) => t.metadata?.schema !== openTabs[0]?.metadata?.schema)

  // Update schema visibility check to include URL param comparison
  const shouldShowSchema = useMemo(() => {
    // For both table and schema tabs, show schema if:
    // Any tab has a different schema than the current schema parameter
    if (tab.type === 'table' || tab.type === 'schema') {
      const anyTabHasDifferentSchema = openTabs
        .filter((t) => t.type === 'table' || t.type === 'schema')
        .some((t) => t.metadata?.schema !== currentSchema)

      return anyTabHasDifferentSchema
    }

    return false
  }, [openTabs, currentSchema, tab.type])

  // Create a motion version of TabsTrigger while preserving all functionality
  const MotionTabsTrigger = motion(TabsTrigger_Shadcn_)

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center h-10">
      <TabsTrigger_Shadcn_
        value={tab.id}
        onDoubleClick={() => makeTabPermanent(storeKey, tab.id)}
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
        <TabIcon type={tab.type} />
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
  const router = useRouter()
  const store = getTabsStore(storeKey)
  const tabs = useSnapshot(store)
  const sidebar = useSnapshot(sidebarState)
  const sensors = useSensors(useSensor(PointerSensor))
  const actionKey = useActionKey()

  const openTabs = tabs.openTabs
    .map((id) => tabs.tabsMap[id])
    .filter((tab) => tab !== undefined) as Tab[]

  // Separate new tab from regular tabs
  const regularTabs = openTabs.filter((tab) => tab.type !== 'new')
  const newTab = openTabs.find((tab) => tab.type === 'new')

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tabs.openTabs.indexOf(active.id.toString())
    const newIndex = tabs.openTabs.indexOf(over.id.toString())

    if (oldIndex !== newIndex) {
      handleTabDragEnd(storeKey, oldIndex, newIndex, active.id.toString(), router)
    }
  }

  const handleClose = (id: string) => {
    handleTabClose(storeKey, id, router, onClose)
  }

  const handleTabChange = (id: string) => {
    handleTabNavigation(storeKey, id, router)
  }

  const handleNewClick = () => {
    openNewContentTab(storeKey)
    router.push(`/project/${router.query.ref}/explorer/new`)
  }

  const hasNewTab = Object.values(tabs.tabsMap).some((tab) => tab.type === 'new')
  const isOnNewPage = router.pathname.endsWith('/explorer/new')

  return (
    <Tabs_Shadcn_
      value={tabs.activeTab ?? undefined}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList_Shadcn_ className="bg-surface-200 dark:bg-alternative rounded-b-none gap-0 h-10 flex items-center">
        <button
          className="flex items-center justify-center w-10 h-10 hover:bg-surface-100 shrink-0 border-r"
          onClick={() => (sidebarState.isOpen = !sidebar.isOpen)}
        >
          {sidebar.isOpen ? (
            <PanelLeftClose
              size={16}
              strokeWidth={1.5}
              className="text-foreground-lighter hover:text-foreground-light"
            />
          ) : (
            <PanelLeftOpen
              size={16}
              strokeWidth={1.5}
              className="text-foreground-lighter hover:text-foreground-light"
            />
          )}
        </button>

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
                onClose={handleClose}
                storeKey={storeKey}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Non-draggable new tab */}
        {newTab && (
          <>
            <TabsTrigger_Shadcn_
              value={newTab.id}
              className={cn(
                'flex items-center gap-2 px-3 text-xs',
                'bg-dash-sidebar/50 dark:bg-surface-100/50',
                'data-[state=active]:bg-dash-sidebar dark:data-[state=active]:bg-surface-100',
                'relative group h-full border-t-2 !border-b-0',
                'hover:bg-surface-300 dark:hover:bg-surface-100'
              )}
            >
              <TabIcon type={newTab.type} />
              <div className="flex items-center gap-0">
                <span>{newTab.type === 'schema' ? 'schema' : newTab.label || 'Untitled'}</span>
              </div>
              <span
                role="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleClose(newTab.id)
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

        {!isOnNewPage && !hasNewTab && (
          <button
            className="flex items-center justify-center w-10 h-10 hover:bg-surface-100 shrink-0 border-l"
            onClick={handleNewClick}
          >
            <Plus
              size={16}
              strokeWidth={1.5}
              className="text-foreground-lighter hover:text-foreground-light"
            />
          </button>
        )}
      </TabsList_Shadcn_>
    </Tabs_Shadcn_>
  )
}
