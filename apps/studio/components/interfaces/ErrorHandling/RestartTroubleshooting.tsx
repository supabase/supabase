'use client'

import type { TroubleshootingContent } from './error-mappings'
import { useRestartStep } from './TroubleshootingActions'

const ERROR_TYPE = 'unknown'

/** Troubleshooting for errors with no mapping of their own: offer a restart and nothing else. */
export function useRestartTroubleshooting(): TroubleshootingContent {
  const { step, overlay } = useRestartStep(ERROR_TYPE)
  return { errorType: ERROR_TYPE, steps: [step], overlays: overlay }
}
