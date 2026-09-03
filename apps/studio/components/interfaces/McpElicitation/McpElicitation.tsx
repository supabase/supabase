import { useFeatureFlags, useFlag, useParams } from 'common'
import { useMemo } from 'react'

import { MCP_ELICITATION_FLAG } from './McpElicitation.constants'
import { buildElicitationReturnTo, parseElicitationParams } from './McpElicitation.params'
import { McpElicitationCard } from './McpElicitationCard'
import { McpElicitationOutcome } from './McpElicitationOutcome'
import { McpElicitationSkeleton } from './McpElicitationSkeleton'
import { useElicitationRequest } from './useElicitationRequest'
import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'

/**
 * URL-mode handoff for MCP elicitations: an AI client asks for a secret, hands
 * the user a link to this page, and picks the result up on its next retry. This
 * page cannot talk back to the client, so every state ends in an instruction the
 * user can act on themselves.
 *
 * Auth seam: this pass assumes a session exists. When auth lands, an
 * unauthenticated visitor should be sent to `/sign-in` with
 * `returnTo={buildElicitationReturnTo(params.handle)}` so the handle survives
 * the round trip.
 */
export const McpElicitation = () => {
  const searchParams = useParams()
  const params = useMemo(() => parseElicitationParams(searchParams), [searchParams])

  const { hasLoaded } = useFeatureFlags()
  const isUrlModeEnabled = useFlag(MCP_ELICITATION_FLAG)
  // ConfigCat only loads on platform, so self-hosted would otherwise sit on the
  // skeleton forever waiting for a value that never arrives.
  const areFlagsResolved = !IS_PLATFORM || !!hasLoaded

  const { state, isSaving, saveSecret, cancelRequest } = useElicitationRequest(params)

  const handleSwitchAccount = () => {
    const returnTo = encodeURIComponent(buildElicitationReturnTo(params.handle))
    window.location.assign(`${BASE_PATH}/sign-in?returnTo=${returnTo}`)
  }

  if (!areFlagsResolved) return <McpElicitationSkeleton />

  // Kill switch. Deliberately a real screen rather than a 404: a handoff that
  // was already open when the flag flipped still needs somewhere to land.
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
