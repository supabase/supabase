import { useBreakpoint, useParams } from 'common'
import { useEffect, type ReactNode } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'

import { useMobileSheet } from '../Navigation/NavigationBar/MobileSheetContext'
import { isSidebarId } from '../ProjectLayout/LayoutSidebar'
import { generateToolbarItems } from './RightPanelToolbar.utils'
import { ToolbarButton } from './ToolbarButton'
import { IS_PLATFORM } from '@/lib/constants'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

const RIGHT_SIDEBAR_MIN_SIZE_PERCENTAGE = 300
const RIGHT_SIDEBAR_DEFAULT_SIZE_PERCENTAGE = 340
const RIGHT_SIDEBAR_MAX_SIZE_PERCENTAGE = 750

function RightPanelToolbar() {
  const { ref: projectRef } = useParams()
  const { activeSidebar } = useSidebarManagerSnapshot()

  const isMobile = useBreakpoint('md')
  const { content: sheetContent, setContent: setMobileSheetContent } = useMobileSheet()

  const toolbarItems = generateToolbarItems({
    projectRef,
    isPlatform: IS_PLATFORM,
  }).filter((item) => item.enabled)

  const helpItem = toolbarItems.find((item) => item.key === 'help')
  const primaryToolbarItems = toolbarItems.filter((item) => item.key !== 'help')

  useEffect(() => {
    if (!isMobile) {
      setMobileSheetContent(null)
      return
    }
    if (activeSidebar?.component) {
      setMobileSheetContent(activeSidebar.id)
    } else if (isSidebarId(sheetContent)) {
      setMobileSheetContent(null)
    }
  }, [isMobile, activeSidebar, sheetContent, setMobileSheetContent])

  return (
    <aside className="bg-dash-sidebar text-foreground-lighter border-default flex w-10 shrink-0 border-l">
      <nav className="flex min-h-0 flex-1 flex-col items-center justify-start gap-1 p-1">
        <div className="flex w-full flex-col items-center gap-1">
          {primaryToolbarItems.map((item) => (
            <ToolbarButton key={item.key} {...item.config} />
          ))}
        </div>
        {helpItem ? (
          <div className="mt-auto flex w-full flex-col items-center pt-2">
            <ToolbarButton key={helpItem.key} {...helpItem.config} />
          </div>
        ) : null}
      </nav>
    </aside>
  )
}

function RightSidebarPanel() {
  const { activeSidebar } = useSidebarManagerSnapshot()

  if (!activeSidebar?.component) return null

  return (
    <aside className="bg-background border-default flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-l">
      {activeSidebar.component()}
    </aside>
  )
}

export function RightPanelToolbarLayout({ children }: { children: ReactNode }) {
  const isMobile = useBreakpoint('md')
  const { activeSidebar } = useSidebarManagerSnapshot()
  const showRightSidebar = activeSidebar?.component !== undefined

  const main = <div className="h-full min-h-0 min-w-0 overflow-hidden">{children}</div>

  if (isMobile) {
    return <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{main}</div>
  }

  if (showRightSidebar) {
    return (
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ResizablePanelGroup
          orientation="horizontal"
          autoSaveId="default-layout-v2-right-sidebar"
          className="min-h-0 min-w-0 flex-1 overflow-hidden"
        >
          <ResizablePanel
            id="panel-v2-right-main-content"
            className="min-h-0 min-w-0 overflow-hidden"
          >
            {main}
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-background" />
          <ResizablePanel
            id="panel-v2-right-sidebar"
            minSize={RIGHT_SIDEBAR_MIN_SIZE_PERCENTAGE}
            maxSize={RIGHT_SIDEBAR_MAX_SIZE_PERCENTAGE}
            defaultSize={RIGHT_SIDEBAR_DEFAULT_SIZE_PERCENTAGE}
            className="flex min-h-0 overflow-hidden bg-background"
          >
            <div className="flex h-full min-h-0 w-full min-w-0">
              <RightSidebarPanel />
              <RightPanelToolbar />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-h-0 min-w-0 flex-1">{main}</div>
      <div className="hidden shrink-0 md:flex">
        <RightPanelToolbar />
      </div>
    </div>
  )
}
