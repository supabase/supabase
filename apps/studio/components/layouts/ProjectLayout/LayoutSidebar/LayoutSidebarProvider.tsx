import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'
import { useRegisterSidebar, useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { AIAssistant } from 'components/ui/AIAssistantPanel/AIAssistant'

export const SIDEBAR_KEYS = {
  AI_ASSISTANT: 'ai-assistant',
} as const

export const LayoutSidebarProvider = ({ children }: PropsWithChildren) => {
  useRegisterSidebar(SIDEBAR_KEYS.AI_ASSISTANT, () => <AIAssistant />, {}, 'i')

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
