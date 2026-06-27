import type { KeyValueFieldArrayAction } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'

interface BuildEdgeFunctionHeaderAddActionsParams<TRow> {
  apiKey: string
  createRow: (name: string, value: string) => TRow
}

export const getEdgeFunctionAuthHeader = (apiKey: string) =>
  apiKey.startsWith('sb_secret') || apiKey.startsWith('sb_publishable')
    ? { name: 'apikey', value: apiKey }
    : { name: 'Authorization', value: `Bearer ${apiKey}` }

export const buildEdgeFunctionHeaderAddActions = <TRow>({
  apiKey,
  createRow,
}: BuildEdgeFunctionHeaderAddActionsParams<TRow>): KeyValueFieldArrayAction<TRow>[] => {
  const authHeader = getEdgeFunctionAuthHeader(apiKey)

  return [
    {
      key: 'add-auth-header',
      label:
        authHeader.name === 'apikey'
          ? 'Add apikey header with secret key'
          : 'Add auth header with secret key',
      description: 'Required for edge functions invoked with a secret key',
      createRows: () => [createRow(authHeader.name, authHeader.value)],
    },
    {
      key: 'add-source-header',
      label: 'Add custom source header',
      description: 'Useful to verify that the edge function was triggered from this webhook',
      createRows: () => createRow('x-supabase-webhook-source', '[Use a secret value]'),
      separatorAbove: true,
    },
  ]
}
