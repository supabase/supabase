import { useFeatureFlags, useFlag, useParams } from 'common'
import { useMemo } from 'react'

import { InterstitialTerminalScreen } from '../InterstitialTerminalScreen'
import { MCP_SECRETS_FLAG } from './McpSecrets.constants'
import { buildSecretsSignInPath, parseSecretsParams } from './McpSecrets.params'
import { getSecretsAnnouncement, getSecretsCopy } from './McpSecrets.utils'
import { McpSecretsCard } from './McpSecretsCard'
import { McpSecretsSkeleton } from './McpSecretsSkeleton'
import { useSecretRequest } from './useSecretRequest'
import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'

const PAUSED_STATE = { status: 'paused' } as const

export const McpSecrets = () => {
  const searchParams = useParams()
  const params = useMemo(() => parseSecretsParams(searchParams), [searchParams])

  const { hasLoaded } = useFeatureFlags()
  const isUrlModeEnabled = useFlag(MCP_SECRETS_FLAG)
  const areFlagsResolved = !IS_PLATFORM || !!hasLoaded

  const { state, isSaving, saveSecret, cancelRequest } = useSecretRequest(params)

  const handleSwitchAccount = () => {
    window.location.assign(`${BASE_PATH}${buildSecretsSignInPath(params)}`)
  }

  const resolvedState = isUrlModeEnabled ? state : PAUSED_STATE

  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {getSecretsAnnouncement(areFlagsResolved ? resolvedState : undefined)}
      </p>

      {!areFlagsResolved && <McpSecretsSkeleton />}

      {areFlagsResolved && !isUrlModeEnabled && (
        <InterstitialTerminalScreen {...getSecretsCopy(PAUSED_STATE)} />
      )}

      {areFlagsResolved && isUrlModeEnabled && (
        <McpSecretsCard
          state={state}
          isSaving={isSaving}
          onSave={saveSecret}
          onCancel={cancelRequest}
          onSwitchAccount={handleSwitchAccount}
        />
      )}
    </>
  )
}
