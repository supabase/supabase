import { type PostgresPolicy } from '@supabase/postgres-meta'
import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import { RLSTableCard } from './RLSTableCard'
import { type User } from '@/data/auth/users-infinite-query'
import { useDatabasePoliciesQuery } from '@/data/database-policies/database-policies-query'
import { useCheckTableRLSStatusMutation } from '@/data/database/table-check-rls-mutation'
import {
  useParseSQLQueryMutation,
  type ParseSQLQueryResponse,
} from '@/data/misc/parse-query-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'
import {
  useGetImpersonatedRoleState,
  useRoleImpersonationStateSnapshot,
} from '@/state/role-impersonation-state'

type ParseQueryResults = {
  tables: {
    schema: string
    table: string
    tablePolicies: PostgresPolicy[]
    isRLSEnabled: boolean
  }[]
  operation: ParseSQLQueryResponse['operation']
  role?: string
  user?: User
  externalAuth?: string
}

export type UtilityTabRlsProps = {
  id: string
  isExecuting?: boolean
  ranQuery?: string
}

export const UtilityTabRls = ({ ranQuery }: UtilityTabRlsProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { role } = useRoleImpersonationStateSnapshot()

  const getImpersonatedRoleState = useGetImpersonatedRoleState()
  const impersonatedRoleState = getImpersonatedRoleState()

  const [parseResults, setParseResults] = useState<ParseQueryResults | null>()

  const { data: policies = [], isSuccess: isSuccessPolicies } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutateAsync: getTableRLSStatus } = useCheckTableRLSStatusMutation()
  const { mutateAsync: parseQuery, error: parseQueryError } = useParseSQLQueryMutation({
    onError: () => {},
  })

  const isServiceRole = parseResults?.role === undefined
  const tableWithRLSEnabledButNoPolicies = parseResults?.tables.find(
    (x) => x.isRLSEnabled && x.tablePolicies.length === 0
  )

  const parseQueryForRLSAccess = useStaticEffectEvent(async () => {
    if (!ranQuery) return

    const data = await parseQuery({ sql: ranQuery })

    if (data.operation === 'SELECT') {
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
          const tablePolicies = policies.filter(
            (x) =>
              x.schema === schema &&
              x.table === table &&
              x.roles.includes(role?.role ?? '') &&
              x.command === data.operation
          )
          return {
            table,
            schema,
            isRLSEnabled: rls_enabled,
            tablePolicies,
          }
        })
        .sort((a, b) => (a.isRLSEnabled && a.tablePolicies.length === 0 ? -1 : 1))

      const user =
        impersonatedRoleState.role?.type === 'postgrest' &&
        impersonatedRoleState.role.role === 'authenticated' &&
        impersonatedRoleState.role.userType === 'native'
          ? impersonatedRoleState.role.user
          : undefined

      const externalAuth =
        impersonatedRoleState.role?.type === 'postgrest' &&
        impersonatedRoleState.role.role === 'authenticated' &&
        impersonatedRoleState.role.userType === 'external' &&
        impersonatedRoleState.role.externalAuth
          ? impersonatedRoleState.role.externalAuth.sub
          : undefined

      setParseResults({ tables, operation: data.operation, role: role?.role, user, externalAuth })
    } else {
      setParseResults(null)
    }
  })

  useEffect(() => {
    if (isSuccessPolicies) parseQueryForRLSAccess()
  }, [isSuccessPolicies, parseQueryForRLSAccess])

  if (parseResults === undefined) {
    if (!ranQuery) {
      return (
        <div className="flex items-center bg-table-header-light p-4 min-h-[42px]">
          <p className="text-sm text-foreground-light">
            Click <code className="text-code-inline">Run</code> to execute your query
          </p>
        </div>
      )
    } else {
      return (
        <div className="p-4">
          <ShimmeringLoader />
        </div>
      )
    }
  }

  if (parseResults === null) {
    return (
      <div className="flex items-center bg-table-header-light p-4 min-h-[42px]">
        <p className="text-sm text-foreground-light">
          RLS checks are temporarily only available for{' '}
          <code className="text-code-inline">SELECT</code> statements
        </p>
      </div>
    )
  }

  if (parseResults.tables.length === 0) {
    return (
      <div className="flex items-center bg-table-header-light p-4 min-h-[42px]">
        <p className="text-sm text-foreground-light">
          Unable to find matching tables in database from query
        </p>
      </div>
    )
  }

  return (
    <div className="p-5 pt-4 max-w-5xl">
      <p className="mb-2 text-sm font-mono uppercase tracking-tight text-foreground-light">
        Summary
      </p>

      {!!parseResults && (
        <div className="border rounded flex items-center justify-between px-3 py-2 mb-2">
          <div className="flex items-center gap-x-2">
            <p className="text-xs text-foreground-light">Ran query as</p>
            {!parseResults.role ? (
              <code className="text-code-inline">postgres</code>
            ) : parseResults.user ? (
              <p className="text-sm truncate max-w-52">{parseResults.user.email}</p>
            ) : parseResults.externalAuth ? (
              <p className="text-sm truncate max-w-52">{parseResults.externalAuth}</p>
            ) : (
              <code className="text-code-inline">{parseResults.role}</code>
            )}
          </div>

          {parseResults.role === 'anon' && (
            <p className="text-foreground-light text-xs">Not logged in user</p>
          )}
          {!!parseResults.user && (
            <code className="text-code-inline">ID: {parseResults.user.id}</code>
          )}
        </div>
      )}

      {!isServiceRole && !!tableWithRLSEnabledButNoPolicies && (
        <Admonition showIcon={false} type="default" className="mb-4">
          <p className="!mb-0.5">
            Query returns no rows for the{' '}
            <code className="text-code-inline">{parseResults.role}</code> role
          </p>
          <p className="text-foreground-light">
            The table{' '}
            <code className="text-code-inline">
              {tableWithRLSEnabledButNoPolicies.schema}.{tableWithRLSEnabledButNoPolicies.table}
            </code>{' '}
            has RLS enabled but no policies set up for this role.
          </p>
        </Admonition>
      )}

      {isServiceRole ? (
        <Admonition showIcon={false} type="default" className="mb-4">
          <p className="!mb-0.5">
            Query returns all rows for the <code className="text-code-inline">postgres</code> role
          </p>
          <p className="text-foreground-light">
            The role has admin privileges and bypasses all RLS policies.
          </p>
        </Admonition>
      ) : (
        <>
          <p className="text-sm font-mono uppercase tracking-tight text-foreground-light mb-2">
            Policies applied
          </p>
          <div className="flex flex-col gap-y-2">
            {parseResults?.tables.map((x) => {
              const { schema, table, tablePolicies, isRLSEnabled } = x
              return (
                <RLSTableCard
                  key={`${schema}.${table}`}
                  table={{ schema, name: table, isRLSEnabled }}
                  role={parseResults.role}
                  policies={tablePolicies}
                  handleSelectEditPolicy={() => {}}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
