import { useBreakpoint } from 'common'
import { SqlEditor } from 'icons'
import { HelpCircle, Lightbulb } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  AiIconAnimation,
  cn,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { SIDEBAR_KEYS } from '../ProjectLayout/LayoutSidebar/LayoutSidebarProvider'

interface RailItem {
  id: string
  label: string
  icon: (props: { isActive: boolean }) => ReactNode
}

const RAIL_ITEMS: RailItem[] = [
  {
    id: SIDEBAR_KEYS.AI_ASSISTANT,
    label: 'Assistant',
    icon: ({ isActive }) => (
      <AiIconAnimation
        allowHoverEffect={false}
        size={16}
        className={cn(isActive && 'text-foreground')}
      />
    ),
  },
  {
    id: SIDEBAR_KEYS.EDITOR_PANEL,
    label: 'Editor',
    icon: () => <SqlEditor size={18} strokeWidth={1.5} />,
  },
  {
    id: SIDEBAR_KEYS.ADVISOR_PANEL,
    label: 'Advisor',
    icon: () => <Lightbulb size={16} strokeWidth={1.5} />,
  },
  {
    id: SIDEBAR_KEYS.SUPPORT_PANEL,
    label: 'Help & Support',
    icon: () => <HelpCircle size={16} strokeWidth={1.5} />,
  },
]

const RIGHT_SIDEBAR_MIN_SIZE_PERCENTAGE = 22
const RIGHT_SIDEBAR_DEFAULT_SIZE_PERCENTAGE = 34
const RIGHT_SIDEBAR_MAX_SIZE_PERCENTAGE = 55

function RightIconRail() {
  const { activeSidebar, toggleSidebar } = useSidebarManagerSnapshot()

  return (
    <aside className="bg-dash-sidebar text-foreground-lighter border-default flex w-10 shrink-0 border-l">
      <nav className="flex flex-1 flex-col items-center justify-center gap-2 py-2 pt-3">
        {RAIL_ITEMS.map((item) => {
          const isActive = activeSidebar?.id === item.id

          return (
            <Tooltip>
              <TooltipTrigger>
                <button
                  key={item.id}
                  type="button"
                  aria-label={item.label}
                  aria-pressed={isActive}
                  onClick={() => toggleSidebar(item.id)}
                  className={cn(
                    'inline-flex size-8 items-center justify-center rounded-md transition-colors',
                    isActive
                      ? 'bg-foreground text-background [&_svg]:text-background'
                      : 'hover:bg-surface-200 hover:text-foreground'
                  )}
                >
                  {item.icon({ isActive })}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">{item.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    </aside>
  )
}

function RightSidebarPanel() {
  const { activeSidebar } = useSidebarManagerSnapshot()

  if (!activeSidebar?.component) return null

  return (
    <aside className="bg-background border-default flex h-full min-h-0 w-full flex-col overflow-hidden border-l">
      {activeSidebar.component()}
    </aside>
  )
}

export function RightRailLayout({ children }: { children: ReactNode }) {
  const isMobile = useBreakpoint('md')
  const { activeSidebar } = useSidebarManagerSnapshot()
  const showRightSidebar = !isMobile && activeSidebar?.component !== undefined

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {showRightSidebar ? (
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="default-layout-v2-right-sidebar"
          className="min-h-0 min-w-0 flex-1 overflow-hidden"
        >
          <ResizablePanel
            id="panel-v2-right-main-content"
            order={1}
            minSize={100 - RIGHT_SIDEBAR_MAX_SIZE_PERCENTAGE}
            maxSize={100 - RIGHT_SIDEBAR_MIN_SIZE_PERCENTAGE}
            defaultSize={100 - RIGHT_SIDEBAR_DEFAULT_SIZE_PERCENTAGE}
            className="h-full min-h-0 min-w-0 overflow-hidden"
          >
            <div className="min-h-0 min-w-0 h-full">{children}</div>
          </ResizablePanel>
          <ResizableHandle withHandle className="hidden md:flex bg-background" />
          <ResizablePanel
            id="panel-v2-right-sidebar"
            order={2}
            minSize={RIGHT_SIDEBAR_MIN_SIZE_PERCENTAGE}
            maxSize={RIGHT_SIDEBAR_MAX_SIZE_PERCENTAGE}
            defaultSize={RIGHT_SIDEBAR_DEFAULT_SIZE_PERCENTAGE}
            className="h-full min-h-0 overflow-hidden bg-background"
          >
            <RightSidebarPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      )}

      <div className="hidden md:flex md:shrink-0">
        <RightIconRail />
      </div>
    </div>
  )
}
