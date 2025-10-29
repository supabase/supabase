import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'
import { useRegisterSidebar, useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { AIAssistant } from 'components/ui/AIAssistantPanel/AIAssistant'
import { EditorPanel } from 'components/ui/EditorPanel/EditorPanel'

export const SIDEBAR_KEYS = {
  AI_ASSISTANT: 'ai-assistant',
  EDITOR_PANEL: 'editor-panel',
} as const

export const LayoutSidebarProvider = ({ children }: PropsWithChildren) => {
  useRegisterSidebar(SIDEBAR_KEYS.AI_ASSISTANT, () => <AIAssistant />, {}, 'i')
  useRegisterSidebar(SIDEBAR_KEYS.EDITOR_PANEL, () => <EditorPanel />, {}, 'e')

  const router = useRouter()
  const { openSidebar } = useSidebarManagerSnapshot()

  // Handle sidebar URL parameter
  useEffect(() => {
    if (!router.isReady) return

    const sidebarParam = router.query.sidebar
    if (typeof sidebarParam === 'string') {
      openSidebar(sidebarParam)
    }
  }, [router.isReady, router.query.sidebar, openSidebar])

  return <>{children}</>
}
