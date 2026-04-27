import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { DismissibleGraphqlLintName, useDismissedGraphqlLints } from './useDismissedGraphqlLints'
import { lintKeys } from '@/data/lint/keys'
import { Lint } from '@/data/lint/lint-query'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface GraphqlExposureLintCTAProps {
  lintName: DismissibleGraphqlLintName
  projectRef: string
  metadata: Lint['metadata']
  onAfterAction?: () => void
}

const ROLE_BY_LINT: Record<DismissibleGraphqlLintName, 'anon' | 'authenticated'> = {
  pg_graphql_anon_table_exposed: 'anon',
  pg_graphql_authenticated_table_exposed: 'authenticated',
}

const HIDE_LABEL: Record<DismissibleGraphqlLintName, string> = {
  pg_graphql_anon_table_exposed: 'Disable for anonymous users',
  pg_graphql_authenticated_table_exposed: 'Disable for signed-in users',
}

const AUDIENCE_LABEL: Record<DismissibleGraphqlLintName, string> = {
  pg_graphql_anon_table_exposed: 'anonymous users',
  pg_graphql_authenticated_table_exposed: 'signed-in users',
}

export const GraphqlExposureLintCTA = ({
  lintName,
  projectRef,
  metadata,
  onAfterAction,
}: GraphqlExposureLintCTAProps) => {
  const { data: project } = useSelectedProjectQuery()
  const queryClient = useQueryClient()
  const { dismiss } = useDismissedGraphqlLints(projectRef)

  const [showConfirmRevoke, setShowConfirmRevoke] = useState(false)

  const schema = metadata?.schema
  const name = metadata?.name
  const objectType = metadata?.type ?? 'object'
  const role = ROLE_BY_LINT[lintName]
  const audience = AUDIENCE_LABEL[lintName]
  const canAct = !!schema && !!name

  const revokeSql = canAct ? `revoke all on "${schema}"."${name}" from ${role};` : ''

  const { mutate: executeSql, isPending: isRevoking } = useExecuteSqlMutation({
    onSuccess: async () => {
      toast.success(
        `Revoked access to ${schema}.${name} from ${role}. ${audience} can no longer query this ${objectType} via GraphQL or PostgREST.`
      )
      setShowConfirmRevoke(false)
      await queryClient.invalidateQueries({ queryKey: lintKeys.lint(projectRef) })
      onAfterAction?.()
    },
    onError: (error) => {
      toast.error(`Failed to revoke access: ${error.message}`)
    },
  })

  const handleRevoke = () => {
    if (!canAct) return
    executeSql({
      projectRef,
      connectionString: project?.connectionString,
      sql: revokeSql,
    })
  }

  const handleKeepExposed = () => {
    if (!canAct) return
    dismiss({ lintName, schema, name })
    toast.success(`Acknowledged ${schema}.${name} as intentionally exposed`)
    onAfterAction?.()
  }

  return (
    <>
      <Button type="primary" disabled={!canAct} onClick={() => setShowConfirmRevoke(true)}>
        {HIDE_LABEL[lintName]}
      </Button>
      <Button type="default" disabled={!canAct} onClick={handleKeepExposed}>
        Keep exposed
      </Button>
      <ConfirmationModal
        visible={showConfirmRevoke}
        size="medium"
        variant="warning"
        title={canAct ? `Hide ${schema}.${name} from ${audience}?` : `Hide from ${audience}?`}
        confirmLabel={HIDE_LABEL[lintName]}
        confirmLabelLoading="Revoking..."
        cancelLabel="Cancel"
        loading={isRevoking}
        onCancel={() => setShowConfirmRevoke(false)}
        onConfirm={handleRevoke}
        alert={{
          title: 'This revokes all privileges',
          description: `Apps using the ${role} role will not be able to read or write to this ${objectType} via GraphQL or PostgREST. You can re-grant access later from the SQL editor.`,
        }}
      >
        <p className="text-sm text-foreground-light">The following statement will be executed:</p>
        <pre className="mt-2 px-3 py-2 rounded bg-surface-200 text-xs font-mono whitespace-pre-wrap break-all">
          {revokeSql}
        </pre>
      </ConfirmationModal>
    </>
  )
}
