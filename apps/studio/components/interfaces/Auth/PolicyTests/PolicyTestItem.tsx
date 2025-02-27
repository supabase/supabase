import { Button, Input, cn, Switch, Badge, Label_Shadcn_, Input_Shadcn_ } from 'ui'
import { PolicyTest, PolicyTestRole } from './types'
import { ImpersonationRole, PostgrestRole, wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { User } from 'data/auth/users-infinite-query'
import { useParams } from 'common/hooks'
import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import { Check, Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { RoleImpersonationPopover } from 'components/interfaces/RoleImpersonationSelector'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { ResourceItem } from 'components/ui/Resource/ResourceItem'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Form_Shadcn_,
  FormField_Shadcn_,
  FormControl_Shadcn_,
  Card,
  CardContent,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useForm } from 'react-hook-form'

interface PolicyTestItemProps {
  test: PolicyTest
  onTestUpdate: (updatedTest: PolicyTest) => void
  onTestDelete: (testId: string) => void
  readOnly?: boolean
}

const PolicyTestItem = observer(
  ({ test, onTestUpdate, onTestDelete, readOnly = false }: PolicyTestItemProps) => {
    const { ref } = useParams()
    const project = useSelectedProject()
    const [open, setOpen] = useState(false)
    const [isRunning, setIsRunning] = useState(false)
    const [actualResult, setActualResult] = useState(test.actualResult || '')
    const [currentStatus, setCurrentStatus] = useState(test.status)
    const roleState = useRoleImpersonationStateSnapshot()

    // Use React Hook Form for form management
    const form = useForm({
      defaultValues: {
        name: test.name,
        sql: test.sql,
        willPass: !test.expectedResult.startsWith('Error:'),
        expectedResult: test.expectedResult,
        role: test.role,
      },
    })

    // Update form values when test changes
    useEffect(() => {
      form.reset({
        name: test.name,
        sql: test.sql,
        willPass: !test.expectedResult.startsWith('Error:'),
        expectedResult: test.expectedResult,
        role: test.role,
      })
      setActualResult(test.actualResult || '')
      setCurrentStatus(test.status)
    }, [test])

    // Add this effect to watch for changes in the global role state during editing
    useEffect(() => {
      if (open) {
        // When role state changes and we're in edit mode, update the form role
        const localRole = convertRoleStateToTestRole(roleState)
        form.setValue('role', localRole)
      }
    }, [roleState, open])

    // Add this effect to set the global role state when entering edit mode
    useEffect(() => {
      if (open && test.role) {
        // When entering edit mode, update the global role state to match the test's role
        syncTestRoleToGlobal(test.role)
      }
    }, [open])

    // Watch the willPass field to update the expectedResult format
    useEffect(() => {
      const subscription = form.watch((value, { name }) => {
        if (name === 'willPass') {
          const willPass = value.willPass
          const currentExpectedResult = form.getValues('expectedResult')

          if (willPass && currentExpectedResult.startsWith('Error:')) {
            // Switching from error to JSON
            form.setValue(
              'expectedResult',
              JSON.stringify({ rows: [], command: 'SELECT', rowCount: 0 }, null, 2)
            )
          } else if (!willPass && !currentExpectedResult.startsWith('Error:')) {
            // Switching from JSON to error
            form.setValue('expectedResult', 'Error: Query should fail with an error')
          }
        }
      })

      return () => subscription.unsubscribe()
    }, [form.watch])

    const { mutate: executeSql, isLoading: isExecuting } = useExecuteSqlMutation({
      onSuccess(data: { result: any }, variables: { sql: string }) {
        try {
          console.log('SQL execution successful, checking results:', data.result)

          // Update local state for immediate UI update
          setActualResult(JSON.stringify(data.result, null, 2))

          const willPass = form.getValues('willPass')

          // Check if we expect this test to pass or fail
          if (!willPass) {
            // If we expect an error but got a successful result
            setCurrentStatus('failed')

            // Update the test status via callback
            onTestUpdate({
              ...test,
              actualResult: JSON.stringify(data.result, null, 2),
              status: 'failed',
              expectedResult: 'Error: Query should fail with an error', // Ensure this is saved
            })

            toast.error('Test failed: Expected an error but query succeeded')
          } else {
            // Normal JSON comparison as before
            // Compare the actual result with the expected result
            let parsedExpected
            const expectedResult = form.getValues('expectedResult')
            try {
              parsedExpected = JSON.parse(expectedResult)
            } catch (e) {
              throw new Error('Invalid JSON in expected result')
            }

            // Format actual result for comparison
            const actualFormatted = JSON.stringify(data.result)
            const expectedFormatted = JSON.stringify(parsedExpected)

            const isEqual = actualFormatted === expectedFormatted

            // Update local state for immediate UI update
            setCurrentStatus(isEqual ? 'passed' : 'failed')

            // Update the test status via callback
            onTestUpdate({
              ...test,
              actualResult: JSON.stringify(data.result, null, 2),
              status: isEqual ? 'passed' : 'failed',
              expectedResult: expectedResult,
            })

            if (isEqual) {
              toast.success('Test passed! Results match the expected output.')
            } else {
              toast.error('Test failed. Results do not match the expected output.')
            }
          }

          // Reset loading state
          setIsRunning(false)
        } catch (error) {
          console.error('Error in onSuccess callback:', error)

          // Update local state for UI update
          setCurrentStatus('error')

          onTestUpdate({
            ...test,
            status: 'error',
            actualResult: `Error: Invalid JSON in expected result`,
          })
          toast.error('Error comparing results: Invalid JSON in expected result')

          // Reset loading state
          setIsRunning(false)
        }
      },
      onError(error: any) {
        console.error('SQL execution error:', error)
        const errorMessage = error.message || 'Unknown error occurred'

        // Update local state for immediate UI update
        setActualResult(`Error: ${errorMessage}`)

        const willPass = form.getValues('willPass')

        if (!willPass) {
          // If we expect this test to fail (and it did fail), it's a pass
          setCurrentStatus('passed')

          onTestUpdate({
            ...test,
            actualResult: `Error: ${errorMessage}`,
            status: 'passed',
            expectedResult: 'Error: Query should fail with an error', // Ensure this is saved
          })

          toast.success('Test passed! Query failed as expected.')
        } else {
          // If we expect this test to pass but it failed, it's a failure
          setCurrentStatus('error')

          onTestUpdate({
            ...test,
            status: 'error',
            actualResult: `Error: ${errorMessage}`,
            expectedResult: form.getValues('expectedResult'), // Keep expected result as JSON
          })

          toast.error(`Failed to execute query: ${errorMessage}`)
        }

        // Reset loading state
        setIsRunning(false)
      },
    })

    const handleRunTest = async () => {
      if (isExecuting) return
      setIsRunning(true)
      console.log('Running test:', form.getValues('name'))

      // Get current SQL to execute
      const sqlToExecute = form.getValues('sql')
      console.log('SQL to execute:', sqlToExecute)

      if (!sqlToExecute.trim()) {
        toast.error('Please enter SQL to execute')
        setIsRunning(false)
        return
      }

      // Use the test's local role for execution
      if (project?.ref) {
        try {
          const currentRole = form.getValues('role')
          const wrappedSql = await prepareSql(sqlToExecute, currentRole)
          console.log('Wrapped SQL:', wrappedSql)

          // When running a test, we need to determine if role impersonation is enabled
          // based on whether a role other than service_role is being used
          const isRoleImpersonationEnabled = Boolean(currentRole)

          executeSql({
            projectRef: project.ref,
            connectionString: project.connectionString,
            sql: wrappedSql,
            isRoleImpersonationEnabled,
          })
        } catch (error: any) {
          console.error('Error preparing SQL with role impersonation:', error)
          toast.error(`Role impersonation error: ${error.message || 'Unknown error'}`)
          setIsRunning(false)
        }
      } else {
        toast.error('Project reference not found')
        setIsRunning(false)
      }
    }

    const handleSave = (values: any) => {
      // Always sync the current role from global state before saving
      const syncedRole = convertRoleStateToTestRole(roleState)

      // Create updatedExpectedResult based on willPass state
      let updatedExpectedResult = values.expectedResult
      if (!values.willPass && !updatedExpectedResult.startsWith('Error:')) {
        updatedExpectedResult = 'Error: Query should fail with an error'
      } else if (values.willPass && updatedExpectedResult.startsWith('Error:')) {
        updatedExpectedResult = JSON.stringify(
          { rows: [], command: 'SELECT', rowCount: 0 },
          null,
          2
        )
      }

      const updatedTest: PolicyTest = {
        ...test,
        name: values.name,
        sql: values.sql,
        expectedResult: updatedExpectedResult,
        role: syncedRole,
      }
      onTestUpdate(updatedTest)
      setOpen(false)
    }

    const handleDelete = () => {
      onTestDelete(test.id)
      setOpen(false)
    }

    const statusVariant = {
      passed: 'success',
      failed: 'warning',
      running: 'default',
      error: 'destructive',
      queued: 'muted',
    }

    const formatImpersonationRole = (
      role: PolicyTestRole | undefined
    ): ImpersonationRole | undefined => {
      if (!role) return undefined

      if (role.role === 'anon') {
        return {
          type: 'postgrest',
          role: 'anon' as PostgrestRole,
        } as ImpersonationRole
      } else if (role.role === 'authenticated') {
        // Handle authenticated role
        const base = {
          type: 'postgrest',
          role: 'authenticated' as PostgrestRole,
          aal: role.aal || 'aal1',
        }

        // Native user authentication (with email)
        if (role.email) {
          const user: User = {
            id: role.userId || crypto.randomUUID(),
            email: role.email,
            phone: undefined,
            created_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            email_confirmed_at: new Date().toISOString(),
            phone_confirmed_at: undefined,
            confirmation_sent_at: undefined,
            recovery_sent_at: undefined,
            email_change_sent_at: undefined,
            banned_until: undefined,
            reauthentication_sent_at: undefined,
            is_anonymous: false,
            role: 'authenticated',
            raw_app_meta_data: {},
            raw_user_meta_data: {},
            updated_at: new Date().toISOString(),
            providers: [],
          }

          return {
            ...base,
            userType: 'native',
            user,
          } as ImpersonationRole
        }
        // External authentication
        else if (role.externalSub) {
          let additionalClaims = {}
          if (role.additionalClaims) {
            try {
              additionalClaims = JSON.parse(role.additionalClaims)
            } catch (e) {
              console.error('Failed to parse additional claims:', e)
            }
          }

          return {
            ...base,
            userType: 'external',
            externalAuth: {
              sub: role.externalSub,
              additionalClaims,
            },
          } as ImpersonationRole
        }

        // Default authenticated with no specific user - needs a userType
        return {
          ...base,
          userType: 'native',
          user: {
            id: crypto.randomUUID(),
            email: 'anonymous@example.com',
            phone: undefined,
            created_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            email_confirmed_at: new Date().toISOString(),
            phone_confirmed_at: undefined,
            confirmation_sent_at: undefined,
            recovery_sent_at: undefined,
            email_change_sent_at: undefined,
            banned_until: undefined,
            reauthentication_sent_at: undefined,
            is_anonymous: false,
            role: 'authenticated',
            raw_app_meta_data: {},
            raw_user_meta_data: {},
            updated_at: new Date().toISOString(),
            providers: [],
          },
        } as ImpersonationRole
      }

      return undefined
    }

    const prepareSql = async (sql: string, role: PolicyTestRole | undefined) => {
      try {
        // Skip formatting since we removed the formatSql import
        const formattedSql = sql

        const impersonationRole = formatImpersonationRole(role)

        // For diagnostics in development
        console.log('Role Impersonation:', {
          original: role,
          formatted: impersonationRole,
        })

        // Pass the project reference and role to wrapWithRoleImpersonation
        if (project?.ref) {
          return wrapWithRoleImpersonation(formattedSql, {
            projectRef: project.ref,
            role: impersonationRole,
          })
        } else {
          return formattedSql // Fallback without role impersonation
        }
      } catch (error) {
        console.error('Error preparing SQL with role impersonation:', error)
        throw error
      }
    }

    // Renamed function to make it clearer it's a conversion utility
    const convertRoleStateToTestRole = (roleState: any): PolicyTestRole | undefined => {
      if (!roleState.role) {
        return undefined // Use undefined for service_role
      }

      if (roleState.role.type === 'postgrest') {
        if (roleState.role.role === 'anon') {
          return {
            role: 'anon',
          }
        } else if (roleState.role.role === 'service_role') {
          return undefined // Use undefined for service_role
        } else if (roleState.role.role === 'authenticated') {
          const testRole: PolicyTestRole = {
            role: 'authenticated',
            aal: roleState.role.aal || 'aal1',
          }

          // Handle native user authentication
          if (roleState.role.userType === 'native' && roleState.role.user) {
            testRole.email = roleState.role.user.email
            testRole.userId = roleState.role.user.id
          }
          // Handle external auth
          else if (roleState.role.userType === 'external' && roleState.role.externalAuth) {
            testRole.externalSub = roleState.role.externalAuth.sub
            if (roleState.role.externalAuth.additionalClaims) {
              testRole.additionalClaims = JSON.stringify(
                roleState.role.externalAuth.additionalClaims
              )
            }
          }

          return testRole
        }
      }

      return undefined
    }

    // Function to sync from test role to global role state
    const syncTestRoleToGlobal = (testRole: PolicyTestRole) => {
      if (testRole.role === 'anon') {
        roleState.setRole({
          type: 'postgrest',
          role: 'anon' as PostgrestRole,
          userType: 'native',
        } as ImpersonationRole)
      } else if (testRole.role === 'authenticated') {
        if (testRole.email) {
          // Native user authentication
          const user: Partial<User> = {
            id: testRole.userId || crypto.randomUUID(),
            email: testRole.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            email_confirmed_at: new Date().toISOString(),
            reauthentication_sent_at: undefined,
            is_anonymous: false,
            role: 'authenticated',
            raw_app_meta_data: {},
            raw_user_meta_data: {},
            providers: [],
          }

          roleState.setRole({
            type: 'postgrest',
            role: 'authenticated' as PostgrestRole,
            userType: 'native',
            user: user as User,
            aal: testRole.aal || 'aal1',
          } as ImpersonationRole)
        } else if (testRole.externalSub) {
          // External authentication
          let additionalClaims = {}
          try {
            if (testRole.additionalClaims) {
              additionalClaims = JSON.parse(testRole.additionalClaims)
            }
          } catch (e) {
            console.error('Failed to parse additional claims:', e)
          }

          roleState.setRole({
            type: 'postgrest',
            role: 'authenticated' as PostgrestRole,
            userType: 'external',
            externalAuth: {
              sub: testRole.externalSub,
              additionalClaims,
            },
            aal: testRole.aal || 'aal1',
          } as ImpersonationRole)
        } else {
          // Basic authenticated role
          roleState.setRole({
            type: 'postgrest',
            role: 'authenticated' as PostgrestRole,
            userType: 'native',
            user: {
              id: crypto.randomUUID(),
              email: 'anonymous@example.com',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_sign_in_at: new Date().toISOString(),
              confirmed_at: new Date().toISOString(),
              email_confirmed_at: new Date().toISOString(),
              reauthentication_sent_at: undefined,
              is_anonymous: false,
              role: 'authenticated',
              raw_app_meta_data: {},
              raw_user_meta_data: {},
              providers: [],
            } as User,
            aal: testRole.aal || 'aal1',
          } as ImpersonationRole)
        }
      } else {
        // For service_role or any other case, we don't set any role (it's the default)
        roleState.setRole(undefined)
      }
    }

    // Get role display
    const getRoleDisplay = () => {
      const currentRole = form.getValues('role')
      if (!currentRole) {
        return 'service_role'
      } else {
        let display = currentRole.role
        if (currentRole.role === 'authenticated') {
          if (currentRole.email) {
            display += ` (${currentRole.email})`
          } else if (currentRole.externalSub) {
            display += ` (${currentRole.externalSub})`
          }
        }
        return display
      }
    }

    return (
      <>
        <ResourceItem onClick={() => setOpen(true)}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <div className="font-medium">{test.name}</div>
              <div className="text-xs font-mono uppercase text-foreground-light">
                {test.role ? test.role.role : 'service_role'}
              </div>
            </div>
            {currentStatus && (
              <Badge variant={statusVariant[currentStatus] as any}>
                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
              </Badge>
            )}
          </div>
        </ResourceItem>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent className="flex flex-col gap-0">
            <SheetHeader className="shrink-0">
              <SheetTitle>
                <div className="flex items-center justify-between">
                  <div>Policy Test</div>
                  {currentStatus && (
                    <Badge variant={statusVariant[currentStatus] as any} className="shrink-0">
                      {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                    </Badge>
                  )}
                </div>
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6">
              <Form_Shadcn_ {...form}>
                <FormField_Shadcn_
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Test Name"
                      layout="flex-row-reverse"
                      description="Descriptive name for this policy test"
                      className="mb-4"
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          className="w-64"
                          {...field}
                          placeholder="Test name"
                          disabled={readOnly}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                <div className="mb-2 flex justify-between items-center mb-4">
                  <div>
                    <div className="text-sm font-medium text-foreground mb-1">
                      Impersonated Role
                    </div>
                    <p className="text-sm text-foreground-lighter">
                      Queries will be run as the impersonated role.
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <RoleImpersonationPopover serviceRoleLabel="Service Role" />
                  </div>
                </div>

                <div className="mb-4">
                  <Label_Shadcn_ className="block mb-2">SQL Query</Label_Shadcn_>
                  <div className="border rounded h-40">
                    <Editor
                      height="100%"
                      language="sql"
                      theme="vs-dark"
                      value={form.getValues('sql')}
                      onChange={(value) => form.setValue('sql', value || '')}
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 13,
                        tabSize: 2,
                      }}
                    />
                  </div>
                </div>

                <FormField_Shadcn_
                  control={form.control}
                  name="willPass"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Will Pass"
                      className="mb-4"
                      description="If enabled, this test expects a successful result. If disabled, it expects an error."
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={readOnly}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                {form.watch('willPass') && (
                  <div className="mb-4">
                    <Label_Shadcn_ className="block mb-2">Expected Result</Label_Shadcn_>
                    <div className="border rounded">
                      <div className="h-40">
                        <Editor
                          height="100%"
                          language="json"
                          theme="vs-dark"
                          value={
                            form.getValues('expectedResult').startsWith('Error:')
                              ? JSON.stringify(
                                  { rows: [], command: 'SELECT', rowCount: 0 },
                                  null,
                                  2
                                )
                              : form.getValues('expectedResult')
                          }
                          onChange={(value) => form.setValue('expectedResult', value || '')}
                          options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            lineNumbers: 'on',
                            wordWrap: 'on',
                            fontSize: 13,
                            tabSize: 2,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {actualResult && (
                  <div className="mb-4">
                    <Label_Shadcn_ className="block mb-2">Actual Result</Label_Shadcn_>
                    <div className="border rounded">
                      <pre className="p-2 text-sm font-mono overflow-auto max-h-40 bg-surface-100">
                        {actualResult}
                      </pre>
                    </div>
                  </div>
                )}
              </Form_Shadcn_>
            </div>

            <SheetFooter className="shrink-0">
              <div className="flex items-center justify-between w-full">
                <Button type="default" onClick={handleDelete} disabled={readOnly}>
                  Delete Test
                </Button>
                <div className="flex items-center gap-x-3">
                  <Button type="default" onClick={() => setOpen(false)} disabled={isRunning}>
                    Cancel
                  </Button>
                  <Button
                    id={`run-test-${test.id}`}
                    onClick={handleRunTest}
                    loading={isRunning}
                    disabled={isRunning}
                    icon={
                      isRunning ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Play size={14} />
                      )
                    }
                  >
                    Run Test
                  </Button>
                  <Button onClick={form.handleSubmit(handleSave)} disabled={readOnly || isRunning}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </>
    )
  }
)

export default PolicyTestItem
