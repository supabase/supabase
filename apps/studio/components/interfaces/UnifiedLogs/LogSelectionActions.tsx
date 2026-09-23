import { useRef } from 'react'
import { AiIconAnimation } from 'ui'

import { buildLogsPrompt, formatLogsAsJson } from '../Settings/Logs/Logs.utils'
import { parseSelectedLogs } from './LogSelectionActions.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import CopyButton from '@/components/ui/CopyButton'
import { Shortcut } from '@/components/ui/Shortcut'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export const LogSelectionActions = ({ rows }: { rows: unknown[] }) => {
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const track = useTrack()
  const copyButtonRef = useRef<HTMLButtonElement>(null)

  const { logsMetadata } = useIsFeatureEnabled(['logs:metadata'])
  const selectedLogs = parseSelectedLogs(rows, logsMetadata)
  const selectedRows = selectedLogs.success ? selectedLogs.data : []
  const hasValidSelection = selectedRows.length > 0

  const handleOpenAiAssistant = () => {
    if (!hasValidSelection) return
    const prompt = buildLogsPrompt(selectedRows)
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiSnap.newChat({ initialMessage: prompt })
    track('ai_assistant_dropdown_button_clicked', { source: 'log_explorer' })
  }

  // Click the button so the shortcut shows the same copied feedback
  const handleCopyShortcut = () => copyButtonRef.current?.click()

  return (
    <div className="flex items-center gap-1">
      {!selectedLogs.success && (
        <span role="alert" className="text-xs text-destructive">
          Selected logs contain invalid data.
        </span>
      )}
      <Shortcut
        id={SHORTCUT_IDS.RESULTS_COPY_JSON}
        onTrigger={handleCopyShortcut}
        options={{ enabled: hasValidSelection, registerInCommandMenu: true }}
        side="bottom"
        label="Copy selected logs as JSON"
      >
        <CopyButton
          ref={copyButtonRef}
          iconOnly
          size="tiny"
          variant="text"
          className="px-1"
          aria-label="Copy selected logs"
          disabled={!hasValidSelection}
          asyncText={() => formatLogsAsJson(selectedRows)}
        />
      </Shortcut>

      <ButtonTooltip
        size="tiny"
        variant="text"
        className="px-1"
        icon={<AiIconAnimation size={16} />}
        aria-label="Explain with AI"
        disabled={!hasValidSelection}
        tooltip={{ content: { side: 'bottom', text: 'Explain with AI' } }}
        onClick={handleOpenAiAssistant}
      />
    </div>
  )
}
