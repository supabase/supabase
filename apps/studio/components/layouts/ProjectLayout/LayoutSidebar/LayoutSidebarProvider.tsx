import { useRegisterSidebar } from 'state/sidebar-manager-state'
import { AIAssistant } from 'components/ui/AIAssistantPanel/AIAssistant'
import { PropsWithChildren } from 'react'

export const SIDEBAR_KEYS = {
  AI_ASSISTANT: 'ai-assistant',
} as const

export const LayoutSidebarProvider = ({ children }: PropsWithChildren) => {
  // Register all sidebar components
  useRegisterSidebar(SIDEBAR_KEYS.AI_ASSISTANT, () => <AIAssistant />, {}, 'i')

  return <>{children}</>
}
