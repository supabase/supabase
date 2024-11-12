import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import {
  FileJson2,
  Table2,
  Database,
  Code2,
  Eye,
  X,
  Workflow,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import {
  cn,
  SQL_ICON,
  Tabs_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  ScrollArea,
  ScrollBar,
} from 'ui'
import { getTabsStore, type Tab, type TabType } from 'state/tabs'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRef, useEffect } from 'react'
import { sidebarState } from './sidebar-state'
import { useActionKey } from 'hooks/useActionKey'

interface TabsProps {
  storeKey: string
  onClose?: (id: string) => void
}

const getTabIcon = (type: TabType) => {
  switch (type) {
    case 'schema':
      return <Workflow size={14} strokeWidth={1.5} className="text-foreground-lighter" />
    case 'table':
      return <Table2 size={14} strokeWidth={1.5} className="text-foreground-lighter" />
    case 'view':
      return <Eye size={14} strokeWidth={1.5} className="text-foreground-lighter" />
    // case 'function':
    //   return <FunctionIcon size={14} strokeWidth={1.5} className="text-foreground-lighter" />
    case 'sql':
      return (
        <SQL_ICON
          className={cn(
            'transition-colors',
            'fill-foreground-muted',
            'group-aria-selected:fill-foreground',
            'w-4 h-4 shrink-0',
            '-ml-0.5'
          )}
          strokeWidth={1.5}
        />
      )
    default:
      return <FileJson2 size={14} strokeWidth={1.5} className="text-foreground-lighter" />
  }
}

// Sortable Tab component
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  }

  // Add logic to check for multiple schemas
  const hasMultipleSchemas = openTabs
    .filter((t) => t.type === 'table')
    .some((t) => t.metadata?.schema !== openTabs[0]?.metadata?.schema)

  // Generate the display label
  const displayLabel =
    tab.type === 'table' && hasMultipleSchemas && tab.metadata?.schema
      ? `${tab.metadata.schema}.${tab.label}`
      : tab.label

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center h-10">
      <TabsTrigger_Shadcn_
        value={tab.id}
        className="flex items-center gap-2 px-3 text-xs bg-dash-sidebar/50 dark:bg-surface-100/50 data-[state=active]:bg-dash-sidebar dark:data-[state=active]:bg-surface-100 relative group h-full border-t-2 !border-b-0 hover:bg-surface-300 dark:hover:bg-surface-100"
        {...listeners}
      >
        {getTabIcon(tab.type)}
        {displayLabel}
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tabs.openTabs.indexOf(active.id.toString())
    const newIndex = tabs.openTabs.indexOf(over.id.toString())

    const newOpenTabs = [...tabs.openTabs]
    newOpenTabs.splice(oldIndex, 1)
    newOpenTabs.splice(newIndex, 0, active.id.toString())

    store.openTabs = newOpenTabs
    store.activeTab = active.id.toString()

    const tab = tabs.tabsMap[active.id.toString()]
    if (tab) {
      handleTabChange(active.id.toString())
    }
  }

  const handleClose = (id: string) => {
    const currentTab = tabs.tabsMap[id]
    const newTabs = tabs.openTabs.filter((tabId) => tabId !== id)
    const nextTabId = newTabs[newTabs.length - 1]
    const nextTab = nextTabId ? tabs.tabsMap[nextTabId] : null

    if (nextTab) {
      switch (nextTab.type) {
        case 'sql':
          router.push(`/project/${router.query.ref}/sql/${nextTab.metadata?.sqlId}`)
          break
        case 'table':
          router.push(
            `/project/${router.query.ref}/editor/${nextTab.metadata?.tableId}?schema=${nextTab.metadata?.schema}`
          )
          break
        case 'schema':
          router.push(`/project/${router.query.ref}/explorer/schema/${nextTab.metadata?.schema}`)
          break
      }
    } else {
      router.push(`/project/${router.query.ref}/explorer`)
    }

    store.openTabs = newTabs
    store.activeTab = nextTabId ?? null
    delete store.tabsMap[id]

    onClose?.(id)
  }

  const handleTabChange = (id: string) => {
    const tab = tabs.tabsMap[id]
    if (!tab) return

    store.activeTab = id

    switch (tab.type) {
      case 'sql':
        router.push(`/project/${router.query.ref}/sql/${tab.metadata?.sqlId}`)
        break
      case 'table':
        router.push(
          `/project/${router.query.ref}/editor/${tab.metadata?.tableId}?schema=${tab.metadata?.schema}`
        )
        break
      case 'schema':
        router.push(`/project/${router.query.ref}/explorer/schema/${tab.metadata?.schema}`)
        break
      case 'view':
        router.push(
          `/project/${router.query.ref}/explorer/views/${tab.metadata?.schema}/${tab.metadata?.name}`
        )
        break
      case 'function':
        router.push(
          `/project/${router.query.ref}/explorer/functions/${tab.metadata?.schema}/${tab.metadata?.name}`
        )
        break
    }
  }

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

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={openTabs.map((tab) => tab.id)}
            strategy={horizontalListSortingStrategy}
          >
            {openTabs.map((tab, index) => (
              <SortableTab
                key={tab.id}
                tab={tab}
                index={index}
                openTabs={openTabs}
                onClose={handleClose}
              />
            ))}
          </SortableContext>
        </DndContext>
      </TabsList_Shadcn_>
    </Tabs_Shadcn_>
  )
}
