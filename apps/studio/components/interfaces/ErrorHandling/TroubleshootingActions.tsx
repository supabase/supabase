'use client'

import { useState, type ReactNode } from 'react'
import type { ErrorDisplayStep } from 'ui-patterns/ErrorDisplay'

import { RestartProjectDialog } from './RestartProjectDialog'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

/**
 * Split dropdown that opens the in-app assistant, with Ask ChatGPT / Ask Claude /
 * Copy prompt behind the chevron. A plain `ErrorDisplayStep` action can't express
 * this, so it goes through the step's `render` escape hatch.
 */
export function DebugWithAIAction({
  errorType,
  buildPrompt,
  block,
}: {
  errorType: string
  buildPrompt: () => string
  block?: boolean
}) {
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

/** Restart step plus the dialog it opens. Return the overlay from `TroubleshootingContent`. */
export function useRestartStep(errorType: string): { step: ErrorDisplayStep; overlay: ReactNode } {
  const track = useTrack()
  const [visible, setVisible] = useState(false)

  return {
    step: {
      id: 'restart',
      title: 'Try restarting your project',
      description: 'Restarting can clear timeout errors and stale connections.',
      action: {
        label: 'Restart project',
        onClick: () => {
          track('inline_error_troubleshooter_action_clicked', { errorType, ctaType: 'restart_db' })
          setVisible(true)
        },
      },
    },
    overlay: (
      <RestartProjectDialog
        visible={visible}
        onClose={() => setVisible(false)}
        restartType="database"
      />
    ),
  }
}
