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

  const router = useRouter()
  const { sidebars } = useSidebarManagerSnapshot()
  const appliedUrlSidebarRef = useRef<string | null>(null)
  const sidebarParamRaw = router.query.sidebar
  const sidebarParam = useMemo(
    () => (typeof sidebarParamRaw === 'string' ? sidebarParamRaw : null),
    [sidebarParamRaw]
  )
  const registeredSidebar = sidebarParam ? sidebars[sidebarParam] : undefined

  useEffect(() => {
    if (!router.isReady) return

    if (!sidebarParam) {
      appliedUrlSidebarRef.current = null
      return
    }

    if (!registeredSidebar) return
    if (appliedUrlSidebarRef.current === sidebarParam) return

    sidebarManagerState.openSidebar(sidebarParam)
    appliedUrlSidebarRef.current = sidebarParam
  }, [router.isReady, sidebarParam, registeredSidebar])

  return <>{children}</>
}
