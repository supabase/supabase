import { useMutation } from '@tanstack/react-query'

import { isLogsSource } from '@/components/interfaces/SQLEditor/sqlEditorLogs'
import { get, handleError } from '@/data/fetchers'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'

/**
 * Variables accepted by the SQL Editor's execute call. Extends the Postgres
 * mutation variables with the selected `source` and a time range, which the logs
 * source needs and Postgres ignores.
 */
export type ExecuteSQLEditorVariables = {
  projectRef?: string
  connectionString?: string | null
  sql: any
  source?: string
  iso_timestamp_start?: string
  iso_timestamp_end?: string
  autoLimit?: number
  isRoleImpersonationEnabled?: boolean
  isStatementTimeoutDisabled?: boolean
  contextualInvalidation?: boolean
  handleError?: (error: any) => { result: any }
}

type ExecuteSQLEditorOptions = {
  onSuccess?: (data: { result: any }, variables: ExecuteSQLEditorVariables) => void
  onError?: (error: any, variables: ExecuteSQLEditorVariables) => void
}

// Runs user-typed SQL against the ClickHouse-backed logs endpoint. Mirrors the
// Logs Explorer: the query goes through as a plain string (user-authored SQL is
// trusted) and the result rows come back under `result`.
async function executeLogsQuery(variables: ExecuteSQLEditorVariables) {
  const { projectRef, sql, iso_timestamp_start, iso_timestamp_end } = variables
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(logsAllEndpointUrl(true), {
    params: {
      path: { ref: projectRef },
      query: {
        sql: sql as string,
        iso_timestamp_start: iso_timestamp_start ?? '',
        iso_timestamp_end: iso_timestamp_end ?? '',
      },
    },
  })
  if (error) handleError(error)
  if (data?.error) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Failed to query logs')
  }
  return { result: data?.result ?? [] }
}

/**
 * SQL Editor execution router. Runs the query against Postgres by default, or
 * against the logs endpoint when the selected source is the logs pseudo-source.
 * Both paths resolve through the same `{ result }` shape so the editor's success
 * and error handlers stay unchanged.
 */
export function useExecuteSQLEditorQuery(options: ExecuteSQLEditorOptions = {}) {
  const { onSuccess, onError } = options

  const pgMutation = useExecuteSqlMutation({
    onSuccess: onSuccess as any,
    onError: onError as any,
  })

  const logsMutation = useMutation({
    mutationFn: executeLogsQuery,
    onSuccess: (data, variables) => onSuccess?.(data, variables),
    onError: (error, variables) => onError?.(error, variables),
  })

  const mutate = (variables: ExecuteSQLEditorVariables) => {
    if (isLogsSource(variables.source)) {
      logsMutation.mutate(variables)
    } else {
      pgMutation.mutate(variables as any)
    }
  }

  return { mutate, isPending: pgMutation.isPending || logsMutation.isPending }
}
