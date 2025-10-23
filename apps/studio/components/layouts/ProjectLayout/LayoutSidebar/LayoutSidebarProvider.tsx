import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useRef } from 'react'
import {
  sidebarManagerState,
  useRegisterSidebar,
  useSidebarManagerSnapshot,
} from 'state/sidebar-manager-state'
import { AIAssistant } from 'components/ui/AIAssistantPanel/AIAssistant'

export const SIDEBAR_KEYS = {
  AI_ASSISTANT: 'ai-assistant',
} as const

export const LayoutSidebarProvider = ({ children }: PropsWithChildren) => {
  useRegisterSidebar(SIDEBAR_KEYS.AI_ASSISTANT, () => <AIAssistant />, {}, 'i')

  const router = useRouter()
  const { sidebars } = useSidebarManagerSnapshot()
  const appliedUrlSidebarRef = useRef<string | null>(null)

  useEffect(() => {
    if (!router.isReady) return

    const sidebarParamRaw = router.query.sidebar
    const sidebarParam = typeof sidebarParamRaw === 'string' ? sidebarParamRaw : null

    if (!sidebarParam) {
      appliedUrlSidebarRef.current = null
      return
    }

    if (!sidebars[sidebarParam]) return
    if (appliedUrlSidebarRef.current === sidebarParam) return

    sidebarManagerState.openSidebar(sidebarParam)
    appliedUrlSidebarRef.current = sidebarParam
  }, [router.isReady, router.query.sidebar, sidebars])

  return <>{children}</>
}
