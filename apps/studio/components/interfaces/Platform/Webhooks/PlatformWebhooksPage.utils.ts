import type { WebhookScope } from './PlatformWebhooks.types'

export const shouldHandleEndpointNotFound = ({
  endpointId,
  hasSelectedEndpoint,
  pendingCreatedEndpointId,
}: {
  endpointId?: string
  hasSelectedEndpoint: boolean
  pendingCreatedEndpointId: string | null
}) => {
  if (!endpointId) return false
  if (hasSelectedEndpoint) return false
  return endpointId !== pendingCreatedEndpointId
}

interface PendingSigningSecretReveal {
  endpointId: string
  signingSecret: string
}

const pendingSigningSecretRevealByScope: Partial<Record<WebhookScope, PendingSigningSecretReveal>> =
  {}

export const setPendingSigningSecretReveal = (
  scope: WebhookScope,
  value: PendingSigningSecretReveal
) => {
  pendingSigningSecretRevealByScope[scope] = value
}

export const getPendingSigningSecretReveal = (scope: WebhookScope, endpointId?: string) => {
  const pending = pendingSigningSecretRevealByScope[scope]
  if (!pending) return null
  if (endpointId && pending.endpointId !== endpointId) return null
  return pending
}

export const clearPendingSigningSecretReveal = (scope: WebhookScope) => {
  delete pendingSigningSecretRevealByScope[scope]
}

export const resetPendingSigningSecretRevealForTests = () => {
  for (const key of Object.keys(pendingSigningSecretRevealByScope) as WebhookScope[]) {
    delete pendingSigningSecretRevealByScope[key]
  }
}
