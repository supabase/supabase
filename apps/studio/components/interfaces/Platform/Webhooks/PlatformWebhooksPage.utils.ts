import type { WebhookDelivery, WebhookScope } from './PlatformWebhooks.types'

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

/**
 * The table's rows refresh every few seconds, but the sheet's delivery is loaded once, so its status
 * can be out of date. Prefer the table's row, and only fall back to the sheet's delivery when it is
 * not on the current page.
 */
export const findDeliveryToRetry = ({
  deliveryId,
  selectedDelivery,
  pageDeliveries,
}: {
  deliveryId: string
  selectedDelivery: WebhookDelivery | null
  pageDeliveries: WebhookDelivery[]
}) =>
  pageDeliveries.find((delivery) => delivery.id === deliveryId) ??
  (selectedDelivery?.id === deliveryId ? selectedDelivery : undefined)

/**
 * Only redirect away once the flags have loaded and the route params are populated; before
 * that, the flag reads `false` and `slug`/`ref` are undefined even for enabled users.
 */
export const shouldRedirectFromWebhooks = ({
  areFlagsReady,
  isScopeReady,
  isEnabled,
}: {
  areFlagsReady: boolean
  isScopeReady: boolean
  isEnabled: boolean
}) => areFlagsReady && isScopeReady && !isEnabled

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
