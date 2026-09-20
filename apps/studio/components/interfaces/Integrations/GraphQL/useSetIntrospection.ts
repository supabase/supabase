import { ident, literal, safeSql } from '@supabase/pg-meta'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { buildSchemaCommentWith, parseSchemaComment } from './pgGraphqlSchemaComment'
import { pgGraphqlKeys } from '@/data/pg-graphql/keys'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface UseSetIntrospectionParams {
  schema: string
  currentSchemaComment: string | null | undefined
  /** Target state — true enables introspection, false disables it. */
  enabled: boolean
  /** Fires synchronously when the mutation succeeds, before query invalidation — use to close the confirmation modal. */
  onMutationSuccess: () => void
  /** Fires after dependent queries are invalidated — use to trigger remounts that depend on fresh data. */
  onInvalidated: () => void
}

export const useSetIntrospection = ({
  schema,
  currentSchemaComment,
  enabled,
  onMutationSuccess,
  onInvalidated,
}: UseSetIntrospectionParams) => {
  const { data: project } = useSelectedProjectQuery()
  const queryClient = useQueryClient()

  const parsed = parseSchemaComment(currentSchemaComment)
  const nextComment = buildSchemaCommentWith(currentSchemaComment, { introspection: enabled })
  const sql = safeSql`comment on schema ${ident(schema)} is ${literal(nextComment)};`

  // If the existing directive was unparseable we'd be silently discarding the
  // user's prior options. Surface that so the UI can warn before confirming.
  const existingDirectiveIsMalformed = parsed.hasDirective && parsed.isMalformed
  const otherExistingKeys = Object.keys(parsed.options).filter((k) => k !== 'introspection')

  const pastVerb = enabled ? 'enabled' : 'disabled'
  const presentVerb = enabled ? 'enable' : 'disable'

  const { mutate, isPending } = useExecuteSqlMutation({
    onSuccess: async (_data, variables) => {
      toast.success(`Introspection ${pastVerb} on schema "${schema}".`)
      onMutationSuccess()
      await queryClient.invalidateQueries({
        queryKey: pgGraphqlKeys.schemaComment(variables.projectRef, schema),
      })
      onInvalidated()
    },
    onError: (error) => {
      toast.error(`Failed to ${presentVerb} introspection: ${error.message}`)
    },
  })

  const apply = () => {
    if (!project?.ref) return
    mutate({
      projectRef: project.ref,
      connectionString: project.connectionString,
      sql,
    })
  }

  return { apply, isPending, sql, existingDirectiveIsMalformed, otherExistingKeys }
}
