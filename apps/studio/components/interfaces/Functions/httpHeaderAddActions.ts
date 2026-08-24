import type { KeyValueFieldArrayAction } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'

interface BuildEdgeFunctionHeaderAddActionsParams<TRow> {
  apiKey: string
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

  const value = `Bearer ${serviceRoleKey}`
  const isAuthorization = (header: HTTPHeader) =>
    header.name.trim().toLowerCase() === 'authorization'
  const authorizationIndex = headers.findIndex(isAuthorization)

  if (authorizationIndex === -1) {
    return [...headers, createRow('Authorization', value)]
  }

  const authorizationHeader = headers[authorizationIndex]
  const normalizedHeaders = headers.filter(
    (header, index) => index === authorizationIndex || !isAuthorization(header)
  )

  if (
    normalizedHeaders.length === headers.length &&
    authorizationHeader.name === 'Authorization' &&
    authorizationHeader.value === value
  ) {
    return headers
  }

  normalizedHeaders[authorizationIndex] = {
    ...authorizationHeader,
    name: 'Authorization',
    value,
  }
  return normalizedHeaders
}

export const buildEdgeFunctionHeaderAddActions = <TRow>({
  apiKey,
  createRow,
}: BuildEdgeFunctionHeaderAddActionsParams<TRow>): KeyValueFieldArrayAction<TRow>[] => {
  const authHeader = getEdgeFunctionAuthHeader(apiKey)

  return [
    {
      key: 'add-auth-header',
      label: 'Add secret key',
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
