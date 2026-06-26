import type { KeyValueFieldArrayAction } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'

interface BuildEdgeFunctionHeaderAddActionsParams<TRow> {
  apiKey: string
  createRow: (name: string, value: string) => TRow
}

export const buildEdgeFunctionHeaderAddActions = <TRow>({
  apiKey,
  createRow,
}: BuildEdgeFunctionHeaderAddActionsParams<TRow>): KeyValueFieldArrayAction<TRow>[] => [
  {
    key: 'add-auth-header',
    label: 'Add apiKey header with secret key',
    description: 'Required for edge functions invoked with a secret key',
    createRows: () => [createRow('apikey', apiKey)],
  },
  {
    key: 'add-source-header',
    label: 'Add custom source header',
    description: 'Useful to verify that the edge function was triggered from this webhook',
    createRows: () => createRow('x-supabase-webhook-source', '[Use a secret value]'),
    separatorAbove: true,
  },
]
