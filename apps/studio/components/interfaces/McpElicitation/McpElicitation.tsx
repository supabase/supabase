import { useFeatureFlags, useFlag, useParams } from 'common'
import { useMemo } from 'react'

import { MCP_ELICITATION_FLAG } from './McpElicitation.constants'
import { buildElicitationSignInPath, parseElicitationParams } from './McpElicitation.params'
import { getElicitationAnnouncement } from './McpElicitation.utils'
import { McpElicitationCard } from './McpElicitationCard'
import { McpElicitationOutcome } from './McpElicitationOutcome'
import { McpElicitationSkeleton } from './McpElicitationSkeleton'
import { useElicitationRequest } from './useElicitationRequest'
import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'

const PAUSED_STATE = { status: 'paused' } as const

export const McpElicitation = () => {
  const searchParams = useParams()
  const params = useMemo(() => parseElicitationParams(searchParams), [searchParams])

  const { hasLoaded } = useFeatureFlags()
  const isUrlModeEnabled = useFlag(MCP_ELICITATION_FLAG)
  const areFlagsResolved = !IS_PLATFORM || !!hasLoaded

  const { state, isSaving, saveSecret, cancelRequest } = useElicitationRequest(params)

  const handleSwitchAccount = () => {
    window.location.assign(`${BASE_PATH}${buildElicitationSignInPath(params)}`)
  }

  const resolvedState = isUrlModeEnabled ? state : PAUSED_STATE

  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {getElicitationAnnouncement(areFlagsResolved ? resolvedState : undefined)}
      </p>

      {!areFlagsResolved && <McpElicitationSkeleton />}

      {areFlagsResolved && !isUrlModeEnabled && <McpElicitationOutcome state={PAUSED_STATE} />}

      {areFlagsResolved && isUrlModeEnabled && (
        <McpElicitationCard
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
