import { useQueryClient } from '@tanstack/react-query'
import { EyeOff, Lock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge, Button } from 'ui'
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

const AUDIENCE: Record<GraphqlExposureLintName, { lower: string; upper: string }> = {
  pg_graphql_anon_table_exposed: { lower: 'anonymous users', upper: 'Anonymous users' },
  pg_graphql_authenticated_table_exposed: { lower: 'signed-in users', upper: 'Signed-in users' },
}

const TRIGGER_LABEL: Record<GraphqlExposureLintName, string> = {
  pg_graphql_anon_table_exposed: 'Remove access for anonymous users',
  pg_graphql_authenticated_table_exposed: 'Remove access for signed-in users',
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
  const audience = AUDIENCE[lintName]
  const canAct = !!schema && !!name

  const revokeSql = canAct
    ? `revoke all on ${quoteIdent(schema)}.${quoteIdent(name)} from ${role};`
    : ''

  const { mutate: executeSql, isPending: isRevoking } = useExecuteSqlMutation({
    onSuccess: async () => {
      toast.success(
        `Revoked access to ${schema}.${name} from ${role}. ${audience.upper} can no longer query this ${objectType} via GraphQL or Data API.`
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
        {TRIGGER_LABEL[lintName]}
      </Button>
      <ConfirmationModal
        visible={showConfirmRevoke}
        size="xlarge"
        title={
          canAct
            ? `Remove access to ${schema}.${name} for ${audience.lower}?`
            : `Remove access for ${audience.lower}?`
        }
        confirmLabel="Remove access"
        confirmLabelLoading="Removing access..."
        cancelLabel="Cancel"
        loading={isRevoking}
        onCancel={() => setShowConfirmRevoke(false)}
        onConfirm={handleRevoke}
      >
        <div className="text-sm text-foreground mb-6">
          <p>This change affects both schema visibility and data access for {audience.lower}.</p>
          <p>
            Alternatively, you can{' '}
            <InlineLink href={`/project/${projectRef}/database/extensions`}>
              disable GraphQL
            </InlineLink>{' '}
            to remove schema visibility.
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex gap-3">
            <Lock className="text-foreground-light shrink-0 mt-0.5" size={20} strokeWidth={1.5} />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-foreground">Data API access removed</p>
                <Badge variant="warning">Breaking change</Badge>
              </div>
              <p className="text-sm text-foreground-light mt-1">
                {audience.upper} will no longer be able to read or write to this {objectType} via
                Supabase APIs (GraphQL or Data API), even if RLS policies allow it.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <EyeOff className="text-foreground-light shrink-0 mt-0.5" size={20} strokeWidth={1.5} />
            <div>
              <p className="text-sm text-foreground">Schema hidden from GraphQL</p>
              <p className="text-sm text-foreground-light mt-1">
                This {objectType} will no longer appear in the GraphQL schema. {audience.upper}{' '}
                won't be able to discover its name, columns, or relationships.
              </p>
            </div>
          </div>
        </div>

        <Admonition
          type="warning"
          title="When to keep access"
          description={`If your app needs ${audience.lower} to query this ${objectType}, keep access and ignore this warning. Be aware that this ${objectType}'s schema will remain visible via the GraphQL API.`}
          className="mt-6"
        />

        <p className="text-sm text-foreground-light mt-6">
          The following statement will be executed:
        </p>
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
      title="Why this appears"
      description={
        <p>
          These warnings are triggered by GraphQL exposing your table schemas. If you're not using
          GraphQL, disable it from the{' '}
          <InlineLink href={`/project/${projectRef}/database/extensions`}>
            Database extensions page
          </InlineLink>
          .
        </p>
      }
    />
  )
}
