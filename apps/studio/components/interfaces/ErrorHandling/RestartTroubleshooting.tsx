'use client'

import { useState } from 'react'

import type { TroubleshootingContent } from './error-mappings'
import { RestartProjectDialog } from './RestartProjectDialog'
import { useTrack } from '@/lib/telemetry/track'

const ERROR_TYPE = 'unknown'

/** Troubleshooting for errors with no mapping of their own: offer a restart and nothing else. */
export function useRestartTroubleshooting(): TroubleshootingContent {
  const track = useTrack()
  const [showRestartDialog, setShowRestartDialog] = useState(false)

  return {
    errorType: ERROR_TYPE,
    steps: [
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
