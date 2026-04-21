import { type PostgresPolicy } from '@supabase/postgres-meta'
import { Code, ListTodo } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DialogSectionSeparator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'

import { RoleImpersonationPopover } from '../../RoleImpersonationSelector/RoleImpersonationPopover'
import { checkIfAppendLimitRequired, suffixWithLimit } from '../../SQLEditor/SQLEditor.utils'
import { Results } from '../../SQLEditor/UtilityPanel/Results'
import { RLSTableCard } from './RLSTableCard'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { useDatabasePoliciesQuery } from '@/data/database-policies/database-policies-query'
import { useCheckTableRLSStatusMutation } from '@/data/database/table-check-rls-mutation'
import {
  useParseSQLQueryMutation,
  type ParseSQLQueryResponse,
} from '@/data/misc/parse-query-mutation'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import {
  isRoleImpersonationEnabled,
  useGetImpersonatedRoleState,
  useRoleImpersonationStateSnapshot,
} from '@/state/role-impersonation-state'

const limit = 100

interface RLSTesterSheetProps {
  handleSelectEditPolicy: (policy: PostgresPolicy) => void
}

export const RLSTesterSheet = ({ handleSelectEditPolicy }: RLSTesterSheetProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { role } = useRoleImpersonationStateSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()
  const impersonatedRoleState = getImpersonatedRoleState()

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [value, setValue] = useState<string>('')
  const [results, setResults] = useState<Object[]>([])
  const [autoLimit, setAutoLimit] = useState(false)
  const [parseQueryResults, setParseQueryResults] = useState<{
    tables: {
      schema: string
      table: string
      tablePolicies: PostgresPolicy[]
      isRLSEnabled: boolean
    }[]
    operation: ParseSQLQueryResponse['operation']
    role?: string
  }>()

  const { data: policies = [] } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: executeSql, isSuccess } = useExecuteSqlMutation({
    onSuccess: (data, vars) => {
      setResults(data.result)
      setAutoLimit(!!vars.autoLimit)
    },
  })

  const { mutateAsync: parseQuery } = useParseSQLQueryMutation()
  const { mutateAsync: getTableRLSStatus } = useCheckTableRLSStatusMutation()

  const isServiceRole = parseQueryResults?.role === undefined
  const hasRLSEnabledButNoPolicies = parseQueryResults?.tables.some(
    (x) => x.isRLSEnabled && x.tablePolicies.length === 0
  )

  const onRunQuery = async () => {
    if (!project) return console.error('Project is required')

    const { appendAutoLimit } = checkIfAppendLimitRequired(value, limit)
    const formattedSql = suffixWithLimit(value, limit)

    try {
      setIsLoading(true)

      const data = await parseQuery({ sql: formattedSql })

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

        setParseQueryResults({ tables, operation: data.operation, role: role?.role })

        executeSql({
          projectRef: project.ref,
          connectionString: project.connectionString,
          sql: wrapWithRoleImpersonation(formattedSql, impersonatedRoleState),
          autoLimit: appendAutoLimit ? limit : undefined,
          isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRoleState.role),
          isStatementTimeoutDisabled: true,
          handleError: (error) => {
            throw error
          },
          queryKey: ['rls-tester'],
        })
      } else {
        toast('Only SELECT statements are supported for now')
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="default" icon={<Code />}>
          Test
        </Button>
      </SheetTrigger>

      <SheetContent className="!w-[600px] flex flex-col gap-y-0">
        <SheetHeader>
          <SheetTitle>Test RLS policies</SheetTitle>
          <SheetDescription>
            Preview query results as a specific user to validate your RLS policies
          </SheetDescription>
        </SheetHeader>

        <div className="grow overflow-y-auto">
          <SheetSection className="px-0 py-0">
            <div className="flex items-center justify-between px-5 py-2">
              <p className="text-sm">Query</p>
              <RoleImpersonationPopover title="Run SQL query as" />
            </div>
            <div className="h-56 relative">
              <CodeEditor
                id="rls-tester"
                language="pgsql"
                value={value}
                placeholder="select * from table;"
                onInputChange={(val) => setValue(val ?? '')}
                actions={{
                  runQuery: {
                    enabled: open,
                    callback: () => {
                      if (!isLoading) onRunQuery()
                    },
                  },
                }}
              />
            </div>
          </SheetSection>

          <DialogSectionSeparator />

          {results.length === 0 && !isSuccess ? (
            <div className="flex flex-col items-center justify-center h-64">
              <ListTodo className="mb-2 text-foreground-light" />
              <p className="text-foreground-light text-sm">
                Test summary and results will be shown here
              </p>
              <p className="text-foreground-lighter text-sm">
                Verify that the results match what your RLS policies allow
              </p>
            </div>
          ) : (
            <>
              <div className="p-5 pt-4">
                <p className="text-sm mb-2">Summary</p>
                {!isServiceRole && hasRLSEnabledButNoPolicies && (
                  <Admonition showIcon={false} className="mb-4" type="default">
                    <p className="!mb-0.5">
                      Query returns no rows for the{' '}
                      <code className="text-code-inline">{parseQueryResults.role}</code> role
                    </p>
                    <p className="text-foreground-light">
                      One of the tables has RLS enabled, but no policies set up for this role
                    </p>
                  </Admonition>
                )}

                {isServiceRole ? (
                  <Admonition
                    showIcon={false}
                    type="default"
                    title="Query returns all rows for the Postgres role"
                    description="Role has admin privileges and bypasses all RLS policies, all rows will be returned"
                  />
                ) : (
                  <>
                    <p className="text-xs font-mono uppercase tracking-tight text-foreground-light mb-2">
                      Table access
                    </p>
                    <div className="flex flex-col gap-y-2">
                      {parseQueryResults?.tables.map((x) => {
                        const { schema, table, tablePolicies, isRLSEnabled } = x
                        return (
                          <RLSTableCard
                            key={`${schema}.${table}`}
                            table={{ schema, name: table, isRLSEnabled }}
                            role={parseQueryResults.role}
                            policies={tablePolicies}
                            handleSelectEditPolicy={handleSelectEditPolicy}
                          />
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              <DialogSectionSeparator />

              <div className="px-5 py-3 text-sm flex items-center justify-between">
                <span>Results</span>
                {results.length > 0 && (
                  <span className="font-mono text-xs text-foreground-light">
                    {results.length} row{results.length > 1 ? 's' : ''}
                    {autoLimit && results.length >= limit && ` (Limited to only ${limit} rows)`}
                  </span>
                )}
              </div>
              <div className="flex flex-col h-56 border-t">
                <Results rows={results} />
              </div>
            </>
          )}
        </div>

        <SheetFooter>
          <Button type="default" disabled={isLoading} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="primary" loading={isLoading} onClick={onRunQuery}>
            Run query
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
