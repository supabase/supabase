import { useRef } from 'react'
import { AiIconAnimation } from 'ui'

import { type LogData } from '../Settings/Logs/Logs.types'
import { buildLogsPrompt, formatLogsAsJson } from '../Settings/Logs/Logs.utils'
import { ColumnSchema } from './UnifiedLogs.schema'
import { getRawLogData } from './UnifiedLogs.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import CopyButton from '@/components/ui/CopyButton'
import { Shortcut } from '@/components/ui/Shortcut'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export const LogSelectionActions = ({ rows }: { rows: ColumnSchema[] }) => {
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const track = useTrack()
  const copyButtonRef = useRef<HTMLButtonElement>(null)

  const { logsMetadata } = useIsFeatureEnabled(['logs:metadata'])
  const getSelectedRows = () =>
    rows.map((row) => ({
      ...getRawLogData(row),
      event_message: row.event_message ?? '',
      metadata: logsMetadata ? row.metadata : undefined,
    })) as LogData[]

  const handleOpenAiAssistant = () => {
    const prompt = buildLogsPrompt(getSelectedRows())
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiSnap.newChat({ initialMessage: prompt })
    track('ai_assistant_dropdown_button_clicked', { source: 'log_explorer' })
  }

  // Click the button so the shortcut shows the same copied feedback
  const handleCopyShortcut = () => copyButtonRef.current?.click()

  return (
    <div className="flex items-center gap-1">
      <Shortcut
        id={SHORTCUT_IDS.RESULTS_COPY_JSON}
        onTrigger={handleCopyShortcut}
        options={{ enabled: rows.length > 0, registerInCommandMenu: true }}
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
          asyncText={() => formatLogsAsJson(getSelectedRows())}
        />
      </Shortcut>

      <ButtonTooltip
        size="tiny"
        variant="text"
        className="px-1"
        icon={<AiIconAnimation size={16} />}
        aria-label="Explain with AI"
        tooltip={{ content: { side: 'bottom', text: 'Explain with AI' } }}
        onClick={handleOpenAiAssistant}
      />
    </div>
  )
}
