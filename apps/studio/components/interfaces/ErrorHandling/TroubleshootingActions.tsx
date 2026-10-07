'use client'

import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

interface DebugWithAIActionProps {
  errorType: string
  buildPrompt: () => string
  block?: boolean
}

/**
 * Split dropdown that opens the in-app assistant, with Ask ChatGPT / Ask Claude /
 * Copy prompt behind the chevron. A plain `ErrorDisplayStep` action can't express
 * this, so it goes through the step's `render` escape hatch.
 */
export function DebugWithAIAction({ errorType, buildPrompt, block }: DebugWithAIActionProps) {
  const track = useTrack()
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()

  return (
    <AiAssistantDropdown
      label="Debug with AI"
      size="tiny"
      className={block ? 'w-full' : undefined}
      buildPrompt={buildPrompt}
      onOpenAssistant={() => {
        track('inline_error_troubleshooter_action_clicked', { errorType, ctaType: 'ask_ai' })
        openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
        aiSnap.newChat({ initialMessage: buildPrompt() })
      }}
    />
  )
}
