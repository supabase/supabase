import { type PostgresPolicy } from '@supabase/postgres-meta'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@ui/components/shadcn/ui/select'
import { Code, ListTodo } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'

import { RoleImpersonationPopover } from '../../RoleImpersonationSelector/RoleImpersonationPopover'
import { checkIfAppendLimitRequired, suffixWithLimit } from '../../SQLEditor/SQLEditor.utils'
import { Results } from '../../SQLEditor/UtilityPanel/Results'
import { RLSTableCard } from './RLSTableCard'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { useParseClientCodeMutation } from '@/data/ai/parse-client-code-mutation'
import type { User } from '@/data/auth/users-infinite-query'
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

  const [format, setFormat] = useState<'sql' | 'lib'>('sql')
  const [inferredSQL, setInferredSQL] = useState<string>()

  const [value, setValue] = useState<string>('')
  const [results, setResults] = useState<Object[] | null>(null)
  const [autoLimit, setAutoLimit] = useState(false)
  const [parseQueryResults, setParseQueryResults] = useState<ParseQueryResults>()

  const { data: policies = [] } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutateAsync: executeSql, error: executeSqlError } = useExecuteSqlMutation({
    onSuccess: (data, vars) => {
      setResults(data.result)
      setAutoLimit(!!vars.autoLimit)
    },
    onError: () => {},
  })
  const { mutateAsync: parseQuery, error: parseQueryError } = useParseSQLQueryMutation({
    onError: () => {},
  })
  const { mutateAsync: parseClientCode, error: parseClientCodeError } = useParseClientCodeMutation({
    onError: () => {},
  })
  const { mutateAsync: getTableRLSStatus } = useCheckTableRLSStatusMutation()

  const isServiceRole = parseQueryResults?.role === undefined
  const tableWithRLSEnabledButNoPolicies = parseQueryResults?.tables.find(
    (x) => x.isRLSEnabled && x.tablePolicies.length === 0
  )

  const onRunQuery = async () => {
    if (!project) return console.error('Project is required')

    try {
      setIsLoading(true)

      let formattedValue = value

      if (format === 'lib') {
        const { sql, valid } = await parseClientCode({ code: value })
        if (valid && !!sql) {
          formattedValue = sql
          setInferredSQL(sql)
        } else {
          return toast.error('Client library code provided is not valid')
        }
      }

      const { appendAutoLimit } = checkIfAppendLimitRequired(formattedValue, limit)
      const formattedSql = suffixWithLimit(formattedValue, limit)
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

        await executeSql({
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
        setParseQueryResults({
          tables,
          operation: data.operation,
          role: role?.role,
          user,
          externalAuth,
        })
      } else {
        toast('Only SELECT statements are supported for now')
      }
    } catch (error) {
      setResults(null)
      setParseQueryResults(undefined)
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

        <div className="flex-grow overflow-y-auto flex flex-col">
          <SheetSection className="px-0 py-0">
            <div className="flex items-center justify-between px-5 py-2">
              <p className="text-sm font-mono uppercase tracking-tight text-foreground-light">
                Query
              </p>
              <div className="flex items-center gap-x-2">
                <Select value={format} onValueChange={(x) => setFormat(x as 'sql' | 'lib')}>
                  <SelectTrigger size="tiny">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Query format</SelectLabel>
                      <SelectItem value="sql">SQL</SelectItem>
                      <SelectItem value="lib">Client library</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <RoleImpersonationPopover title="Run SQL query as" serviceRoleLabel="postgres" />
              </div>
            </div>

            <div className="h-44 relative">
              <CodeEditor
                id="rls-tester"
                language="pgsql"
                value={value}
                placeholder={
                  format === 'sql'
                    ? 'select * from table;'
                    : 'SQL will be inferred from client library code'
                }
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

          {format === 'lib' && !!inferredSQL && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 border-y">
                <p className="text-sm font-mono uppercase tracking-tight text-foreground-light">
                  Inferred SQL:
                </p>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="warning">Generated</Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end" className="w-64 text-center">
                    This query is inferred from client library code with the help of the Assistant
                    and may not guarantee correctness.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="h-44 relative">
                <CodeEditor isReadOnly id="inferred-sql" language="pgsql" value={inferredSQL} />
              </div>
            </div>
          )}

          <DialogSectionSeparator />

          {parseQueryError && (
            <div className="p-4">
              <Admonition
                type="warning"
                title="Error parsing query"
                description={parseQueryError.message}
              />
            </div>
          )}

          {parseClientCodeError && (
            <div className="p-4">
              <Admonition
                type="warning"
                title="Error parsing client code"
                description={parseClientCodeError.message}
              />
            </div>
          )}

          {executeSqlError && (
            <div className="p-4">
              <Admonition
                type="warning"
                title="Error running SQL query"
                description={executeSqlError.message}
              />
            </div>
          )}

          {results === null ? (
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
                <p className="mb-2 text-sm font-mono uppercase tracking-tight text-foreground-light">
                  Summary
                </p>

                {!!parseQueryResults && (
                  <div className="border rounded flex items-center justify-between px-3 py-2 mb-4">
                    <div className="flex items-center gap-x-2">
                      <p className="text-xs text-foreground-light">Ran as</p>
                      {!parseQueryResults.role ? (
                        <code className="text-code-inline">postgres</code>
                      ) : parseQueryResults.user ? (
                        <p className="text-sm truncate max-w-52">{parseQueryResults.user.email}</p>
                      ) : parseQueryResults.externalAuth ? (
                        <p className="text-sm truncate max-w-52">
                          {parseQueryResults.externalAuth}
                        </p>
                      ) : (
                        <code className="text-code-inline">{parseQueryResults.role}</code>
                      )}
                    </div>

                    {parseQueryResults.role === 'anon' && (
                      <p className="text-foreground-light text-xs">Not logged in user</p>
                    )}
                    {!!parseQueryResults.user && (
                      <code className="text-code-inline">ID: {parseQueryResults.user.id}</code>
                    )}
                  </div>
                )}

                {!isServiceRole && !!tableWithRLSEnabledButNoPolicies && (
                  <Admonition showIcon={false} type="default" className="mb-4">
                    <p className="!mb-0.5">
                      Query returns no rows for the{' '}
                      <code className="text-code-inline">{parseQueryResults.role}</code> role
                    </p>
                    <p className="text-foreground-light">
                      The table{' '}
                      <code className="text-code-inline">
                        {tableWithRLSEnabledButNoPolicies.schema}.
                        {tableWithRLSEnabledButNoPolicies.table}
                      </code>{' '}
                      has RLS enabled but no policies set up for this role.
                    </p>
                  </Admonition>
                )}

                {isServiceRole ? (
                  <Admonition showIcon={false} type="default" className="mb-4">
                    <p className="!mb-0.5">
                      Query returns all rows for the{' '}
                      <code className="text-code-inline">postgres</code> role
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

              <div className="px-5 py-3 flex items-center justify-between border-t">
                <span className="text-sm font-mono uppercase tracking-tight text-foreground-light">
                  Results
                </span>
                {results.length > 0 && (
                  <span className="font-mono text-xs text-foreground-light">
                    {results.length} row{results.length > 1 ? 's' : ''}
                    {autoLimit && results.length >= limit && ` (Limited to only ${limit} rows)`}
                  </span>
                )}
              </div>

              <div className="flex-grow flex flex-col h-56 border-t">
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
