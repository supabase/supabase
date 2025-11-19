import { toast } from 'sonner'

import { LintActionArgs } from 'components/interfaces/Linter/Linter.constants'
import { ToggleRlsButton } from 'components/ui/ToggleRlsButton'

export const EnableRLSAction = ({ projectRef, connectionString, metadata }: LintActionArgs) => {
  const tableSchema = metadata?.schema
  const tableName = metadata?.name

  if (!tableSchema || !tableName) {
    return null
  }

  return (
    <ToggleRlsButton
      type="primary"
      projectRef={projectRef}
      connectionString={connectionString ?? null}
      schema={tableSchema}
      tableName={tableName}
      isRlsEnabled={false}
      onSuccess={() => {
        toast.success('Enable RLS successful')
      }}
      onError={(error: unknown) => {
        const message =
          (!!error && typeof error === 'object' && 'message' in error && String(error.message)) ||
          'Failed to enable RLS'
        toast.error(message)
      }}
    />
  )
}
