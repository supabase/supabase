import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql, ExecuteSqlData, ExecuteSqlVariables } from './execute-sql-query'

// [Joshen] Intention is that we invalidate all database related keys whenever running a mutation related query
// So we attempt to ignore all the non-related query keys. We could probably look into grouping our query keys better
// actually to not make this too hacky here
const INVALIDATION_KEYS_IGNORE = ['branches', 'settings-v2', 'addons', 'custom-domains', 'content']

export type QueryResponseError = {
  code: string
  message: string
  error: string
  formattedError: string
  file: string
  length: number
  line: string
  name: string
  position: string
  routine: string
  severity: string
}

export const useExecuteSqlMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ExecuteSqlData, QueryResponseError, ExecuteSqlVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<ExecuteSqlData, QueryResponseError, ExecuteSqlVariables>(
    (args) => executeSql(args),
    {
      async onSuccess(data, variables, context) {
        const { contextualInvalidation, sql, projectRef } = variables

        // [Joshen] Default to false for now, only used for SQL editor to dynamically invalidate
        const sqlLower = sql.toLowerCase()
        const isMutationSQL =
          sqlLower.includes('create ') || sqlLower.includes('alter ') || sqlLower.includes('drop ')
        if (contextualInvalidation && projectRef && isMutationSQL) {
          const databaseRelatedKeys = queryClient
            .getQueryCache()
            .findAll(['projects', projectRef])
            .map((x) => x.queryKey)
            .filter((x) => !INVALIDATION_KEYS_IGNORE.some((a) => x.includes(a)))
          await Promise.all(databaseRelatedKeys.map((key) => queryClient.invalidateQueries(key)))
        }
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to execute SQL: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

// Utilities for building EXPLAIN/EXPLAIN ANALYZE statements

/**
 * Extracts 1-based parameter indexes like $1, $2 from a SQL string.
 */
export const extractParameterIndexes = (sql: string): number[] => {
  const indexes = new Set<number>()
  const regex = /\$(\d+)/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(sql)) !== null) {
    const idx = Number(match[1])
    if (!isNaN(idx)) indexes.add(idx)
  }
  return Array.from(indexes).sort((a, b) => a - b)
}

/**
 * Builds an EXPLAIN statement for the provided SQL.
 * - If the query is not parameterized, runs EXPLAIN ANALYZE JSON inside a transaction (rolled back).
 * - If parameterized ($1, $2 ...), forces a generic plan via PREPARE with unknowns and EXPLAIN JSON of EXECUTE with NULLs.
 */
export const buildExplainSqlForQuery = (originalQuery: string): string => {
  const params = extractParameterIndexes(originalQuery)

  if (params.length === 0) {
    return (
      `BEGIN;\n` +
      `EXPLAIN (ANALYZE, BUFFERS, VERBOSE, WAL, SETTINGS, FORMAT JSON) ${originalQuery};\n` +
      `ROLLBACK;`
    )
  }

  const maxParam = Math.max(...params)
  const unknowns = Array(maxParam).fill('unknown').join(', ')
  const nulls = Array(maxParam).fill('NULL').join(', ')
  const stmtName = '__qp_stmt__'

  return (
    `BEGIN;\n` +
    `SET LOCAL plan_cache_mode = force_generic_plan;\n` +
    `PREPARE ${stmtName}(${unknowns}) AS ${originalQuery};\n` +
    `EXPLAIN (VERBOSE, SETTINGS, FORMAT JSON) EXECUTE ${stmtName}(${nulls});\n` +
    `DEALLOCATE ${stmtName};\n` +
    `ROLLBACK;`
  )
}
