import { useSession } from 'common'
import { useCallback, useMemo, useState } from 'react'

import { SECRETS_TOOL_NAME } from './McpSecrets.constants'
import type { DevSecretsState, SecretsParams } from './McpSecrets.params'
import { getProviderHint } from './McpSecrets.providers'
import type { SecretRequest, SecretsState } from './McpSecrets.types'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import {
  useSecretsCreateMutation,
  type SecretsCreateVariables,
} from '@/data/secrets/secrets-create-mutation'
import { useSecretsQuery } from '@/data/secrets/secrets-query'

type RecordedOutcome = {
  ref: string | undefined
  name: string | undefined
  status: 'stored' | 'cancelled' | 'error'
}

function recordOutcome(
  variables: SecretsCreateVariables,
  status: RecordedOutcome['status']
): RecordedOutcome {
  return { ref: variables.projectRef, name: variables.secrets[0]?.name, status }
}

export function useSecretRequest(params: SecretsParams) {
  const { ref, name } = params
  const devState = params.dev.state

  const session = useSession()
  const account = session?.user?.email ?? ''

  const [outcome, setOutcome] = useState<RecordedOutcome | undefined>(undefined)

  const isLinkResolvable = ref !== undefined && name !== undefined

  const project = useProjectDetailQuery({ ref }, { enabled: isLinkResolvable })
  const secrets = useSecretsQuery({ projectRef: ref }, { enabled: isLinkResolvable })

  const { mutate, isPending: isSaving } = useSecretsCreateMutation({
    onSuccess: (_data, variables) => setOutcome(recordOutcome(variables, 'stored')),
    onError: (_error, variables) => setOutcome(recordOutcome(variables, 'error')),
  })

  const request: SecretRequest | undefined = useMemo(() => {
    if (ref === undefined || name === undefined || project.data === undefined) return undefined

    const existing = secrets.data?.find((secret) => secret.name === name)

    return {
      tool: SECRETS_TOOL_NAME,
      ref,
      project: project.data.name,
      account,
      keyName: name,
      providerHint: getProviderHint(name),
      existingSecret: existing === undefined ? undefined : { updatedAt: existing.updated_at },
    }
  }, [account, name, project.data, ref, secrets.data])

  const state = useMemo<SecretsState>(() => {
    const overridden =
      devState === undefined ? undefined : resolveDevState(devState, request, account)
    if (overridden !== undefined) return overridden

    if (!isLinkResolvable) return { status: 'expired' }

    const activeOutcome =
      outcome?.ref === ref && outcome?.name === name ? outcome.status : undefined

    if (activeOutcome === 'cancelled') return { status: 'cancelled' }
    if (activeOutcome === 'error') return { status: 'error' }
    if (activeOutcome === 'stored' && request !== undefined) {
      return { status: 'stored', request, timedOut: false }
    }

    if (project.isError || secrets.isError) return { status: 'error' }

    if (project.isPending || secrets.isPending || request === undefined) {
      return { status: 'loading' }
    }

    return { status: 'form', request }
  }, [
    account,
    devState,
    isLinkResolvable,
    name,
    outcome,
    project.isError,
    ref,
    project.isPending,
    request,
    secrets.isError,
    secrets.isPending,
  ])

  const saveSecret = useCallback(
    (secret: string) => {
      if (ref === undefined || name === undefined || isSaving) return

      mutate({ projectRef: ref, secrets: [{ name, value: secret }] })
    },
    [isSaving, mutate, name, ref]
  )

  const cancelRequest = useCallback(
    () => setOutcome({ ref, name, status: 'cancelled' }),
    [name, ref]
  )

  return { state, isSaving, saveSecret, cancelRequest }
}

function resolveDevState(
  devState: DevSecretsState,
  request: SecretRequest | undefined,
  account: string
): SecretsState | undefined {
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
