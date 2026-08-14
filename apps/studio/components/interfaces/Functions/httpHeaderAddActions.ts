import type { KeyValueFieldArrayAction } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'

interface BuildEdgeFunctionHeaderAddActionsParams<TRow> {
  apiKey: string
  includeApiKeyHeader?: boolean
  createRow: (name: string, value: string) => TRow
}

export const buildEdgeFunctionHeaderAddActions = <TRow>({
  apiKey,
  includeApiKeyHeader = false,
  createRow,
}: BuildEdgeFunctionHeaderAddActionsParams<TRow>): KeyValueFieldArrayAction<TRow>[] => [
  {
    key: 'add-auth-header',
    label: 'Add auth header with secret key',
    description: 'Required if your edge function enforces JWT verification',
    createRows: () => [
      createRow('Authorization', `Bearer ${apiKey}`),
      ...(includeApiKeyHeader ? [createRow('apikey', apiKey)] : []),
    ],
  },
  {
    key: 'add-source-header',
    label: 'Add custom source header',
    description: 'Useful to verify that the edge function was triggered from this webhook',
    createRows: () => createRow('x-supabase-webhook-source', '[Use a secret value]'),
    separatorAbove: true,
  },
]
