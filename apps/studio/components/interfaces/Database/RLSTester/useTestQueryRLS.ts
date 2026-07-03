import { safeSql, type SafeSqlFragment, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { useState } from 'react'
import { toast } from 'sonner'

import { checkIfAppendLimitRequired, suffixWithLimit } from '../../SQLEditor/SQLEditor.utils'
import { type ParseQueryResults } from './RLSTester.types'
import {
  filterTablePolicies,
  getTestQueryBlockedReason,
  type TestQueryBlockedReason,
} from './useTestQueryRLS.utils'
import { useParseClientCodeMutation } from '@/data/ai/parse-client-code-mutation'
import { useDatabasePoliciesQuery } from '@/data/database-policies/database-policies-query'
import { useCheckTableRLSStatusMutation } from '@/data/database/table-check-rls-mutation'
import {
  useParseSQLQueryMutation,
  type ParseSQLQueryOperations,
} from '@/data/misc/parse-query-mutation'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import { usePostgresSandbox } from '@/state/postgres-sandbox/sandbox'
import {
  isRoleImpersonationEnabled,
  useGetImpersonatedRoleState,
  useImpersonatedUser,
  useRoleImpersonationStateSnapshot,
} from '@/state/role-impersonation-state'
import { type ResponseError } from '@/types'

const limit = 100

export type { TestQueryBlockedReason }

// [Joshen] Pre-requisite work for identifying UPDATE / DELETE failures due to RLS - not yet wired
// in since those operations are currently blocked (see TestQueryBlockedReason's 'unsupported-
// operation'). Exported so it isn't flagged as unused until the follow-up PR wires it back in.
export const wrapReturnRowsAffected = (sql: SafeSqlFragment) => {
  return safeSql`
  DO $$
DECLARE
  row_count integer;
BEGIN
  ${sql}${(sql.endsWith(';') ? '' : ';') as SafeSqlFragment}
  GET DIAGNOSTICS row_count = ROW_COUNT;
  -- store it somewhere you can read back
  PERFORM set_config('rls_tester.rows_affected', row_count::text, true);
END $$;

SELECT current_setting('rls_tester.rows_affected', true);
`
}

/**
 * [Joshen] Testing a SQL query for its RLS access involves 3 async steps
 * 0. (Optional) Inferring client library code to SQL query via the AI Assistant
 * 1. Parsing the provided SQL query to retrieve its operation type + tables involved
 * 2. Checking for tables involved if they've got RLS enabled
 * 3. Actually running the query to retrieve the results
 *
 * Errors should all be handled as part of the UI instead of toasts, hence the empty onError
 * handlers to mute the default error handlers within the react query mutationhooks
 */
export const useTestQueryRLS = () => {
  const { data: project } = useSelectedProjectQuery()
  const { role } = useRoleImpersonationStateSnapshot()

  const { sandbox } = usePostgresSandbox()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()
  const impersonatedRoleState = getImpersonatedRoleState()
  const user = useImpersonatedUser()

  const [isLoading, setIsLoading] = useState(false)
  const [sandboxError, setSandboxError] = useState<Error>()

  const { data: policies = [] } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutateAsync: executeSql, error: executeSqlMutationError } = useExecuteSqlMutation({
    onError: () => {},
  })
  const executeSqlError = sandbox ? sandboxError : executeSqlMutationError

  const {
    mutateAsync: parseClientCode,
    isPending: isInferring,
    error: parseClientCodeError,
  } = useParseClientCodeMutation({
    onError: () => {},
  })

  const inferSQLFromLib = async (
    value: string,
    onInferSQL: (unchecked_sql: UntrustedSqlFragment) => void
  ) => {
    const { unchecked_sql, valid } = await parseClientCode({ code: value })
    if (valid && unchecked_sql != null) {
      onInferSQL(unchecked_sql)
    } else {
      toast.error('Client library code provided is not valid')
    }
  }

  const { mutateAsync: parseQuery, error: parseQueryError } = useParseSQLQueryMutation({
    onError: () => {},
  })

  const { mutateAsync: getTableRLSStatus, error: getTableRLSStatusError } =
    useCheckTableRLSStatusMutation({
      onError: () => {},
    })

  /**
   * Returns true if the query was blocked (multiple statements, or an unacknowledged mutation)
   * and did not run, false if it ran (successfully or not)
   */
  const testQuery = async ({
    value,
    option,
    acknowledgeMutation = false,
    onExecuteSQL,
    onParseQuery,
    onValidationBlocked,
  }: {
    value: SafeSqlFragment
    option: 'anon' | 'authenticated'
    acknowledgeMutation?: boolean
    onExecuteSQL: ({
      result,
      operation,
      isAutoLimit,
    }: {
      result: Object[] | null
      operation: ParseSQLQueryOperations
      isAutoLimit: boolean
    }) => void
    onParseQuery: (results?: ParseQueryResults) => void
    onValidationBlocked: (reason: TestQueryBlockedReason) => void
  }): Promise<boolean> => {
    if (!project) {
      console.error('Project is required')
      return true
    }

    if (option === 'authenticated' && !user) {
      toast('Select which user to test as before running the query')
      return true
    }

    try {
      setIsLoading(true)
      setSandboxError(undefined)

      const { appendAutoLimit } = checkIfAppendLimitRequired(value, limit)
      const formattedSql = suffixWithLimit(value, limit)
      const data = await parseQuery({ sql: formattedSql })

      const blockedReason = getTestQueryBlockedReason({
        statementCount: data.statementCount,
        operation: data.operation,
        hasSandbox: !!sandbox,
        acknowledgeMutation,
      })
      if (blockedReason) {
        onValidationBlocked(blockedReason)
        return true
      }

      const formattedTables = data.tables.map((x) => {
        const [schema, table] = x.includes('.') ? x.split('.') : ['public', x]
        return { schema, table }
      })
      const response = await getTableRLSStatus({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        tables: formattedTables,
      })

      const tables = response
        .map(({ table, schema, rls_enabled }) => {
          const tablePolicies = filterTablePolicies({
            policies,
            schema,
            table,
            role: role?.role,
            operation: data.operation,
          })
          return {
            table,
            schema,
            isRLSEnabled: rls_enabled,
            tablePolicies,
          }
        })
        .sort((a, b) => {
          const aFirst = a.isRLSEnabled && a.tablePolicies.length === 0
          const bFirst = b.isRLSEnabled && b.tablePolicies.length === 0
          return Number(bFirst) - Number(aFirst)
        })

      const autoLimit = appendAutoLimit ? limit : undefined
      // UPDATE/DELETE are blocked above, so wrapReturnRowsAffected isn't wired in here yet -
      // it's kept for the follow-up PR that adds proper UPDATE/DELETE support
      const sql = wrapWithRoleImpersonation(formattedSql, impersonatedRoleState)

      try {
        const { result } = sandbox
          ? await sandbox.run({ sql }).catch((e) => {
              setSandboxError(e instanceof Error ? e : new Error(String(e)))
              throw e
            })
          : await executeSql({
              sql,
              autoLimit,
              projectRef: project.ref,
              connectionString: project.connectionString,
              isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRoleState.role),
              isStatementTimeoutDisabled: true,
              handleError: (e) => {
                throw e
              },
              queryKey: ['rls-tester'],
            })

        onExecuteSQL({ result, operation: data.operation, isAutoLimit: !!autoLimit })
        onParseQuery({ tables, operation: data.operation, role: role?.role, user })
      } catch (error) {
        const isRLSInsertError = Boolean(
          (error as ResponseError)?.message?.includes('new row violates row-level security policy')
        )
        onExecuteSQL({ result: null, operation: data.operation, isAutoLimit: false })
        if (isRLSInsertError) {
          onParseQuery({ tables, operation: data.operation, role: role?.role, user })
        } else {
          onParseQuery(undefined)
        }
      }
    } catch (error) {
      onExecuteSQL({ result: null, operation: undefined, isAutoLimit: false })
      onParseQuery(undefined)
    } finally {
      setIsLoading(false)
    }

    return false
  }

  return {
    limit,
    testQuery,
    inferSQLFromLib,
    isLoading,
    isInferring,
    executeSqlError,
    parseQueryError,
    parseClientCodeError,
    getTableRLSStatusError,
  }
}
