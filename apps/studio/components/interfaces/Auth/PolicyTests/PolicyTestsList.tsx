import { ArrowRight, Loader2, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { Button, Input, Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from 'ui'
import PolicyTestItem from './PolicyTestItem'
import { LOCAL_STORAGE_KEYS, PolicyTest, PolicyTestRole } from './types'
import { v4 as uuidv4 } from 'uuid'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { RoleImpersonationPopover } from 'components/interfaces/RoleImpersonationSelector'
import {
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { ImpersonationRole } from 'lib/role-impersonation'

// Define a type for policy test status
type PolicyTestStatus = 'passed' | 'failed' | 'running' | 'error' | 'queued'

interface PolicyTestsListProps {
  // Additional props if needed
}

const PolicyTestsList = ({}: PolicyTestsListProps) => {
  const { ref } = useParams()
  const [newTestName, setNewTestName] = useState('')
  const [newTestOpen, setNewTestOpen] = useState(false)
  const [isRunningAllTests, setIsRunningAllTests] = useState(false)
  const roleState = useRoleImpersonationStateSnapshot()
  const project = useSelectedProject()
  const [diagResult, setDiagResult] = useState<any>(null)
  const [showDiagResult, setShowDiagResult] = useState(false)

  // We store tests by project ref in local storage
  const storageKey = `${LOCAL_STORAGE_KEYS.POLICY_TESTS}-${ref}`

  const [tests, setTests] = useLocalStorageQuery<PolicyTest[]>(storageKey, [])

  // For running diagnostics
  const { mutate: executeSql, isLoading: isDiagnosticRunning } = useExecuteSqlMutation({
    onSuccess(data) {
      setDiagResult(JSON.stringify(data.result, null, 2))
      setShowDiagResult(true)
    },
    onError(error: any) {
      setDiagResult('Error: ' + error.message)
      setShowDiagResult(true)
    },
  })

  // Current test state for running all tests
  const [currentTestIndex, setCurrentTestIndex] = useState<number>(-1)
  const [updatedTests, setUpdatedTests] = useState<PolicyTest[]>([])

  // For running individual tests in the loop
  const { mutate: executeTestSql, isLoading: isTestRunning } = useExecuteSqlMutation({
    onSuccess(data) {
      if (currentTestIndex === -1) return

      const currentTest = updatedTests[currentTestIndex]
      const willPass = !currentTest.expectedResult.startsWith('Error:')
      let newStatus: PolicyTestStatus
      let newActualResult: string

      try {
        if (!willPass) {
          // If we expected an error but got a successful result, test failed
          newStatus = 'failed'
          newActualResult = JSON.stringify(data.result, null, 2)

          updatedTests[currentTestIndex] = {
            ...currentTest,
            actualResult: newActualResult,
            status: newStatus,
          }
          console.log('Test failed: Expected an error but query succeeded')
        } else {
          // Normal JSON comparison
          let parsedExpected
          try {
            parsedExpected = JSON.parse(currentTest.expectedResult)
          } catch (e) {
            newStatus = 'error'
            newActualResult = `Error: Invalid JSON in expected result`

            updatedTests[currentTestIndex] = {
              ...currentTest,
              status: newStatus,
              actualResult: newActualResult,
            }
            console.error('Error comparing results: Invalid JSON in expected result')
            setUpdatedTests([...updatedTests])

            // Also update the main tests state
            const updatedMainTests = [...tests]
            const mainTestIndex = updatedMainTests.findIndex((t) => t.id === currentTest.id)
            if (mainTestIndex >= 0) {
              updatedMainTests[mainTestIndex] = {
                ...updatedMainTests[mainTestIndex],
                status: newStatus,
                actualResult: newActualResult,
              }
              setTests(updatedMainTests)
            }

            runNextTest()
            return
          }

          // Compare the results
          const actualFormatted = JSON.stringify(data.result)
          const expectedFormatted = JSON.stringify(parsedExpected)
          const isEqual = actualFormatted === expectedFormatted

          newStatus = isEqual ? 'passed' : 'failed'
          newActualResult = JSON.stringify(data.result, null, 2)

          updatedTests[currentTestIndex] = {
            ...currentTest,
            actualResult: newActualResult,
            status: newStatus,
          }

          if (isEqual) {
            console.log('Test passed! Results match the expected output.')
          } else {
            console.log('Test failed. Results do not match the expected output.')
          }
        }

        setUpdatedTests([...updatedTests])

        // Also update the main tests state
        const updatedMainTests = [...tests]
        const mainTestIndex = updatedMainTests.findIndex((t) => t.id === currentTest.id)
        if (mainTestIndex >= 0) {
          updatedMainTests[mainTestIndex] = {
            ...updatedMainTests[mainTestIndex],
            status: newStatus,
            actualResult: newActualResult,
          }
          setTests(updatedMainTests)
        }

        // Continue to the next test
        runNextTest()
      } catch (error) {
        console.error('Error processing SQL result:', error)
        failCurrentTest(
          `Error processing SQL result: ${(error as Error).message || 'Unknown error'}`
        )
      }
    },
    onError(error: any) {
      if (currentTestIndex === -1) return

      const currentTest = updatedTests[currentTestIndex]
      const willPass = !currentTest.expectedResult.startsWith('Error:')
      const errorMessage = error.message || 'Unknown error occurred'
      let newStatus: PolicyTestStatus
      let newActualResult: string

      console.error('SQL execution error:', error)

      if (!willPass) {
        // If we expect this test to fail (and it did fail), it's a pass
        newStatus = 'passed'
        newActualResult = `Error: ${errorMessage}`

        updatedTests[currentTestIndex] = {
          ...currentTest,
          actualResult: newActualResult,
          status: newStatus,
        }
        console.log('Test passed! Query failed as expected.')
      } else {
        // If we expect this test to pass but it failed, it's a failure
        newStatus = 'error'
        newActualResult = `Error: ${errorMessage}`

        updatedTests[currentTestIndex] = {
          ...currentTest,
          status: newStatus,
          actualResult: newActualResult,
        }
        console.error(`Failed to execute query: ${errorMessage}`)
      }

      setUpdatedTests([...updatedTests])

      // Also update the main tests state
      const updatedMainTests = [...tests]
      const mainTestIndex = updatedMainTests.findIndex((t) => t.id === currentTest.id)
      if (mainTestIndex >= 0) {
        updatedMainTests[mainTestIndex] = {
          ...updatedMainTests[mainTestIndex],
          status: newStatus,
          actualResult: newActualResult,
        }
        setTests(updatedMainTests)
      }

      // Continue to the next test
      runNextTest()
    },
  })

  // Run diagnostics to show RLS policies
  const runDiagnostics = () => {
    if (!project?.ref) return

    const sql = `
    -- First show what tables exist
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema') 
    ORDER BY table_schema, table_name;

    -- Then check what RLS policies exist
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
    FROM pg_policies;
    `

    console.log('=== DIAGNOSTICS DEBUG ===')
    console.log('Running diagnostics with SQL:', sql)
    console.log('Project ref:', project.ref)
    console.log('Connection string exists:', Boolean(project.connectionString))

    executeSql({
      projectRef: project.ref,
      connectionString: project.connectionString,
      sql,
    })
  }

  // Helper function to mark the current test as failed
  const failCurrentTest = (errorMessage: string) => {
    if (currentTestIndex === -1 || !updatedTests[currentTestIndex]) return

    const currentTest = updatedTests[currentTestIndex]
    updatedTests[currentTestIndex] = {
      ...currentTest,
      status: 'error' as PolicyTestStatus,
      actualResult: `Error: ${errorMessage}`,
    }

    setUpdatedTests([...updatedTests])

    // Also update the main tests state to reflect the error status in the UI
    const updatedMainTests = [...tests]
    const mainTestIndex = updatedMainTests.findIndex((t) => t.id === currentTest.id)
    if (mainTestIndex >= 0) {
      updatedMainTests[mainTestIndex] = {
        ...updatedMainTests[mainTestIndex],
        status: 'error' as PolicyTestStatus,
        actualResult: `Error: ${errorMessage}`,
      }
      setTests(updatedMainTests)
    }

    runNextTest()
  }

  // Helper function to run the next test in the queue
  const runNextTest = async () => {
    // Move to the next test
    const nextIndex = currentTestIndex + 1

    // If we've processed all tests, we're done
    if (nextIndex >= updatedTests.length) {
      // Save the final test results
      setTests([...updatedTests])
      setCurrentTestIndex(-1)
      setIsRunningAllTests(false)
      toast.success('All tests completed')
      return
    }

    // Update the current test index
    setCurrentTestIndex(nextIndex)

    // Get the next test
    const nextTest = updatedTests[nextIndex]
    console.log(`Running test: ${nextTest.name} (${nextTest.id})`)

    // Mark it as running
    updatedTests[nextIndex] = { ...nextTest, status: 'running' as PolicyTestStatus }
    setUpdatedTests([...updatedTests])

    // Also update the main tests state to reflect the running status in the UI
    const updatedMainTests = [...tests]
    const mainTestIndex = updatedMainTests.findIndex((t) => t.id === nextTest.id)
    if (mainTestIndex >= 0) {
      updatedMainTests[mainTestIndex] = {
        ...updatedMainTests[mainTestIndex],
        status: 'running' as PolicyTestStatus,
      }
      setTests(updatedMainTests)
    }

    // Prepare to run the test
    if (!project?.ref) {
      failCurrentTest('Project reference not found')
      return
    }

    try {
      // Format role impersonation
      const formatImpersonationRole = (
        role: PolicyTestRole | undefined
      ): ImpersonationRole | undefined => {
        if (!role) return undefined

        if (role.role === 'anon') {
          return {
            type: 'postgrest',
            role: 'anon',
          } as ImpersonationRole
        } else if (role.role === 'authenticated') {
          const base = {
            type: 'postgrest',
            role: 'authenticated',
            aal: role.aal || 'aal1',
          } as Partial<ImpersonationRole>

          if (role.email) {
            return {
              ...base,
              userType: 'native',
              user: {
                id: role.userId || crypto.randomUUID(),
                email: role.email,
                is_anonymous: false,
                role: 'authenticated',
              },
            } as ImpersonationRole
          } else if (role.externalSub) {
            let additionalClaims = {}
            try {
              if (role.additionalClaims) {
                additionalClaims = JSON.parse(role.additionalClaims)
              }
            } catch (e) {
              console.error('Failed to parse additional claims:', e)
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

          return {
            ...base,
            userType: 'native',
            user: {
              id: crypto.randomUUID(),
              email: 'anonymous@example.com',
              is_anonymous: false,
              role: 'authenticated',
            },
          } as ImpersonationRole
        }

        return undefined
      }

      // Wrap SQL with role impersonation
      const prepareSql = async (sql: string, role: PolicyTestRole | undefined) => {
        try {
          const impersonationRole = formatImpersonationRole(role)

          // Pass the project reference and role to wrapWithRoleImpersonation
          if (project?.ref) {
            // Import explicitly to avoid hook-related issues
            const { wrapWithRoleImpersonation } = await import('lib/role-impersonation')
            return await wrapWithRoleImpersonation(sql, {
              projectRef: project.ref,
              role: impersonationRole,
            })
          } else {
            return sql
          }
        } catch (error) {
          console.error('Error preparing SQL with role impersonation:', error)
          throw error
        }
      }

      // Prepare the SQL query with role impersonation
      const wrappedSql = await prepareSql(nextTest.sql, nextTest.role)
      const isRoleImpersonationEnabled = Boolean(nextTest.role)

      // Execute the test
      executeTestSql({
        projectRef: project.ref,
        connectionString: project.connectionString,
        sql: wrappedSql,
        isRoleImpersonationEnabled,
      })

      // Add a small delay to avoid overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error: any) {
      console.error(`Error running test ${nextTest.id}:`, error)
      failCurrentTest(error.message || 'Unknown error during test preparation')
    }
  }

  // Effect to start test execution after states are updated
  useEffect(() => {
    // Only run if we're in the "running all tests" mode and currentTestIndex is -1 (initial state)
    if (isRunningAllTests && currentTestIndex === -1 && updatedTests.length > 0) {
      // This effect will run after the state has been updated
      runNextTest()
    }
  }, [isRunningAllTests, currentTestIndex, updatedTests])

  const runAllTests = async () => {
    if (tests.length === 0) {
      toast.info('No tests to run')
      return
    }

    if (isDiagnosticRunning || isTestRunning) {
      toast.info('Tests are already running')
      return
    }

    // Create a copy of tests with all statuses set to 'queued'
    const testsInProgress = tests.map((test) => ({
      ...test,
      status: 'queued' as PolicyTestStatus, // Use 'queued' instead of 'running'
    }))

    // Update both state variables - this will update the UI immediately
    setTests(testsInProgress) // Update the main tests state for UI
    setUpdatedTests(testsInProgress) // Keep the updatedTests state for test execution
    setCurrentTestIndex(-1)
    setIsRunningAllTests(true)
    toast.info(`Running ${tests.length} tests...`)

    // We don't call runNextTest() directly here anymore
    // The useEffect hook will handle that after state updates
  }

  // Convert the global role state to our simplified test role format
  const convertToTestRole = (): PolicyTestRole | undefined => {
    if (!roleState.role) return undefined

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
          aal: roleState.role.aal,
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
            testRole.additionalClaims = JSON.stringify(roleState.role.externalAuth.additionalClaims)
          }
        }

        return testRole
      }
    }

    return undefined
  }

  const handleAddTest = () => {
    if (!newTestName.trim()) {
      toast.error('Please provide a name for the test')
      return
    }

    const newTest: PolicyTest = {
      id: uuidv4(),
      name: newTestName,
      role: convertToTestRole(),
      sql: 'SELECT * FROM your_table\nWHERE your_condition = true\nLIMIT 10;',
      expectedResult: JSON.stringify(
        {
          rows: [],
          command: 'SELECT',
          rowCount: 0,
        },
        null,
        2
      ),
    }

    setTests([...tests, newTest])
    setNewTestName('')
    setNewTestOpen(false)
    toast.success('Test added successfully')
  }

  const handleUpdateTest = (updatedTest: PolicyTest) => {
    console.log('PolicyTestsList: Updating test with ID:', updatedTest.id)
    console.log(
      'PolicyTestsList: Test data before update:',
      tests.find((t) => t.id === updatedTest.id)
    )
    console.log('PolicyTestsList: New test data:', updatedTest)

    const updatedTests = tests.map((test) => (test.id === updatedTest.id ? updatedTest : test))
    console.log('PolicyTestsList: Updated tests array:', updatedTests)

    setTests(updatedTests)
  }

  const handleDeleteTest = (testId: string) => {
    const updatedTests = tests.filter((test) => test.id !== testId)
    setTests(updatedTests)
    toast.success('Test deleted successfully')
  }

  return (
    <ScaffoldSection isFullWidth>
      <div className="flex justify-between items-center mb-4">
        <div>
          <ScaffoldSectionTitle className="mb-1">Policy Tests</ScaffoldSectionTitle>
          <ScaffoldSectionDescription>
            Test and verify your Row Level Security policies using different user roles.
          </ScaffoldSectionDescription>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runAllTests}
            type="default"
            disabled={isRunningAllTests || tests.length === 0}
            icon={
              isRunningAllTests ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <ArrowRight size={16} />
              )
            }
          >
            Run All Tests
          </Button>
          <Button onClick={() => setNewTestOpen(true)} icon={<Plus size={16} />}>
            Add Test
          </Button>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4"></div>

      {showDiagResult && diagResult && (
        <div className="border rounded-md p-4 bg-surface-100 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium">RLS Policies</h3>
            <Button type="default" size="tiny" onClick={() => setShowDiagResult(false)}>
              Dismiss
            </Button>
          </div>
          <pre className="text-sm overflow-auto max-h-60">{diagResult}</pre>
        </div>
      )}

      <ResourceList>
        {tests.length === 0 ? (
          <div className="border rounded-md p-6 bg-surface-100 text-center">
            <p className="text-foreground-light">No policy tests yet.</p>
            <p className="text-foreground-light">
              Create a test to verify your Row Level Security policies.
            </p>
          </div>
        ) : (
          tests.map((test) => (
            <PolicyTestItem
              key={test.id}
              test={test}
              onTestUpdate={handleUpdateTest}
              onTestDelete={handleDeleteTest}
            />
          ))
        )}
      </ResourceList>

      <Sheet open={newTestOpen} onOpenChange={setNewTestOpen}>
        <SheetContent className="flex flex-col gap-0">
          <SheetHeader className="shrink-0">
            <SheetTitle>Add New Policy Test</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Test Name</label>
                <Input
                  placeholder="Enter test name"
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="mb-2">
                <div className="text-sm font-medium text-foreground mb-1">
                  Current Role for New Test
                </div>
                <div className="flex flex-col items-start">
                  <RoleImpersonationPopover serviceRoleLabel="Service Role" />
                  <div className="text-xs text-foreground-light mt-1">
                    Select the role to use for this test
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="shrink-0">
            <div className="flex items-center justify-end w-full gap-x-3">
              <Button type="default" onClick={() => setNewTestOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTest}>Create Test</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </ScaffoldSection>
  )
}

export default PolicyTestsList
