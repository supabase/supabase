import { useFeatureFlags, useFlag, useParams } from 'common'
import { useMemo } from 'react'

import { MCP_ELICITATION_FLAG } from './McpElicitation.constants'
import { buildElicitationSignInPath, parseElicitationParams } from './McpElicitation.params'
import { McpElicitationCard } from './McpElicitationCard'
import { McpElicitationOutcome } from './McpElicitationOutcome'
import { McpElicitationSkeleton } from './McpElicitationSkeleton'
import { useElicitationRequest } from './useElicitationRequest'
import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'

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

  if (!areFlagsResolved) return <McpElicitationSkeleton />

  if (!isUrlModeEnabled) return <McpElicitationOutcome state={{ status: 'paused' }} />

  return (
    <McpElicitationCard
      state={state}
      isSaving={isSaving}
      onSave={saveSecret}
      onCancel={cancelRequest}
      onSwitchAccount={handleSwitchAccount}
    />
  )
}
