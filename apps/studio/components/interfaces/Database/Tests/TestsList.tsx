import { useMemo, useState } from 'react'
import { Alert, Card, CardHeader, CardTitle } from 'ui'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { DatabaseTest, DatabaseTestStatus } from 'data/database-tests/database-tests-query'
import TestRow from './TestRow'
import { SETUP_TEST_PREFIX } from './Tests.constants'

interface DatabaseTestsListProps {
  tests: DatabaseTest[]
  statuses: Record<string, DatabaseTestStatus>
  onSelectTest: (test: DatabaseTest) => void
  onRunTest: (id: string) => void
}

const DatabaseTestsList = ({
  tests,
  statuses,
  onSelectTest,
  onRunTest,
}: DatabaseTestsListProps) => {
  const [search, setSearch] = useState('')
  const [activeTestId, setActiveTestId] = useState<string | null>(null)
  const handleSelectTest = (test: DatabaseTest) => {
    setActiveTestId(test.id)
    onSelectTest(test)
  }

  // Assuming tests prop is already fetched.
  const isLoading = false
  const isError = false
  const error = null
  const isSuccess = true

  // Split tests into setup and regular groups
  const { setupTests, regularTests } = useMemo(() => {
    if (!tests) return { setupTests: [], regularTests: [] }

    const setupTests = tests.filter((test) => test.name.startsWith(SETUP_TEST_PREFIX))
    const regularTests = tests.filter((test) => !test.name.startsWith(SETUP_TEST_PREFIX))

    // Sort setup tests alphabetically to ensure consistent order
    const sortedSetupTests = setupTests.sort((a, b) => a.name.localeCompare(b.name))

    return {
      setupTests: sortedSetupTests,
      regularTests,
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

  // runAll logic now lives in parent page.

  const renderTestTable = (tests: DatabaseTest[], isSetupSection = false) => {
    if (isSetupSection) {
      // Simplified view for setup tests - just name and actions
      return (
        <div className="w-full">
          {tests.length === 0 ? (
            <p className="text-sm text-foreground-light p-4">
              Tests starting with "{SETUP_TEST_PREFIX}" will be run before all other tests and can
              be used to set up the test environment.
            </p>
          ) : (
            tests.map((test, index) => (
              <TestRow
                key={test.id}
                index={index}
                isLast={index === tests.length - 1}
                test={{ ...test, status: statuses[test.id] }}
                canRun={false}
                onSelectTest={handleSelectTest}
                isActive={test.id === activeTestId}
                onRun={() => {}}
              />
            ))
          )}
        </div>
      )
    }

    // Regular tests view with full TestRow component
    return (
      <div className="relative">
        {tests.length === 0 ? (
          <p className="text-sm text-foreground-light p-4">No tests found.</p>
        ) : (
          tests.map((test, index) => (
            <TestRow
              key={test.id}
              index={index}
              isLast={index === tests.length - 1}
              test={{ ...test, status: statuses[test.id] }}
              canRun={true}
              onSelectTest={handleSelectTest}
              isActive={test.id === activeTestId}
              onRun={() => onRunTest(test.id)}
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
                <CardTitle>Before Tests</CardTitle>
              </div>
            </CardHeader>
            {renderTestTable(filteredSetupTests, true)}
          </Card>

          <Card>
            <CardHeader className="px-4">
              <div className="flex items-center gap-2">
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

export default DatabaseTestsList
