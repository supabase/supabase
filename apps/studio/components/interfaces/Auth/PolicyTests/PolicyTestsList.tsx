import { ArrowRight, Loader2, Plus } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { Button, Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from 'ui'
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

// Define type for test run status tracking
type TestRunStatus = {
  [key: string]: 'queued' | 'running' | 'complete' | null
}

interface PolicyTestsListProps {
  // Additional props if needed
}

// Simple direct function to execute SQL via the API
async function executeSqlDirectly(options: {
  projectRef: string
  connectionString?: string
  sql: string
  isRoleImpersonationEnabled?: boolean
}) {
  try {
    const apiUrl = `/api/v1/projects/${options.projectRef}/sql`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: options.sql,
        connectionString: options.connectionString,
        isRoleImpersonationEnabled: options.isRoleImpersonationEnabled,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Error executing SQL')
    }

    const data = await response.json()
    return { success: true, result: data.result }
  } catch (error: any) {
    return { success: false, error: { message: error.message || 'Unknown error' } }
  }
}

const PolicyTestsList = ({}: PolicyTestsListProps) => {
  const { ref } = useParams()
  const [isRunningAllTests, setIsRunningAllTests] = useState(false)
  const roleState = useRoleImpersonationStateSnapshot()
  const project = useSelectedProject()
  const [diagResult, setDiagResult] = useState<any>(null)
  const [showDiagResult, setShowDiagResult] = useState(false)
  const [newTestId, setNewTestId] = useState<string | null>(null)

  // Track the run status of each test
  const [testRunStatuses, setTestRunStatuses] = useState<TestRunStatus>({})

  // Queue of test IDs to run
  const testQueueRef = useRef<string[]>([])

  // Current running test index
  const currentTestIndexRef = useRef<number>(-1)

  // We store tests by project ref in local storage
  const storageKey = `${LOCAL_STORAGE_KEYS.POLICY_TESTS}-${ref}`

  const [tests, setTests] = useLocalStorageQuery<PolicyTest[]>(storageKey, [])

  // For running diagnostics
  const { mutate: executeSql } = useExecuteSqlMutation({
    onSuccess(data) {
      setDiagResult(JSON.stringify(data.result, null, 2))
      setShowDiagResult(true)
    },
    onError(error: any) {
      setDiagResult('Error: ' + error.message)
      setShowDiagResult(true)
    },
  })

  // Clear the newTestId after it's been rendered
  useEffect(() => {
    if (newTestId) {
      // Reset after a short delay to ensure the component has time to render
      const timer = setTimeout(() => {
        setNewTestId(null)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [newTestId])

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

  // Format role impersonation - helper function
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

  // Wrap SQL with role impersonation - helper function
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

  // Handle test completion and move to the next test
  const handleTestComplete = (testId: string, finalStatus: 'passed' | 'failed' | 'error') => {
    console.log(`Test ${testId} completed with status: ${finalStatus}`)

    // Mark this test as complete
    setTestRunStatuses((prev) => ({
      ...prev,
      [testId]: 'complete',
    }))

    // Move to the next test in the queue
    moveToNextTest()
  }

  // Process the next test in the queue
  const moveToNextTest = () => {
    // Check if there are more tests in the queue
    if (currentTestIndexRef.current < testQueueRef.current.length - 1) {
      // Move to the next test
      currentTestIndexRef.current++
      const nextTestId = testQueueRef.current[currentTestIndexRef.current]

      console.log(
        `Moving to next test: ${nextTestId} (${currentTestIndexRef.current + 1}/${testQueueRef.current.length})`
      )

      // Mark the test as running
      setTestRunStatuses((prev) => ({
        ...prev,
        [nextTestId]: 'running',
      }))
    } else {
      // All tests are complete
      console.log('All tests in queue have completed')
      setIsRunningAllTests(false)
      toast.success('All tests completed')

      // Reset queue
      testQueueRef.current = []
      currentTestIndexRef.current = -1
    }
  }

  // Run all tests in sequence
  const runAllTests = async () => {
    if (tests.length === 0) {
      toast.info('No tests to run')
      return
    }

    if (isRunningAllTests) {
      toast.info('Tests are already running')
      return
    }

    // Set running state
    setIsRunningAllTests(true)
    toast.info(`Running ${tests.length} tests...`)

    try {
      console.log('Starting test run...')

      // Create a queue of all test IDs
      const testIds = tests.map((test) => test.id)
      testQueueRef.current = testIds
      currentTestIndexRef.current = -1

      // Initialize all tests as queued
      const initialStatuses: TestRunStatus = {}
      testIds.forEach((id) => {
        initialStatuses[id] = 'queued'
      })
      setTestRunStatuses(initialStatuses)

      console.log(`Queued ${testIds.length} tests for execution`)

      // Start the first test
      moveToNextTest()
    } catch (error: any) {
      console.error('Error setting up test run:', error)
      toast.error(`Error running tests: ${error.message || 'Unknown error'}`)
      setIsRunningAllTests(false)
    }
  }

  const handleAddTest = () => {
    // Create a new test with default values
    const id = uuidv4()
    const newTest: PolicyTest = {
      id,
      name: `New Test ${tests.length + 1}`,
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

    // Add the new test to the list
    const updatedTests = [...tests, newTest]
    setTests(updatedTests)

    // Set the newTestId so we can auto-open it
    setNewTestId(id)
  }

  const handleUpdateTest = (updatedTest: PolicyTest) => {
    console.log('PolicyTestsList: Updating test with ID:', updatedTest.id)
    const updatedTests = tests.map((test) => (test.id === updatedTest.id ? updatedTest : test))
    setTests(updatedTests)
  }

  const handleDeleteTest = (testId: string) => {
    const updatedTests = tests.filter((test) => test.id !== testId)
    setTests(updatedTests)
    toast.success('Test deleted successfully')
  }

  return (
    <ScaffoldSection isFullWidth>
      <div className="flex justify-between items-end mb-3">
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
          <Button onClick={handleAddTest} icon={<Plus size={16} />}>
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
              autoOpen={test.id === newTestId}
              runStatus={testRunStatuses[test.id] || null}
              onTestComplete={handleTestComplete}
            />
          ))
        )}
      </ResourceList>
    </ScaffoldSection>
  )
}

export default PolicyTestsList
