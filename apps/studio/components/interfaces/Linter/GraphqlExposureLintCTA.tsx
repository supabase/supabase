import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { InlineLink } from '@/components/ui/InlineLink'
import { lintKeys } from '@/data/lint/keys'
import { Lint } from '@/data/lint/lint-query'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const GRAPHQL_EXPOSURE_LINT_NAMES = [
  'pg_graphql_anon_table_exposed',
  'pg_graphql_authenticated_table_exposed',
] as const

export type GraphqlExposureLintName = (typeof GRAPHQL_EXPOSURE_LINT_NAMES)[number]

export const asGraphqlExposureLint = (
  name: string | undefined | null
): GraphqlExposureLintName | null =>
  !!name && (GRAPHQL_EXPOSURE_LINT_NAMES as readonly string[]).includes(name)
    ? (name as GraphqlExposureLintName)
    : null

const quoteIdent = (ident: string) => `"${ident.replace(/"/g, '""')}"`

interface GraphqlExposureLintCTAProps {
  lintName: GraphqlExposureLintName
  projectRef: string
  metadata: Lint['metadata']
  onAfterAction?: () => void
}

const ROLE_BY_LINT: Record<GraphqlExposureLintName, 'anon' | 'authenticated'> = {
  pg_graphql_anon_table_exposed: 'anon',
  pg_graphql_authenticated_table_exposed: 'authenticated',
}

const HIDE_LABEL: Record<GraphqlExposureLintName, string> = {
  pg_graphql_anon_table_exposed: 'Hide from anonymous users',
  pg_graphql_authenticated_table_exposed: 'Hide from signed-in users',
}

const AUDIENCE_LABEL: Record<GraphqlExposureLintName, string> = {
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

  const [showConfirmRevoke, setShowConfirmRevoke] = useState(false)

  const schema = metadata?.schema
  const name = metadata?.name
  const objectType = metadata?.type ?? 'object'
  const role = ROLE_BY_LINT[lintName]
  const audience = AUDIENCE_LABEL[lintName]
  const canAct = !!schema && !!name

  const revokeSql = canAct
    ? `revoke all on ${quoteIdent(schema)}.${quoteIdent(name)} from ${role};`
    : ''

  const { mutate: executeSql, isPending: isRevoking } = useExecuteSqlMutation({
    onSuccess: async () => {
      toast.success(
        `Revoked access to ${schema}.${name} from ${role}. ${audience} can no longer query this ${objectType} via GraphQL or Data API.`
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

  return (
    <>
      <Button type="primary" disabled={!canAct} onClick={() => setShowConfirmRevoke(true)}>
        {HIDE_LABEL[lintName]}
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
          title: `This removes API access for ${AUDIENCE_LABEL[lintName]}`,
          description: `Apps using the ${role} role will not be able to read or write to this ${objectType} via GraphQL or Data API. You can re-grant access later from the SQL editor.`,
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

export const GraphqlExposureCallout = ({ projectRef }: { projectRef: string }) => {
  return (
    <Admonition
      type="default"
      title="GraphQL is enabled on this project"
      description={
        <p>
          This check applies because this table is exposed to GraphQL. If this projects doesn't use
          GraphQL, you can{' '}
          <InlineLink href={`/project/${projectRef}/database/extensions`}>
            disable it from the GraphQL integration page
          </InlineLink>
          .
        </p>
      }
    />
  )
}
