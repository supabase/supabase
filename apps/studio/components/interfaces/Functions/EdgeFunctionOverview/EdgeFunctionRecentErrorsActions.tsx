import { AiIconAnimation } from 'ui'

import { buildLogsPrompt } from '@/components/interfaces/Settings/Logs/Logs.utils'
import { parseSelectedLogs } from '@/components/interfaces/UnifiedLogs/LogSelectionActions.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import CopyButton from '@/components/ui/CopyButton'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

interface EdgeFunctionRecentErrorsActionsProps {
  /** The errors shown in the preview */
  rows: unknown[]
  /** Matching errors beyond the preview, noted in the prompt */
  omittedCount: number
}

/**
 * Hands the previewed errors to an AI tool: the same prompt the Logs page builds for selected
 * logs, noting how many more errors the preview leaves out.
 */
export const EdgeFunctionRecentErrorsActions = ({
  rows,
  omittedCount,
}: EdgeFunctionRecentErrorsActionsProps) => {
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const track = useTrack()

  const { logsMetadata } = useIsFeatureEnabled(['logs:metadata'])
  const selectedLogs = parseSelectedLogs(rows, logsMetadata)
  if (!selectedLogs.success || selectedLogs.data.length === 0) return null

  const prompt = buildLogsPrompt(selectedLogs.data, { queryType: 'functions', omittedCount })

  const handleOpenAssistant = () => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiSnap.newChat({ initialMessage: prompt })
    track('ai_assistant_dropdown_button_clicked', { source: 'edge_function_errors' })
  }

  return (
    <>
      <ButtonTooltip
        size="tiny"
        variant="default"
        className="px-1.5"
        icon={<AiIconAnimation size={14} />}
        aria-label="Explain with AI"
        tooltip={{ content: { side: 'bottom', text: 'Explain with AI' } }}
        onClick={handleOpenAssistant}
      />
      <CopyButton
        size="tiny"
        variant="default"
        text={prompt}
        copyLabel="Copy summary"
        onClick={() => track('ai_prompt_copied', { source: 'edge_function_errors' })}
      />
    </>
  )
}
