import { type SafeSqlFragment, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { useState } from 'react'
import { toast } from 'sonner'

import { checkIfAppendLimitRequired, suffixWithLimit } from '../../SQLEditor/SQLEditor.utils'
import { type ParseQueryResults } from './RLSTester.types'
import { filterTablePolicies } from './useTestQueryRLS.utils'
import { useParseClientCodeMutation } from '@/data/ai/parse-client-code-mutation'
import { useDatabasePoliciesQuery } from '@/data/database-policies/database-policies-query'
import { useCheckTableRLSStatusMutation } from '@/data/database/table-check-rls-mutation'
import { useParseSQLQueryMutation } from '@/data/misc/parse-query-mutation'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import {
  isRoleImpersonationEnabled,
  useGetImpersonatedRoleState,
  useImpersonatedUser,
  useRoleImpersonationStateSnapshot,
} from '@/state/role-impersonation-state'

const limit = 100

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

  const getImpersonatedRoleState = useGetImpersonatedRoleState()
  const impersonatedRoleState = getImpersonatedRoleState()
  const user = useImpersonatedUser()

  const [isLoading, setIsLoading] = useState(false)

  const { data: policies = [] } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutateAsync: executeSql, error: executeSqlError } = useExecuteSqlMutation({
    onError: () => {},
  })

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

  const testQuery = async ({
    value,
    option,
    onExecuteSQL,
    onParseQuery,
  }: {
    value: SafeSqlFragment
    option: 'anon' | 'authenticated'
    onExecuteSQL: ({
      result,
      isAutoLimit,
    }: {
      result: Object[] | null
      isAutoLimit: boolean
    }) => void
    onParseQuery: (results?: ParseQueryResults) => void
  }) => {
    if (!project) return console.error('Project is required')

    if (option === 'authenticated' && !user) {
      return toast('Select which user to test as before running the query')
    }

    try {
      setIsLoading(true)

      const { appendAutoLimit } = checkIfAppendLimitRequired(value, limit)
      const formattedSql = suffixWithLimit(value, limit)
      const data = await parseQuery({ sql: formattedSql })

      if (data.operation !== 'SELECT') {
        return toast('Only SELECT statements are supported for now')
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
      const { result } = await executeSql({
        autoLimit,
        projectRef: project.ref,
        connectionString: project.connectionString,
        sql: wrapWithRoleImpersonation(formattedSql, impersonatedRoleState),
        isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRoleState.role),
        isStatementTimeoutDisabled: true,
        handleError: (error) => {
          throw error
        },
        queryKey: ['rls-tester'],
      })

      onExecuteSQL({ result, isAutoLimit: !!autoLimit })

      onParseQuery({
        tables,
        operation: data.operation,
        role: role?.role,
        user,
      })
    } catch (error) {
      onExecuteSQL({ result: null, isAutoLimit: false })
      onParseQuery(undefined)
    } finally {
      setIsLoading(false)
    }
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
