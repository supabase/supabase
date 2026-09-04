import { useSession } from 'common'
import { useCallback, useMemo, useState } from 'react'

import { ELICITATION_TOOL_NAME } from './McpElicitation.constants'
import type { DevElicitationState, ElicitationParams } from './McpElicitation.params'
import { getProviderHint } from './McpElicitation.providers'
import type { ElicitationRequest, ElicitationState } from './McpElicitation.types'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useSecretsCreateMutation } from '@/data/secrets/secrets-create-mutation'
import { useSecretsQuery } from '@/data/secrets/secrets-query'

/**
 * Resolves the URL into an `ElicitationState`, the only shape the components
 * know about.
 *
 * v1 is stateless: the link carries the project ref and the secret name, the
 * page writes the secret the way the Edge Functions secrets page does, and the
 * tool verifies on its next turn by re-reading the secrets list. Nothing here
 * reports back to the client, and the typed value never leaves this hook's
 * arguments — it goes straight into the mutation body and is never held in
 * state, logged, or attached to an error.
 */

/** Outcomes the user drove. They win over whatever the queries say afterwards. */
type ElicitationOutcome = 'stored' | 'cancelled' | 'error'

export function useElicitationRequest(params: ElicitationParams) {
  const { ref, name } = params
  const devState = params.dev.state

  const session = useSession()
  const account = session?.user?.email ?? ''

  const [outcome, setOutcome] = useState<ElicitationOutcome | undefined>(undefined)

  // Both params are needed to resolve anything, and we can't tell a link that
  // was never valid from one whose project has gone away — both read as expired.
  const isLinkResolvable = ref !== undefined && name !== undefined

  const project = useProjectDetailQuery({ ref }, { enabled: isLinkResolvable })
  // Best effort: this only drives the overwrite warning, so a reader without
  // permission still gets the form rather than a dead end.
  const secrets = useSecretsQuery({ projectRef: ref }, { enabled: isLinkResolvable })

  const { mutate, isPending: isSaving } = useSecretsCreateMutation({
    onSuccess: () => setOutcome('stored'),
    // Owned deliberately: the default handler toasts the API message, and this
    // page shows one reason-free screen instead.
    onError: () => setOutcome('error'),
  })

  const request: ElicitationRequest | undefined = useMemo(() => {
    if (name === undefined || project.data === undefined) return undefined

    const existing = secrets.data?.find((secret) => secret.name === name)

    return {
      tool: ELICITATION_TOOL_NAME,
      project: project.data.name,
      account,
      keyName: name,
      providerHint: getProviderHint(name),
      existingSecret: existing === undefined ? undefined : { updatedAt: existing.updated_at },
    }
  }, [account, name, project.data, secrets.data])

  const state = useMemo<ElicitationState>(() => {
    // Always `undefined` in production — see `parseElicitationParams`. An
    // override that needs a request stays inert until the real one resolves,
    // so previewing `stored` still shows the project it would have stored to.
    const overridden =
      devState === undefined ? undefined : resolveDevState(devState, request, account)
    if (overridden !== undefined) return overridden

    if (!isLinkResolvable) return { status: 'expired' }

    if (outcome === 'cancelled') return { status: 'cancelled' }
    if (outcome === 'error') return { status: 'error' }
    if (outcome === 'stored' && request !== undefined) {
      return { status: 'stored', request, timedOut: false }
    }

    if (project.isError) return { status: 'error' }

    // Held at loading until the overwrite warning can be decided, so the card
    // doesn't resolve and then grow a warning underneath the user's cursor.
    if (project.isPending || secrets.isPending || request === undefined) {
      return { status: 'loading' }
    }

    return { status: 'form', request }
  }, [
    account,
    devState,
    isLinkResolvable,
    outcome,
    project.isError,
    project.isPending,
    request,
    secrets.isPending,
  ])

  const saveSecret = useCallback(
    (secret: string) => {
      if (ref === undefined || name === undefined || isSaving) return

      // Stored exactly as typed: no trim, no newline stripping, no quote removal.
      mutate({ projectRef: ref, secrets: [{ name, value: secret }] })
    },
    [isSaving, mutate, name, ref]
  )

  // Nothing to cancel server-side in v1 — this is a local dead end the user
  // chose, and the copy tells them how to start over.
  const cancelRequest = useCallback(() => setOutcome('cancelled'), [])

  return { state, isSaving, saveSecret, cancelRequest }
}

/** `undefined` when the override needs a request we don't have yet. */
function resolveDevState(
  devState: DevElicitationState,
  request: ElicitationRequest | undefined,
  account: string
): ElicitationState | undefined {
  switch (devState) {
    case 'loading':
      return { status: 'loading' }
    case 'expired':
      return { status: 'expired' }
    case 'cancelled':
      return { status: 'cancelled' }
    case 'paused':
      return { status: 'paused' }
    case 'error':
      return { status: 'error' }
    case 'wrong-account':
      return { status: 'wrong-account', signedInAs: account }
    case 'form':
      return request && { status: 'form', request }
    case 'stored':
      return request && { status: 'stored', request, timedOut: false }
    case 'stored-timeout':
      return request && { status: 'stored', request, timedOut: true }
    case 'already-stored':
      return request && { status: 'already-stored', request }
  }
}
