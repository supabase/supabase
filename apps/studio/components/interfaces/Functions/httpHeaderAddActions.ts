import type { KeyValueFieldArrayAction } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'

interface BuildEdgeFunctionHeaderAddActionsParams<TRow> {
  apiKey: string
  /**
   * When provided, an extra action is offered for the project's publishable (or legacy anon) key.
   * Surfaces that should only ever offer a secret key, such as database webhooks and cron jobs,
   * leave this undefined.
   */
  publishableKey?: string
  createRow: (name: string, value: string) => TRow
}

interface HTTPHeader {
  name: string
  value: string
}

interface EnsureEdgeFunctionAuthorizationHeaderParams<TRow extends HTTPHeader> {
  headers: TRow[]
  serviceRoleKey?: string
  verifyJwt?: boolean
  createRow: (name: string, value: string) => TRow
}

const isNewApiKey = (apiKey: string) =>
  apiKey.startsWith('sb_secret_') || apiKey.startsWith('sb_publishable_')

const isPublishableApiKey = (apiKey: string) => apiKey.startsWith('sb_publishable_')

/**
 * Labels an action after the key it actually carries. Legacy keys are not self describing, so the
 * caller names them: the secret slot falls back to "Add secret key", the publishable slot to
 * "Add anon key".
 */
const getApiKeyActionLabel = (apiKey: string, legacyLabel: string) => {
  if (isPublishableApiKey(apiKey)) return 'Add publishable key'
  if (isNewApiKey(apiKey)) return 'Add secret key'
  return legacyLabel
}

export const getEdgeFunctionAuthHeader = (apiKey: string) =>
  isNewApiKey(apiKey)
    ? { name: 'apikey', value: apiKey }
    : { name: 'Authorization', value: `Bearer ${apiKey}` }

export const ensureEdgeFunctionAuthorizationHeader = <TRow extends HTTPHeader>({
  headers,
  serviceRoleKey,
  verifyJwt,
  createRow,
}: EnsureEdgeFunctionAuthorizationHeaderParams<TRow>): TRow[] => {
  if (!verifyJwt || !serviceRoleKey || isNewApiKey(serviceRoleKey)) return headers

  const isAuthorization = (header: HTTPHeader) =>
    header.name.trim().toLowerCase() === 'authorization'
  const authorizationIndex = headers.findIndex(isAuthorization)

  if (authorizationIndex === -1) {
    return [...headers, createRow('Authorization', `Bearer ${serviceRoleKey}`)]
  }

  const authorizationHeader = headers[authorizationIndex]
  const normalizedHeaders = headers.filter(
    (header, index) => index === authorizationIndex || !isAuthorization(header)
  )

  if (normalizedHeaders.length === headers.length && authorizationHeader.name === 'Authorization') {
    return headers
  }

  normalizedHeaders[authorizationIndex] = {
    ...authorizationHeader,
    name: 'Authorization',
  }
  return normalizedHeaders
}

export const buildEdgeFunctionHeaderAddActions = <TRow>({
  apiKey,
  publishableKey,
  createRow,
}: BuildEdgeFunctionHeaderAddActionsParams<TRow>): KeyValueFieldArrayAction<TRow>[] => {
  const authHeader = getEdgeFunctionAuthHeader(apiKey)

  // `add-auth-header` stays at a stable position for callers that do not pass a publishable key,
  // so the publishable action is prepended only when one is available.
  const publishableActions: KeyValueFieldArrayAction<TRow>[] = []

  if (publishableKey !== undefined) {
    const publishableHeader = getEdgeFunctionAuthHeader(publishableKey)

    publishableActions.push({
      key: 'add-publishable-key-header',
      label: getApiKeyActionLabel(publishableKey, 'Add anon key'),
      description:
        publishableHeader.name === 'apikey'
          ? 'For functions that accept a publishable key and authorize the request themselves'
          : 'Legacy anon key, for edge functions that enforce JWT verification',
      createRows: () => [createRow(publishableHeader.name, publishableHeader.value)],
    })
  }

  return [
    ...publishableActions,
    {
      key: 'add-auth-header',
      // The label follows the key the action actually carries rather than being hardcoded
      label: getApiKeyActionLabel(apiKey, 'Add secret key'),
      description:
        authHeader.name === 'apikey'
          ? 'Requires JWT verification to be disabled and authorization handled by the function'
          : 'Required for edge functions that enforce JWT verification',
      createRows: () => [createRow(authHeader.name, authHeader.value)],
    },
    {
      key: 'add-source-header',
      label: 'Add custom source',
      description: 'Useful to verify that the edge function was triggered from this webhook',
      createRows: () => createRow('x-supabase-webhook-source', '[Use a secret value]'),
      separatorAbove: true,
    },
  ]
}
