import { useMemo } from 'react'

import { PG_GRAPHQL_EXTENSION_NAME } from './constants'
import {
  isIntrospectionEnabled,
  isPgGraphqlIntrospectionOptIn,
  parseSchemaComment,
} from './pgGraphqlSchemaComment'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSchemaCommentQuery } from '@/data/pg-graphql/schema-comment-query'

type UsePgGraphqlIntrospectionStatusArgs = {
  projectRef: string | undefined
  connectionString: string | null | undefined
  schema: string
  enabled?: boolean
}

/**
 * Which introspection notice (if any) should be shown for a pg_graphql >= 1.6 project:
 * - `opt-in`: introspection is currently off — prompt to enable.
 * - `opt-out`: introspection is currently on — surface a control to disable.
 * - `null`: nothing to show (version doesn't require opt-in, or still loading).
 */
export type IntrospectionNotice = 'opt-in' | 'opt-out' | null

export type PgGraphqlIntrospectionStatus = {
  /** True while either underlying query is still loading. */
  isLoading: boolean
  notice: IntrospectionNotice
  /** The raw schema comment string, or null when there is no comment yet. */
  schemaComment: string | null | undefined
}

export const usePgGraphqlIntrospectionStatus = ({
  projectRef,
  connectionString,
  schema,
  enabled = true,
}: UsePgGraphqlIntrospectionStatusArgs): PgGraphqlIntrospectionStatus => {
  const { data: pgGraphqlVersion, isLoading: isVersionLoading } = useDatabaseExtensionsQuery<
    string | null
  >(
    { projectRef, connectionString },
    {
      enabled,
      select: (extensions) =>
        extensions.find((ext) => ext.name === PG_GRAPHQL_EXTENSION_NAME)?.installed_version ?? null,
    }
  )

  // Only fetch the schema comment when the installed version actually requires
  // the opt-in. Older versions enable introspection by default, so the comment
  // is irrelevant for the notice.
  const versionRequiresOptIn = isPgGraphqlIntrospectionOptIn(pgGraphqlVersion)

  const {
    data: schemaComment,
    isLoading: isCommentLoading,
    isError: isCommentError,
  } = useSchemaCommentQuery(
    { projectRef, connectionString, schema },
    { enabled: enabled && versionRequiresOptIn }
  )

  const notice = useMemo<IntrospectionNotice>(() => {
    if (!versionRequiresOptIn) return null
    if (isCommentLoading || isCommentError) return null
    const parsed = parseSchemaComment(schemaComment)
    return isIntrospectionEnabled(parsed.options) ? 'opt-out' : 'opt-in'
  }, [versionRequiresOptIn, schemaComment, isCommentLoading, isCommentError])

  return {
    isLoading: isVersionLoading || (versionRequiresOptIn && isCommentLoading),
    notice,
    schemaComment,
  }
}
