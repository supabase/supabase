import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import {
  cn,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Tabs_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'

import { useEditorType } from '../editors/EditorsLayout.hooks'
import { SQL_EDITOR_SIDEBAR_SEARCH_ROW_HEIGHT_CLASSNAME } from '../SQLEditorLayout/SQLEditorNavV2/SQLEditorNav.constants'
import { CollapseButton } from './CollapseButton'
import { SortableTab } from './SortableTab'
import { TabPreview } from './TabPreview'
import { useTabsScroll } from './Tabs.utils'
import { clearPersistedDraftSqlTab } from '@/components/interfaces/SQLEditor/createDraftSqlTab'
import { useCreateDraftSqlTab } from '@/components/interfaces/SQLEditor/useCreateDraftSqlTab'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { editorEntityTypes, isSqlEditorTab, useTabsStateSnapshot, type Tab } from '@/state/tabs'

export const EditorTabs = () => {
  const { ref } = useParams()
  const router = useRouter()
  const { setLastVisitedSnippet, setLastVisitedTable } = useDashboardHistory()

  const editor = useEditorType()
  const tabs = useTabsStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { createDraftTab } = useCreateDraftSqlTab()
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

  const onClearDashboardHistory = () => {
    if (editor === 'table') {
      setLastVisitedTable(undefined)
    } else if (editor === 'sql') {
      setLastVisitedSnippet(undefined)
    }
  }

  const cleanupDraftTabState = (tabId: string) => {
    const tab = tabs.tabsMap[tabId]
    const draftSqlId = tab?.metadata?.isDraft ? tab.metadata?.sqlId : undefined
    if (draftSqlId && ref) {
      snapV2.removeSnippet(draftSqlId, true)
      clearPersistedDraftSqlTab(ref, draftSqlId)
    }
  }

  const handleClose = (tabId: string) => {
    tabs.handleTabClose({
      id: tabId,
      router,
      editor,
      onClearDashboardHistory,
      onClose: () => {
        cleanupDraftTabState(tabId)
      },
    })
  }

  const handleCloseAll = () => {
    if (editor) {
      const tabsToClose =
        editor === 'table'
          ? tabs.openTabs.filter((x) => !isSqlEditorTab(x, tabs.tabsMap))
          : tabs.openTabs.filter((x) => isSqlEditorTab(x, tabs.tabsMap))

      tabsToClose.forEach(cleanupDraftTabState)
      tabs.removeTabs(tabsToClose)
      onClearDashboardHistory()
      router.push(`/project/${ref}/${editor === 'table' ? 'editor' : 'sql'}`)
    }
  }

  const handleCloseOthers = (tabId: string) => {
    if (editor) {
      const tabsToClose =
        editor === 'table'
          ? tabs.openTabs.filter((x) => !isSqlEditorTab(x, tabs.tabsMap) && x !== tabId)
          : tabs.openTabs.filter((x) => isSqlEditorTab(x, tabs.tabsMap) && x !== tabId)

      tabsToClose.forEach(cleanupDraftTabState)
      tabs.removeTabs(tabsToClose)
      onClearDashboardHistory()

      if (tabs.activeTab !== tabId) {
        tabs.handleTabNavigation(tabId, router)
      }
    }
  }

  const handleCloseRight = (tabId: string) => {
    if (editor) {
      const openedTabs =
        editor === 'table'
          ? tabs.openTabs.filter((x) => !isSqlEditorTab(x, tabs.tabsMap))
          : tabs.openTabs.filter((x) => isSqlEditorTab(x, tabs.tabsMap))
      const tabIdx = openedTabs.indexOf(tabId)
      const activeTabIdx = openedTabs.indexOf(tabs.activeTab!)
      const tabsToClose = openedTabs.slice(tabIdx + 1)
      tabsToClose.forEach(cleanupDraftTabState)
      tabs.removeTabs(tabsToClose)

      const isActiveTabClosed = tabIdx < activeTabIdx
      if (isActiveTabClosed) {
        tabs.handleTabNavigation(tabId, router)
      }
    }
  }

  const handleTabChange = (id: string) => {
    tabs.handleTabNavigation(id, router)
  }

  const { tabsListRef } = useTabsScroll({
    activeTab: tabs.activeTab,
    tabCount: editorTabs.length,
    enabled: editor !== 'sql',
  })
  const activeTabValue = tabs.activeTab ?? undefined
  const isSqlEditor = editor === 'sql'

  const sortableTabs = (
    <SortableContext
      items={editorTabs.map((tab) => tab.id)}
      strategy={horizontalListSortingStrategy}
    >
      {editorTabs.map((tab, index) => (
        <ContextMenu key={tab.id}>
          <ContextMenuTrigger asChild={isSqlEditor}>
            <SortableTab
              key={tab.id}
              tab={tab}
              index={index}
              openTabs={openTabs}
              variant={isSqlEditor ? 'toggle-group' : 'default'}
              onClose={() => handleClose(tab.id)}
            />
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => handleClose(tab.id)}>Close</ContextMenuItem>
            <ContextMenuItem onClick={() => handleCloseOthers(tab.id)}>
              Close Others
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleCloseRight(tab.id)}>
              Close to the Right
            </ContextMenuItem>
            <ContextMenuItem onClick={handleCloseAll}>Close All</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </SortableContext>
  )

  const addTabButton = (
    <AnimatePresence initial={false}>
      <motion.button
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md hover:bg-surface-300',
          isSqlEditor
            ? cn(SQL_EDITOR_SIDEBAR_SEARCH_ROW_HEIGHT_CLASSNAME, 'aspect-square shrink-0')
            : 'w-10 min-h-(--header-height) hover:bg-surface-100 border-b'
        )}
        onClick={() => {
          if (editor === 'sql') {
            createDraftTab()
          } else {
            void router.push(`/project/${router.query.ref}/editor/new?skip=true`)
          }
        }}
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
    </AnimatePresence>
  )

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {isSqlEditor ? (
        <div className="flex w-full min-w-0 flex-1 items-center gap-2">
          <CollapseButton
            hideTabs={false}
            hideBottomBorder
            heightClassName={SQL_EDITOR_SIDEBAR_SEARCH_ROW_HEIGHT_CLASSNAME}
          />
          <div className="z-1 flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <ToggleGroup
              type="single"
              value={activeTabValue}
              onValueChange={(value) => {
                if (value) handleTabChange(value)
              }}
              className="flex min-w-0 flex-1 flex-nowrap justify-start overflow-hidden"
            >
              {sortableTabs}
            </ToggleGroup>
            {addTabButton}
          </div>
        </div>
      ) : (
        <Tabs_Shadcn_
          className="w-full flex"
          value={activeTabValue}
          onValueChange={handleTabChange}
        >
          <CollapseButton hideTabs={false} />
          <TabsList_Shadcn_
            ref={tabsListRef}
            className={cn(
              'rounded-b-none gap-0 min-h-(--header-height) flex items-center w-full z-1',
              'bg-surface-200 dark:bg-alternative border-none text-clip overflow-x-auto'
            )}
          >
            {sortableTabs}
            {addTabButton}
            <div className="grow h-full border-b pr-6" />
          </TabsList_Shadcn_>
        </Tabs_Shadcn_>
      )}

      <DragOverlay dropAnimation={null}>
        {tabs.activeTab ? (
          <TabPreview tab={tabs.activeTab} variant={isSqlEditor ? 'toggle-group' : 'default'} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
