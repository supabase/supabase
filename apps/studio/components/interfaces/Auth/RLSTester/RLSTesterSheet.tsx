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
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  cn,
  DialogSectionSeparator,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { checkIfAppendLimitRequired, suffixWithLimit } from '../../SQLEditor/SQLEditor.utils'
import { Results } from '../../SQLEditor/UtilityPanel/Results'
import { RLSTableCard } from './RLSTableCard'
import { UserSelector } from './UserSelector'
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
  const { role, setRole } = useRoleImpersonationStateSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()
  const impersonatedRoleState = getImpersonatedRoleState()

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'anon' | 'authenticated'>('anon')

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

    if (selectedOption === 'authenticated' && !user) {
      return toast('Select which user to test as before running the query')
    }

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
          .sort((a, b) => {
            const aFirst = a.isRLSEnabled && a.tablePolicies.length === 0
            const bFirst = b.isRLSEnabled && b.tablePolicies.length === 0
            return Number(bFirst) - Number(aFirst)
          })

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

  useEffect(() => {
    setRole({ type: 'postgrest', role: 'anon' })

    // Flip back to service role
    return () => {
      setRole(undefined)
    }
  }, [setRole])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="default" icon={<Code />}>
          Test
        </Button>
      </SheetTrigger>

      <SheetContent className="!w-[600px] flex flex-col gap-y-0">
        <SheetHeader>
          <SheetTitle>What data can my users see?</SheetTitle>
          <SheetDescription>
            See what data a user is allowed to read based on your RLS policies
          </SheetDescription>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto flex flex-col">
          <SheetSection className="px-0 py-0">
            <div className="flex flex-col p-5 pt-4 gap-y-4">
              <FormItemLayout isReactForm={false} label="Test as">
                <RadioGroupStacked defaultValue={role?.role ?? 'anon'}>
                  <RadioGroupStackedItem
                    value="anon"
                    id="anon"
                    label="Anonymous user"
                    description="Not logged in"
                    onClick={() => {
                      setSelectedOption('anon')
                      setRole({ type: 'postgrest', role: 'anon' })
                    }}
                  />
                  <RadioGroupStackedItem
                    value="authenticated"
                    id="authenticated"
                    label="Authenticated user"
                    description="A specific logged in user"
                    onClick={() => {
                      setSelectedOption('authenticated')
                    }}
                  />
                </RadioGroupStacked>
              </FormItemLayout>
              {selectedOption === 'authenticated' && <UserSelector />}
            </div>

            <DialogSectionSeparator />

            <div className="flex items-center justify-between px-5 py-2">
              <p className="text-sm">Query</p>
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
              </div>
            </div>

            <div className="h-40 relative">
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
              <DialogSectionSeparator />
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-sm">Inferred SQL:</p>
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
            <div className="p-5 pt-4">
              <div className="flex items-center gap-x-2 mb-2">
                <p className="text-sm">Summary</p>
                {!isServiceRole && !!tableWithRLSEnabledButNoPolicies ? (
                  <Badge variant="destructive">No access</Badge>
                ) : (
                  <Badge variant="success">
                    {results.length > 0 ? 'Can access' : 'Has access'}
                  </Badge>
                )}
              </div>

              <Tabs_Shadcn_ defaultValue="policies">
                <TabsList_Shadcn_ className="gap-x-3">
                  <TabsTrigger_Shadcn_ value="policies" className="px-2">
                    Policies applied
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ value="data" className="px-2">
                    Data preview
                  </TabsTrigger_Shadcn_>
                </TabsList_Shadcn_>

                {!!parseQueryResults && (
                  <div className="border rounded flex items-center justify-between px-3 py-1.5 mt-3">
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
                      ) : parseQueryResults.role === 'anon' ? (
                        <p className="text-xs">an Anonymous user</p>
                      ) : null}
                    </div>

                    {parseQueryResults.role === 'anon' && (
                      <p className="text-foreground-light text-xs">Not logged in user</p>
                    )}
                    {!!parseQueryResults.user && (
                      <code className="text-code-inline">ID: {parseQueryResults.user.id}</code>
                    )}
                  </div>
                )}

                <TabsContent_Shadcn_ value="policies">
                  {!isServiceRole && !!tableWithRLSEnabledButNoPolicies && (
                    <Admonition showIcon={false} type="default">
                      <p className="!mb-0.5">
                        Anonymous users do not have access to data from this query
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

                  {isServiceRole && (
                    <Admonition showIcon={false} type="default">
                      <p className="!mb-0.5">
                        Query returns all rows for the{' '}
                        <code className="text-code-inline">postgres</code> role
                      </p>
                      <p className="text-foreground-light">
                        The role has admin privileges and bypasses all RLS policies.
                      </p>
                    </Admonition>
                  )}

                  <div className="flex flex-col gap-y-2 mt-4">
                    <p className="text-sm">Table access</p>
                    {!isServiceRole && (
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
                    )}
                  </div>
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ value="data" className="mt-3">
                  <div
                    className={cn(
                      'flex-grow flex flex-col border overflow-hidden',
                      results.length === 0 ? 'rounded h-32' : 'rounded-t h-56'
                    )}
                  >
                    <Results rows={results} />
                  </div>
                  {results.length > 0 && (
                    <p className="border border-t-0 rounded-b font-mono text-xs text-foreground-light p-2">
                      {results.length} row{results.length > 1 ? 's' : ''}
                      {autoLimit && results.length >= limit && ` (Limited to only ${limit} rows)`}
                    </p>
                  )}
                </TabsContent_Shadcn_>
              </Tabs_Shadcn_>
            </div>
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
