import { PostgresPolicy } from '@supabase/postgres-meta'
import { Code, ListTodo } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import {
  useParseSQLQueryMutation,
  type ParseSQLQueryResponse,
} from '@/data/misc/parse-query-mutation'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useHotKey } from '@/hooks/ui/useHotKey'
import { wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import {
  isRoleImpersonationEnabled,
  useGetImpersonatedRoleState,
  useRoleImpersonationStateSnapshot,
} from '@/state/role-impersonation-state'

/**
 * This feels very similar to the inline editor, so tbh I'm open to consolidate them
 * Just spiking the UX for now
 */

interface RLSTesterSheetProps {
  handleSelectEditPolicy: (policy: PostgresPolicy) => void
}

const limit = 100

export const RLSTesterSheet = ({ handleSelectEditPolicy }: RLSTesterSheetProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { role, setRole } = useRoleImpersonationStateSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()
  const impersonatedRoleState = getImpersonatedRoleState()

  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<string>('')
  const [results, setResults] = useState<Object[]>([])
  const [autoLimit, setAutoLimit] = useState(false)
  const [queryRole, setQueryRole] = useState<string>()
  const [parseQueryResults, setParseQueryResults] = useState<ParseSQLQueryResponse>()

  const {
    mutate: executeSql,
    isPending,
    isSuccess,
  } = useExecuteSqlMutation({
    onSuccess: (data, vars) => {
      setResults(data.result)
      setAutoLimit(!!vars.autoLimit)
    },
  })

  const { mutate: parseQuery } = useParseSQLQueryMutation({
    onSuccess: (data) => {
      console.log('PARSE', data)
      setParseQueryResults(data)

      // With this data, check if the table has RLS enabled
    },
  })

  useHotKey(
    (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (!isPending) onRunQuery()
    },
    'Enter',
    { enabled: open }
  )

  const onRunQuery = () => {
    if (!project) return console.error('Project is required')

    const { appendAutoLimit } = checkIfAppendLimitRequired(value, limit)
    const formattedSql = suffixWithLimit(value, limit)

    setQueryRole(role?.role)
    parseQuery({ sql: formattedSql })
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
    })
  }

  useEffect(() => {
    setRole({ type: 'postgrest', role: 'anon' })
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
          <SheetTitle>Test RLS policies</SheetTitle>
          <SheetDescription>
            Preview query results as a specific user to validate your RLS policies
          </SheetDescription>
        </SheetHeader>

        <div className="grow">
          <SheetSection className="px-0 py-0">
            <div className="flex items-center justify-between px-5 py-2">
              <p className="text-sm">Query</p>
              <RoleImpersonationPopover />
            </div>
            <div className="h-56">
              <CodeEditor
                id="rls-tester"
                language="pgsql"
                value={value}
                onInputChange={(val) => setValue(val ?? '')}
              />
            </div>
          </SheetSection>

          <DialogSectionSeparator />

          {results.length === 0 && !isSuccess ? (
            <div className="flex flex-col items-center justify-center h-64">
              <ListTodo className="mb-2 text-foreground-light" />
              <p className="text-foreground-light text-sm">Query results will be shown here</p>
              <p className="text-foreground-lighter text-sm">
                Verify that the results match what your RLS policies allow
              </p>
            </div>
          ) : (
            <>
              <div className="p-5 pt-4">
                <p className="text-sm mb-4">Summary</p>
                {queryRole === undefined ? (
                  <Admonition
                    showIcon={false}
                    type="default"
                    title="Query was ran as the Postgres role"
                    description="Role has admin privileges and bypasses all RLS policies, all rows will be returned"
                  />
                ) : (
                  <>
                    <p className="text-xs font-mono uppercase tracking-tight text-foreground-light mb-2">
                      Table access
                    </p>
                    <div className="flex flex-col gap-y-2">
                      {parseQueryResults?.tables.map((x) => {
                        const [schema, table] = x.includes('.') ? x.split('.') : ['public', x]

                        return (
                          <RLSTableCard
                            key={x}
                            schema={schema}
                            table={table}
                            role={queryRole}
                            operation={parseQueryResults.operation}
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
                <span className="font-mono text-xs text-foreground-light">
                  {results.length} row{results.length > 1 ? 's' : ''}
                  {autoLimit && results.length >= limit && ` (Limited to only ${limit} rows)`}
                </span>
              </div>
              <div className="flex flex-col h-56 border-t">
                <Results rows={results} />
              </div>
            </>
          )}
        </div>

        <SheetFooter>
          <Button type="default" disabled={isPending} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="primary" loading={isPending} onClick={onRunQuery}>
            Run query
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
