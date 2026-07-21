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
import { useState } from 'react'
import {
  cn,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
} from 'ui'

import { useEditorType } from '../editors/EditorsLayout.hooks'
import { CollapseButton } from './CollapseButton'
import { SortableTab } from './SortableTab'
import { TabPreview } from './TabPreview'
import { useTabsScroll } from './Tabs.utils'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import {
  editorEntityTypes,
  useTabsStateSnapshot,
  type Tab,
  type TabCloseConfirmation,
} from '@/state/tabs'

export const EditorTabs = () => {
  const { ref, id } = useParams()
  const router = useRouter()
  const { setLastVisitedSnippet, setLastVisitedTable } = useDashboardHistory()

  const editor = useEditorType()
  const tabs = useTabsStateSnapshot()
  const [pendingClose, setPendingClose] = useState<(() => void) | null>(null)
  const [pendingConfirmation, setPendingConfirmation] = useState<TabCloseConfirmation | null>(null)
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

  // Runs `performClose` immediately unless one of the tabs' registered close
  // handlers asks to confirm first (e.g. a SQL snippet with unsaved edits), in
  // which case a confirmation dialog is shown and `performClose` only runs if
  // the user confirms. The layout stays agnostic of per-type close semantics.
  const closeWithConfirmation = (tabIdsToClose: string[], performClose: () => void) => {
    const confirmation = tabs.getCloseConfirmation(tabIdsToClose)
    if (confirmation) {
      setPendingConfirmation(confirmation)
      setPendingClose(() => performClose)
    } else {
      performClose()
    }
  }

  const handleClose = (tabId: string) => {
    closeWithConfirmation([tabId], () => {
      tabs.handleTabClose({ id: tabId, router, editor, onClearDashboardHistory })
    })
  }

  const handleCloseAll = () => {
    if (editor) {
      const tabsToClose =
        editor === 'table'
          ? tabs.openTabs.filter((x) => !x.startsWith('sql'))
          : tabs.openTabs.filter((x) => x.startsWith('sql'))

      closeWithConfirmation(tabsToClose, () => {
        tabs.closeTabs(tabsToClose)
        onClearDashboardHistory()
        router.push(`/project/${ref}/${editor === 'table' ? 'editor' : 'sql'}`)
      })
    }
  }

  const handleCloseOthers = (tabId: string) => {
    if (editor) {
      const tabsToClose =
        editor === 'table'
          ? tabs.openTabs.filter((x) => !x.startsWith('sql') && x !== tabId)
          : tabs.openTabs.filter((x) => x.startsWith('sql') && x !== tabId)

      closeWithConfirmation(tabsToClose, () => {
        tabs.closeTabs(tabsToClose)
        onClearDashboardHistory()

        const entityId = editor === 'table' ? tabId.split('-')[1] : tabId.split('sql-')[1]
        if (id !== entityId) {
          router.push(`/project/${ref}/${editor === 'table' ? 'editor' : 'sql'}/${entityId}`)
        }
      })
    }
  }

  const handleCloseRight = (tabId: string) => {
    if (editor) {
      const openedTabs =
        editor === 'table'
          ? tabs.openTabs.filter((x) => !x.startsWith('sql'))
          : tabs.openTabs.filter((x) => x.startsWith('sql'))
      const tabIdx = openedTabs.indexOf(tabId)
      const activeTabIdx = openedTabs.indexOf(tabs.activeTab!)
      const tabsToClose = openedTabs.slice(tabIdx + 1)

      closeWithConfirmation(tabsToClose, () => {
        tabs.closeTabs(tabsToClose)

        const isActiveTabClosed = tabIdx < activeTabIdx
        if (isActiveTabClosed) {
          const id = editor === 'table' ? tabId.split('-')[1] : tabId.split('sql-')[1]
          router.push(`/project/${ref}/${editor === 'table' ? 'editor' : 'sql'}/${id}`)
        }
      })
    }
  }

  const handleTabChange = (id: string) => {
    tabs.handleTabNavigation(id, router)
  }

  const { tabsListRef } = useTabsScroll({ activeTab: tabs.activeTab, tabCount: editorTabs.length })

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <Tabs
          className="w-full flex"
          value={hasNewTab ? 'new' : (tabs.activeTab ?? undefined)}
          onValueChange={handleTabChange}
        >
          <CollapseButton hideTabs={false} />
          <TabsList
            ref={tabsListRef}
            className={cn(
              'rounded-b-none gap-0 min-h-(--header-height) flex items-center w-full z-1',
              'bg-surface-200 dark:bg-alternative border-none text-clip overflow-x-auto'
            )}
          >
            <SortableContext
              items={editorTabs.map((tab) => tab.id)}
              strategy={horizontalListSortingStrategy}
            >
              {editorTabs.map((tab, index) => (
                <ContextMenu key={tab.id}>
                  <ContextMenuTrigger>
                    <SortableTab
                      key={tab.id}
                      tab={tab}
                      index={index}
                      openTabs={openTabs}
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

            {/* Non-draggable new tab */}
            {hasNewTab && (
              <div className="group/new-tab relative flex h-full items-center">
                <TabsTrigger
                  value="new"
                  onKeyDown={(e) => {
                    if (e.key !== 'Delete' && e.key !== 'Backspace') return
                    e.preventDefault()
                    e.stopPropagation()
                    handleClose('new')
                  }}
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
                  {/* Reserve close-icon width; close is a sibling overlay. */}
                  <span className="ml-1 inline-flex size-3 shrink-0" aria-hidden />
                  <div className="absolute w-full -bottom-px left-0 right-0 h-px bg-dash-sidebar dark:bg-surface-100 opacity-0 group-data-[state=active]:opacity-100" />
                </TabsTrigger>
                <button
                  type="button"
                  tabIndex={0}
                  aria-label="Close new tab"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleClose('new')
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  className={cn(
                    'absolute top-1/2 right-3 z-10 flex -translate-y-1/2 items-center justify-center rounded-xs',
                    'opacity-0 group-hover/new-tab:opacity-100 group-focus-within/new-tab:opacity-100 focus-visible:opacity-100',
                    'hover:bg-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    'cursor-pointer'
                  )}
                >
                  <X size={12} className="text-foreground-light" />
                </button>
              </div>
            )}

            <AnimatePresence initial={false}>
              {!hasNewTab && (
                <motion.button
                  className="flex items-center justify-center w-10 min-h-(--header-height) hover:bg-surface-100 shrink-0 border-b"
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
          </TabsList>
        </Tabs>

        <DragOverlay dropAnimation={null}>
          {tabs.activeTab ? <TabPreview tab={tabs.activeTab} /> : null}
        </DragOverlay>
      </DndContext>

      <DiscardChangesConfirmationDialog
        visible={pendingClose !== null}
        onClose={() => {
          pendingClose?.()
          setPendingClose(null)
          setPendingConfirmation(null)
        }}
        onCancel={() => {
          setPendingClose(null)
          setPendingConfirmation(null)
        }}
        title={pendingConfirmation?.title ?? 'Unsaved changes'}
        description={pendingConfirmation?.description}
      />
    </>
  )
}
