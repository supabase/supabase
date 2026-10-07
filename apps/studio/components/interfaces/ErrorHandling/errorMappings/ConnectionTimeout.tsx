'use client'

import { useState } from 'react'

import type { TroubleshootingContent } from '../error-mappings'
import { RestartProjectDialog } from '../RestartProjectDialog'
import { DebugWithAIAction } from '../TroubleshootingActions'
import { DOCS_URL } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

const ERROR_TYPE = 'connection-timeout'

const GUIDE_HREF = `${DOCS_URL}/guides/troubleshooting/failed-to-run-sql-query-connection-terminated-due-to-connection-timeout`

const BUILD_PROMPT = () =>
  `The user is encountering connection timeout errors. The error message is: "CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT". What are the most likely causes of this issue and how can the user resolve it?`

export function useConnectionTimeoutTroubleshooting(): TroubleshootingContent {
  const track = useTrack()
  const [showRestartDialog, setShowRestartDialog] = useState(false)

  return {
    errorType: ERROR_TYPE,
    steps: [
      {
        id: 'guide',
        title: 'Try our troubleshooting guide',
        description: 'Follow step-by-step instructions for diagnosing connection timeouts.',
        action: {
          label: 'View troubleshooting guide',
          href: GUIDE_HREF,
          onClick: () =>
            track('inline_error_troubleshooter_action_clicked', {
              errorType: ERROR_TYPE,
              ctaType: 'troubleshooting_guide',
            }),
        },
      },
      {
        id: 'ai',
        title: 'Debug with AI',
        description: 'Let our AI assistant help diagnose and suggest solutions.',
        action: {
          label: 'Debug with AI',
          render: ({ block }) => (
            <DebugWithAIAction errorType={ERROR_TYPE} buildPrompt={BUILD_PROMPT} block={block} />
          ),
        },
      },
      {
        id: 'restart',
        title: 'Try restarting your project',
        description: 'Restarting can clear timeout errors and stale connections.',
        action: {
          label: 'Restart project',
          onClick: () => {
            track('inline_error_troubleshooter_action_clicked', {
              errorType: ERROR_TYPE,
              ctaType: 'restart_db',
            })
            setShowRestartDialog(true)
          },
        },
      },
    ],
    overlays: (
      <RestartProjectDialog
        visible={showRestartDialog}
        onClose={() => setShowRestartDialog(false)}
        restartType="database"
      />
    ),
  }
}
