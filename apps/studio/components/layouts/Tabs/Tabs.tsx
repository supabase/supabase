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
import { Plus, X } from 'lucide-react'
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
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { editorEntityTypes, isSqlEditorTab, useTabsStateSnapshot, type Tab } from '@/state/tabs'

export const EditorTabs = () => {
  const { ref } = useParams()
  const router = useRouter()
  const { setLastVisitedSnippet, setLastVisitedTable } = useDashboardHistory()

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

  const onClearDashboardHistory = () => {
    if (editor === 'table') {
      setLastVisitedTable(undefined)
    } else if (editor === 'sql') {
      setLastVisitedSnippet(undefined)
    }
  }

  const handleClose = (tabId: string) => {
    tabs.handleTabClose({ id: tabId, router, editor, onClearDashboardHistory })
  }

  const handleCloseAll = () => {
    if (editor) {
      const tabsToClose =
        editor === 'table'
          ? tabs.openTabs.filter((x) => !isSqlEditorTab(x, tabs.tabsMap))
          : tabs.openTabs.filter((x) => isSqlEditorTab(x, tabs.tabsMap))

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
  const activeTabValue = hasNewTab ? 'new' : (tabs.activeTab ?? undefined)
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

  const newTabCloseButton = (
    <span
      role="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-200 rounded-xs cursor-pointer"
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
    </span>
  )

  const addTabButton = (
    <AnimatePresence initial={false}>
      {!hasNewTab && (
        <motion.button
          className={cn(
            'flex shrink-0 items-center justify-center rounded-md hover:bg-surface-300',
            isSqlEditor
              ? cn(SQL_EDITOR_SIDEBAR_SEARCH_ROW_HEIGHT_CLASSNAME, 'aspect-square shrink-0')
              : 'w-10 min-h-(--header-height) hover:bg-surface-100 border-b'
          )}
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
              className="flex w-max min-w-0 max-w-full flex-nowrap justify-start overflow-hidden"
            >
              {sortableTabs}
              {hasNewTab && (
                <ToggleGroupItem
                  value="new"
                  aria-label="New tab"
                  className={cn(
                    'group flex shrink-0 items-center gap-1.5 px-2 text-xs',
                    SQL_EDITOR_SIDEBAR_SEARCH_ROW_HEIGHT_CLASSNAME
                  )}
                >
                  <Plus size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                  <span>New</span>
                  {newTabCloseButton}
                </ToggleGroupItem>
              )}
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
            {hasNewTab && (
              <TabsTrigger_Shadcn_
                value="new"
                className={cn(
                  'flex items-center gap-2 px-3 text-xs',
                  'bg-dash-sidebar/50 dark:bg-surface-100/50',
                  'data-[state=active]:bg-dash-sidebar dark:data-[state=active]:bg-surface-100',
                  'relative group h-full border-t-2 border-b-0!',
                  'hover:bg-surface-300 dark:hover:bg-surface-100'
                )}
              >
                <Plus size={16} strokeWidth={1.5} className={'text-foreground-lighter'} />
                <div className="flex items-center gap-0">
                  <span>New</span>
                </div>
                {newTabCloseButton}
                <div className="absolute w-full -bottom-px left-0 right-0 h-px bg-dash-sidebar dark:bg-surface-100 opacity-0 group-data-[state=active]:opacity-100" />
              </TabsTrigger_Shadcn_>
            )}
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
