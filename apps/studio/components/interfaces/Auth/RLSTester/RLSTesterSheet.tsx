import { getEvaluatedPoliciesForQuery } from '@supabase/pg-meta'
import { ChevronsUpDown, Code, ListTodo } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  DialogSectionSeparator,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { RoleImpersonationSelector } from '../../RoleImpersonationSelector'
import { checkIfAppendLimitRequired, suffixWithLimit } from '../../SQLEditor/SQLEditor.utils'
import Results from '../../SQLEditor/UtilityPanel/Results'
import { getDisplayName } from '../Users/Users.utils'
import CodeEditor from '@/components/ui/CodeEditor/CodeEditor'
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

export const RLSTesterSheet = () => {
  const { data: project } = useSelectedProjectQuery()
  const { role, setRole } = useRoleImpersonationStateSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()
  const impersonatedRoleState = getImpersonatedRoleState()

  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<string>('')
  const [results, setResults] = useState<Object[]>([])
  const [autoLimit, setAutoLimit] = useState(false)

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

  useHotKey(
    (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (!isPending) onRunQuery()
    },
    'Enter',
    { enabled: open }
  )

  const currentRole = role?.role
  const authenticatedUserLabel = useMemo(() => {
    if (role?.type !== 'postgrest' || role.role !== 'authenticated') return undefined

    const userType = role.userType

    if (userType === 'native' && role.user) {
      const user = role.user
      return getDisplayName(user, user.email ?? user.phone ?? user.id ?? 'Unknown')
    } else if (userType === 'external' && role.externalAuth) {
      return role.externalAuth.sub
    } else {
      return undefined
    }
  }, [role])

  const roleLabel =
    currentRole === 'anon' ? (
      <>
        Anonymous
        <span className="text-foreground-lighter ml-2">Not logged in</span>
      </>
    ) : (
      <>
        {authenticatedUserLabel}
        <span className="text-foreground-lighter ml-2">
          {role?.type === 'postgrest' && role.role === 'authenticated' && role?.aal === 'aal2'
            ? 'AAL2'
            : 'AAL1'}
        </span>
      </>
    )

  const onRunQuery = () => {
    if (!project) return console.error('Project is required')

    const limit = 100
    const { appendAutoLimit } = checkIfAppendLimitRequired(value, limit)
    const formattedSql = suffixWithLimit(value, limit)

    const xxx =
      role?.type === 'postgrest' && role.role !== 'service_role'
        ? getEvaluatedPoliciesForQuery({ sql: value, role: role.role })
        : undefined
    console.log(xxx)

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
          <SheetSection className="px-0 pb-0 pt-3">
            <FormItemLayout isReactForm={false} label="Query" className="[&>*>label]:px-5">
              <div className="h-44">
                <CodeEditor
                  id="rls-tester"
                  language="pgsql"
                  value={value}
                  onInputChange={(val) => setValue(val ?? '')}
                />
              </div>
            </FormItemLayout>
          </SheetSection>

          <SheetSection className="pb-5">
            <div className="flex flex-col gap-y-4">
              <FormItemLayout isReactForm={false} label="Run the query as">
                <Popover_Shadcn_ modal>
                  <PopoverTrigger_Shadcn_ asChild>
                    <Button
                      type="default"
                      size="small"
                      className="w-full justify-between"
                      iconRight={<ChevronsUpDown />}
                    >
                      {roleLabel}
                    </Button>
                  </PopoverTrigger_Shadcn_>
                  <PopoverContent_Shadcn_
                    className="p-0 overflow-hidden w-[540px]"
                    side="bottom"
                    align="end"
                  >
                    <RoleImpersonationSelector disallowServiceRoleOption />
                  </PopoverContent_Shadcn_>
                </Popover_Shadcn_>
              </FormItemLayout>
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
              <div>
                <p className="px-5 py-3 text-sm">Results</p>
                <div className="flex flex-col h-56 border-t">
                  <Results rows={results} />
                </div>
                <div className="px-5 py-2 border-y font-mono text-xs text-foreground-light">
                  {results.length} rows{autoLimit && ' (Limited to only 100 rows)'}
                </div>
              </div>
              <div className="px-5 py-3">
                <p className="text-sm">Policies evaluated</p>
                <p>asd</p>
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
