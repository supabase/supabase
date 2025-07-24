import { partition } from 'lodash'
import { useRouter } from 'next/router'
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Search, MoreVertical, Trash, Settings2, FlaskConical } from 'lucide-react'
import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useDatabaseTestsQuery } from 'data/database-tests/database-tests-query'
import { DatabaseTest } from 'data/database-tests/database-tests-query'
import { useDatabaseTestDeleteMutation } from 'data/database-tests/database-test-delete-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { toast } from 'sonner'
import TestRow, { TestRowHandle } from './TestRow'

// Utility function to validate test query format
const isValidTestQuery = (query: string): boolean => {
  const trimmedQuery = query.trim().toLowerCase()
  return trimmedQuery.startsWith('begin;') && trimmedQuery.endsWith('rollback;')
}

// Simple component for setup test rows - just name and actions
interface SetupTestRowProps {
  test: DatabaseTest
  index: number
  onSelectTest: (test: DatabaseTest) => void
}

const SetupTestRow = ({ test, index, onSelectTest }: SetupTestRowProps) => {
  const project = useSelectedProject()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { mutate: deleteTest, isLoading: isDeleting } = useDatabaseTestDeleteMutation({
    onSuccess: () => {
      setIsDeleteModalOpen(false)
    },
  })

  const onDelete = () => {
    if (!project) return
    deleteTest({ projectRef: project.ref, id: test.id })
  }

  return (
    <div className="w-full flex justify-between items-center p-4 gap-3 border-b last:border-b-0">
      <span className="flex items-center justify-center w-5 h-5 text-xs rounded bg border border-default text-foreground-lighter">
        {index + 1}
      </span>
      <p className="text-sm cursor-pointer w-full" onClick={() => onSelectTest(test)}>
        {test.name}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="text" icon={<MoreVertical />} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)}>
            <Trash size={14} />
            <span className="ml-2">Remove test</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmationModal
        visible={isDeleteModalOpen}
        title="Delete test"
        confirmLabel="Delete test"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={onDelete}
        loading={isDeleting}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete the test "{test.name}"? This action cannot be undone.
        </p>
      </ConfirmationModal>
    </div>
  )
}

export interface TestsListHandle {
  runAllTests: () => void
}

interface DatabaseTestsListProps {
  onSelectTest: (test: DatabaseTest) => void
}

const DatabaseTestsList = forwardRef<TestsListHandle, DatabaseTestsListProps>(
  ({ onSelectTest }, ref) => {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const testRowRefs = useRef<{ [key: string]: TestRowHandle | null }>({})

    const {
      data: tests,
      isLoading,
      isSuccess,
      isError,
      error,
    } = useDatabaseTestsQuery({
      projectRef: router.query.ref as string,
    })

    // Split tests into setup and regular groups
    const { setupTests, regularTests, combinedSetupQuery } = useMemo(() => {
      if (!tests) return { setupTests: [], regularTests: [], combinedSetupQuery: null }

      const setupTests = tests.filter((test) => test.name.startsWith('000'))
      const regularTests = tests.filter((test) => !test.name.startsWith('000'))

      // Sort setup tests alphabetically to ensure consistent order
      const sortedSetupTests = setupTests.sort((a, b) => a.name.localeCompare(b.name))

      // Combine all setup test queries into a single query
      const combinedSetupQuery =
        sortedSetupTests.length > 0
          ? ({
              id: 'combined-setup',
              name: 'Combined Setup Tests',
              query: sortedSetupTests.map((test) => test.query).join('\n\n'),
            } as DatabaseTest)
          : null

      return {
        setupTests: sortedSetupTests,
        regularTests,
        combinedSetupQuery,
      }
    }, [tests])

    // Filter both groups based on search
    const filteredSetupTests = useMemo(() => {
      if (search.length === 0) return setupTests
      return setupTests.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    }, [setupTests, search])

    const filteredRegularTests = useMemo(() => {
      if (search.length === 0) return regularTests
      return regularTests.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    }, [regularTests, search])

    const runAllTests = async () => {
      const allTests = [...filteredSetupTests, ...filteredRegularTests]
      if (allTests.length === 0) {
        toast.error('No tests to run.')
        return
      }

      // Filter out invalid tests
      const validTests = allTests.filter((test) => isValidTestQuery(test.query))
      const invalidTests = allTests.filter((test) => !isValidTestQuery(test.query))

      if (invalidTests.length > 0) {
        toast.error(
          `${invalidTests.length} test(s) skipped - must start with BEGIN; and end with ROLLBACK;`
        )
      }

      if (validTests.length === 0) {
        toast.error('No valid tests to run.')
        return
      }

      // Always run setup test first, then regular tests alphabetically
      const validSetupTests = validTests.filter((test) => test.name.startsWith('000'))
      const validRegularTests = validTests.filter((test) => !test.name.startsWith('000'))

      const sortedRegularTests = [...validRegularTests].sort((a, b) => a.name.localeCompare(b.name))
      const sortedTests = [...validSetupTests, ...sortedRegularTests]

      // Set all tests to queued status initially
      sortedTests.forEach((test) => {
        testRowRefs.current[test.id]?.setStatus('queued')
      })

      let passedCount = 0
      let failedCount = 0

      // Run tests sequentially
      for (const test of sortedTests) {
        const testRef = testRowRefs.current[test.id]
        if (testRef) {
          // Clear queued status and run the test
          testRef.setStatus(undefined)
          const result = await testRef.runTest()

          if (result?.error) {
            failedCount++
          } else {
            passedCount++
          }
        }
      }

      // Show final results
      if (failedCount > 0) {
        toast.error(`${failedCount} out of ${validTests.length} tests failed.`)
      } else {
        toast.success(`All ${validTests.length} tests passed!`)
      }
    }

    useImperativeHandle(ref, () => ({
      runAllTests,
    }))

    // Pass combined setup query to child components for prepending
    const setupTest = combinedSetupQuery

    const renderTestTable = (tests: DatabaseTest[], isSetupSection = false) => {
      if (isSetupSection) {
        // Simplified view for setup tests - just name and actions
        return (
          <div className="w-full">
            {tests.length === 0 ? (
              <p className="text-sm text-foreground-light p-4">
                No setup tests found. Create tests with names starting with "000" to set up test
                environment.
              </p>
            ) : (
              tests.map((test, index) => (
                <SetupTestRow key={test.id} index={index} test={test} onSelectTest={onSelectTest} />
              ))
            )}
          </div>
        )
      }

      // Regular tests view with full TestRow component
      return (
        <div>
          {tests.length === 0 ? (
            <p className="text-sm text-foreground-light p-4">No tests found.</p>
          ) : (
            tests.map((test, index) => (
              <TestRow
                ref={(el) => (testRowRefs.current[test.id] = el)}
                key={test.id}
                index={index}
                test={test}
                prependQuery={setupTest}
                canRun={true}
                onSelectTest={onSelectTest}
              />
            ))
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-col h-full space-y-4">
        {isLoading && <ShimmeringLoader />}
        {isError && (
          <div className="p-4">
            <Alert variant="danger" title="Failed to fetch database tests">
              {(error as any)?.message}
            </Alert>
          </div>
        )}
        {isSuccess && (
          <>
            <Card>
              <CardHeader className="px-4">
                <div className="flex items-center gap-2">
                  <Settings2 strokeWidth={1.5} size={16} className="text-foreground-lighter" />
                  <CardTitle>Before Tests</CardTitle>
                </div>
              </CardHeader>
              {renderTestTable(filteredSetupTests, true)}
            </Card>

            <Card>
              <CardHeader className="px-4">
                <div className="flex items-center gap-2">
                  <FlaskConical strokeWidth={1.5} size={16} className="text-foreground-lighter" />
                  <CardTitle>Tests</CardTitle>
                </div>
              </CardHeader>
              {renderTestTable(filteredRegularTests, false)}
            </Card>
          </>
        )}
      </div>
    )
  }
)

DatabaseTestsList.displayName = 'DatabaseTestsList'
export default DatabaseTestsList
