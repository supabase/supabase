import { literal, safeSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { pgGraphqlKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type SchemaCommentVariables = {
  projectRef?: string
  connectionString?: string | null
  schema: string
}

export type SchemaCommentData = string | null
export type SchemaCommentError = Error

const getSchemaCommentSql = (schema: string) =>
  safeSql`select obj_description(${literal(schema)}::regnamespace, 'pg_namespace') as comment;`

export async function getSchemaComment(
  { projectRef, connectionString, schema }: SchemaCommentVariables,
  signal?: AbortSignal
): Promise<SchemaCommentData> {
  const sql = getSchemaCommentSql(schema)
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['pg-graphql', 'schema-comment', schema],
    },
    signal
  )
  const row = Array.isArray(result) ? result[0] : null
  const comment = row?.comment
  return typeof comment === 'string' ? comment : null
}

export const useSchemaCommentQuery = <TData = SchemaCommentData>(
  { projectRef, connectionString, schema }: SchemaCommentVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<SchemaCommentData, SchemaCommentError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<SchemaCommentData, SchemaCommentError, TData>({
    queryKey: pgGraphqlKeys.schemaComment(projectRef, schema),
    queryFn: ({ signal }) => getSchemaComment({ projectRef, connectionString, schema }, signal),
    enabled: enabled && projectRef !== undefined && isActive,
    ...options,
  })
}
