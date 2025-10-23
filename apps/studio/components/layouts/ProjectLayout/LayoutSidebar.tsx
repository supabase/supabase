import { useRouter } from 'next/router'
import { Fragment, ReactNode, useEffect } from 'react'

import { AdvisorSidebar } from 'components/interfaces/AdvisorCenter/AdvisorSidebar'
import { AIAssistant } from 'components/ui/AIAssistantPanel/AIAssistant'
import EditorPanel from 'components/ui/EditorPanel/EditorPanel'
import { advisorCenterState } from 'state/advisor-center-state'
import { editorPanelState } from 'state/editor-panel-state'
import {
  SIDEBAR_KEYS,
  SidebarKey,
  sidebarManagerState,
  useSidebarManagerSnapshot,
} from 'state/sidebar-manager-state'
import { ResizableHandle, ResizablePanel, cn } from 'ui'

// Register all sidebars at module level (runs once when module loads)
sidebarManagerState.registerSidebar(SIDEBAR_KEYS.AI_ASSISTANT, {})

sidebarManagerState.registerSidebar(SIDEBAR_KEYS.ADVISOR_CENTER, {
  onClose: () => {
    advisorCenterState.selectedItemId = undefined
  },
})

sidebarManagerState.registerSidebar(SIDEBAR_KEYS.EDITOR_PANEL, {
  onClose: () => {
    editorPanelState.reset()
  },
})

export const LayoutSidebar = () => {
  const router = useRouter()
  const sidebarSnap = useSidebarManagerSnapshot()
  const activeSidebar = sidebarSnap.activeSidebar

  // Handle URL params for deep linking
  useEffect(() => {
    if (!router.isReady) return

    const sidebarParamRaw = router.query.sidebar
    const validSidebarKeys = Object.values(SIDEBAR_KEYS) as string[]
    const sidebarParam = typeof sidebarParamRaw === 'string' ? sidebarParamRaw : null

    if (!sidebarParam || !validSidebarKeys.includes(sidebarParam)) return

    if (sidebarSnap.activeSidebar !== sidebarParam) {
      sidebarManagerState.openSidebar(sidebarParam as SidebarKey)
    }
  }, [router.isReady, router.query.sidebar, sidebarSnap.activeSidebar])

  if (!activeSidebar) return null

  let sidebarContent: ReactNode = null

  switch (activeSidebar) {
    case SIDEBAR_KEYS.AI_ASSISTANT:
      sidebarContent = <AIAssistant className="w-full h-[100dvh] md:h-full max-h-[100dvh]" />
      break
    case SIDEBAR_KEYS.ADVISOR_CENTER:
      sidebarContent = <AdvisorSidebar />
      break
    case SIDEBAR_KEYS.EDITOR_PANEL:
      sidebarContent = <EditorPanel />
      break
  }

  if (!sidebarContent) return null

  return (
    <Fragment>
      <ResizableHandle withHandle />
      <ResizablePanel
        id="panel-side"
        key={activeSidebar}
        defaultSize={30}
        minSize={30}
        maxSize={50}
        className={cn(
          'border-l bg fixed z-40 right-0 top-0 bottom-0',
          'w-screen h-[100dvh]',
          'md:absolute md:h-auto md:w-3/4',
          'xl:relative xl:border-l-0'
        )}
      >
        {sidebarContent}
      </ResizablePanel>
    </Fragment>
  )
}
