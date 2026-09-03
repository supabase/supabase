import { useCallback, useEffect, useRef, useState } from 'react'

import {
  DEFAULT_MOCK_ELICITATION_REQUEST_KEY,
  MOCK_ELICITATION_REQUESTS,
  MOCK_SIGNED_IN_ACCOUNT,
} from './McpElicitation.mocks'
import type { ElicitationParams } from './McpElicitation.params'
import type { ElicitationRequest, ElicitationState } from './McpElicitation.types'

/**
 * Resolves the handoff into an `ElicitationState`.
 *
 * This is the only seam that knows the data is mocked. When the handoff API
 * lands, replace the body with the real query + submit mutation; the returned
 * shape is what the components already consume.
 */

const MOCK_RESOLVE_DELAY_MS = 500
const MOCK_SAVE_DELAY_MS = 400

function resolveMockState(params: ElicitationParams): ElicitationState {
  const request: ElicitationRequest =
    MOCK_ELICITATION_REQUESTS[params.dev.request ?? DEFAULT_MOCK_ELICITATION_REQUEST_KEY]

  switch (params.dev.state) {
    case 'loading':
      return { status: 'loading' }
    case 'form':
      return { status: 'form', request }
    case 'stored':
      return { status: 'stored', request, timedOut: false }
    case 'stored-timeout':
      return { status: 'stored', request, timedOut: true }
    case 'already-stored':
      return { status: 'already-stored', request }
    case 'expired':
      return { status: 'expired' }
    case 'cancelled':
      return { status: 'cancelled' }
    case 'paused':
      return { status: 'paused' }
    case 'wrong-account':
      return { status: 'wrong-account', signedInAs: MOCK_SIGNED_IN_ACCOUNT }
  }

  // An absent handle can't be resolved into a request, and we can't tell "never
  // existed" from "already consumed" — both read as expired.
  if (params.handle === undefined) return { status: 'expired' }

  return { status: 'form', request }
}

export function useElicitationRequest(params: ElicitationParams) {
  const [state, setState] = useState<ElicitationState>({ status: 'loading' })
  const [isSaving, setIsSaving] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const { handle } = params
  const devState = params.dev.state
  const devRequest = params.dev.request

  useEffect(() => {
    const timer = setTimeout(
      () => setState(resolveMockState({ handle, dev: { state: devState, request: devRequest } })),
      MOCK_RESOLVE_DELAY_MS
    )
    return () => clearTimeout(timer)
  }, [handle, devState, devRequest])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const saveSecret = useCallback((_secret: string) => {
    setIsSaving(true)

    // The secret is deliberately dropped rather than held in state: until the
    // submit endpoint exists there is nowhere for it to legitimately go.
    saveTimer.current = setTimeout(() => {
      setIsSaving(false)
      setState((current) =>
        current.status === 'form'
          ? { status: 'stored', request: current.request, timedOut: false }
          : current
      )
    }, MOCK_SAVE_DELAY_MS)
  }, [])

  const cancelRequest = useCallback(() => setState({ status: 'cancelled' }), [])

  return { state, isSaving, saveSecret, cancelRequest }
}
