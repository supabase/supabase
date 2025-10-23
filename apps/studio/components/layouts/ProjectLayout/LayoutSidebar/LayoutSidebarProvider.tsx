import { useRouter } from 'next/router'
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef } from 'react'
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
  const assistantComponent = useCallback(() => <AIAssistant />, [])
  useRegisterSidebar(SIDEBAR_KEYS.AI_ASSISTANT, assistantComponent, {}, 'i')

  const { sidebars } = useSidebarManagerSnapshot()

  // Set sidebar state initially based on URL query param
  const router = useRouter()
  const sidebarParamRaw = router.query.sidebar
  const sidebarParam = useMemo(
    () => (typeof sidebarParamRaw === 'string' ? sidebarParamRaw : null),
    [sidebarParamRaw]
  )

  useEffect(() => {
    if (!router.isReady) return

    if (!sidebarParam) {
      return
    }
    const registeredSidebar = sidebars[sidebarParam]

    if (!registeredSidebar) return

    sidebarManagerState.openSidebar(sidebarParam)
  }, [router.isReady, sidebarParam])

  return <>{children}</>
}
