import { Fragment, ReactNode } from 'react'

import { AdvisorSidebar } from 'components/interfaces/AdvisorCenter/AdvisorSidebar'
import { AIAssistant } from 'components/ui/AIAssistantPanel/AIAssistant'
import EditorPanel from 'components/ui/EditorPanel/EditorPanel'
import {
  SIDEBAR_KEYS,
  SidebarKey,
  useSidebarManagerSnapshot,
} from 'state/sidebar-manager-state'
import { ResizableHandle, ResizablePanel, cn } from 'ui'

type LayoutSidebarProps = {
  isClient: boolean
}

export const LayoutSidebar = ({ isClient }: LayoutSidebarProps) => {
  const sidebarSnap = useSidebarManagerSnapshot()
  const activeSidebar = isClient ? sidebarSnap.activeSidebar : undefined

  if (!isClient || !activeSidebar) return null

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
