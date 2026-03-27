'use client'

import { MobileSheetProvider } from 'components/layouts/Navigation/NavigationBar/MobileSheetContext'
import { LayoutSidebar } from 'components/layouts/ProjectLayout/LayoutSidebar'
import { PanelLeftOpen, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Button,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  SidebarProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { ConnectSheet } from 'components/interfaces/ConnectSheet/ConnectSheet'

import { LeftActivityBar } from './ActivityBar'
import { BrowserPanel } from './BrowserPanel'
import { EditorFrame } from './EditorFrame'
import { RightActivityBar } from './RightActivityBar'
import { TopBar } from './TopBar'
import { V2LayoutSidebarProvider } from './V2LayoutSidebarProvider'
import { useV2Params } from '@/app/v2/V2ParamsContext'
import { V2DashboardProvider } from '@/stores/v2-dashboard'

const BROWSER_COLLAPSED_STORAGE_KEY = 'v2-browser-panel-collapsed'

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isData = Boolean(pathname?.includes('/data/') || pathname?.endsWith('/data'))
  const { projectRef } = useV2Params()
  const [isBrowserCollapsed, setIsBrowserCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(BROWSER_COLLAPSED_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(BROWSER_COLLAPSED_STORAGE_KEY, String(isBrowserCollapsed))
    } catch {
      // Ignore localStorage write failures
    }
  }, [isBrowserCollapsed])

  const isHomeActive =
    Boolean(projectRef) &&
    pathname?.endsWith(`/${projectRef}`) &&
    !pathname?.includes('/data') &&
    !pathname?.includes('/obs/') &&
    !pathname?.includes('/settings/')

  // Home hides the browser panel; all other activities show it
  const hideBrowser = isHomeActive
  const showCollapsed = !hideBrowser && isBrowserCollapsed
  const showExpanded = !hideBrowser && !isBrowserCollapsed

  return (
    <V2DashboardProvider projectRef={projectRef ?? null}>
      <SidebarProvider defaultOpen={false}>
        <MobileSheetProvider>
          <V2LayoutSidebarProvider>
            <div className="flex flex-col h-screen w-screen bg-dash-sidebar text-foreground">
              <TopBar />
              <div className="flex flex-1 min-h-0">
                <LeftActivityBar />

                {/* Collapsed browser strip — narrow column with expand button */}
                {showCollapsed && (
                  <div className="flex flex-col items-center w-9 shrink-0 border-r border-border bg-dash-sidebar pt-1.5 gap-1">
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setIsBrowserCollapsed(false)}
                          className="flex items-center justify-center w-7 h-7 rounded text-foreground-lighter hover:text-foreground hover:bg-sidebar-accent"
                          aria-label="Expand panel"
                        >
                          <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs px-2">
                        Expand panel
                      </TooltipContent>
                    </Tooltip>
                    {isData && (
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger className="flex flex-col gap-2">
                          <Button
                            type="default"
                            size="tiny"
                            className="px-0 aspect-square"
                            icon={<Plus className="h-3 w-3" strokeWidth={1.5} />}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs px-2">
                          Add module
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}

                <ResizablePanelGroup
                  orientation="horizontal"
                  className="h-full w-full overflow-x-hidden flex-1 flex flex-row gap-0"
                  autoSaveId={
                    hideBrowser
                      ? 'v2-shell-wide'
                      : isBrowserCollapsed
                        ? 'v2-shell-collapsed'
                        : 'v2-shell-content'
                  }
                >
                  {showExpanded && (
                    <>
                      <ResizablePanel
                        id="panel-browser"
                        minSize={160}
                        maxSize={400}
                        defaultSize={'240px'}
                      >
                        <BrowserPanel onCollapse={() => setIsBrowserCollapsed(true)} />
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                    </>
                  )}
                  <ResizablePanel id="panel-content">
                    <main className="flex-1 min-w-0 flex flex-col overflow-hidden h-full">
                      <EditorFrame>{children}</EditorFrame>
                    </main>
                  </ResizablePanel>
                  <LayoutSidebar minSize={300} maxSize={500} defaultSize={340} />
                </ResizablePanelGroup>

                <RightActivityBar />
              </div>
            </div>
          </V2LayoutSidebarProvider>
        </MobileSheetProvider>
      </SidebarProvider>
      <ConnectSheet />
    </V2DashboardProvider>
  )
}
