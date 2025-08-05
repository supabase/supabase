import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Alert, Button, AiIconAnimation } from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

import { DatabaseTest, DatabaseTestStatus } from 'data/database-tests/database-tests-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { Play } from 'lucide-react'
import TestsList from 'components/interfaces/Database/Tests/TestsList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useAppStateSnapshot } from 'state/app-state'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import type { NextPageWithLayout } from 'types'
import { useProfile } from 'lib/profile'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import ConfirmDialog from 'ui-patterns/Dialogs/ConfirmDialog'
import { useDatabaseTestCreateMutation } from 'data/database-tests/database-test-create-mutation'
import { useDatabaseTestUpdateMutation } from 'data/database-tests/database-test-update-mutation'
import { useDatabaseTestsQuery } from 'data/database-tests/database-tests-query'
import { useDatabaseTestQuery, getDatabaseTest } from 'data/database-tests/database-test-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useQueryClient } from '@tanstack/react-query'
import { databaseTestsKeys } from 'data/database-tests/database-tests-key'
import { SETUP_TEST_PREFIX } from 'components/interfaces/Database/Tests/Tests.constants'

const DatabaseTestsPage: NextPageWithLayout = () => {
  const { setEditorPanel } = useAppStateSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const [showRunAllTestsModal, setShowRunAllTestsModal] = useState(false)
  // Local status map and execution queue
  const [statuses, setStatuses] = useState<Record<string, DatabaseTestStatus>>({})
  const [executionQueue, setExecutionQueue] = useState<string[]>([])
  const [confirmRunTestId, setConfirmRunTestId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { mutateAsync: executeSql } = useExecuteSqlMutation()

  // Fetch initial list of tests
  const { data: tests } = useDatabaseTestsQuery({
    projectRef: project?.ref,
  })

  // Cache IDs of setup tests (begin with 00_setup)
  const setupTestIds = (tests ?? []).filter((t) => t.name.startsWith('00_setup')).map((t) => t.id)

  const currentTestId = executionQueue.length > 0 ? executionQueue[0] : undefined

  // Lazy detail hook for the test at the head of the queue
  const { refetch: refetchCurrentTest } = useDatabaseTestQuery(
    { projectRef: project?.ref, id: currentTestId },
    { enabled: false }
  )

  const { data: extensions, isLoading: isLoadingExtensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const pgtap = extensions?.find((ext) => ext.name === 'pgtap')
  const isPgtapInstalled = pgtap !== undefined && pgtap.installed_version !== null

  const { mutate: createTest, isLoading: isCreatingTest } = useDatabaseTestCreateMutation({
    onSuccess: () => {
      setEditorPanel({ open: false })
    },
  })

  const { mutate: updateTest, isLoading: isUpdatingTest } = useDatabaseTestUpdateMutation({
    onSuccess: () => {
      setEditorPanel({ open: false })
    },
  })

  const onSelectTest = (test: DatabaseTest) => {
    setEditorPanel({
      open: true,
      initialValue: test.query,
      label: `Edit test: ${test.name}`,
      saveLabel: 'Save test',
      onSave: (query: string, name: string) => {
        if (!profile?.id) return
        updateTest({
          projectRef: project?.ref!,
          id: test.id,
          name: name || test.name,
          query,
          ownerId: profile?.id,
        })
        setEditorPanel({ open: false })
      },
    })
  }

  const createNewTest = () => {
    setEditorPanel({
      open: true,
      initialValue: `
begin;
select plan(1);
-- Verify RLS is enabled on all tables in the public schema
select tests.rls_enabled('public');
select * from finish();
rollback;
      `.trim(),
      label: 'Create new test',
      saveLabel: 'Save test',
      onSave: (query, name) => {
        createTest({
          projectRef: project?.ref!,
          name: name || 'New test',
          query,
        })
      },
    })
  }

  const onRunAllTests = () => {
    if (!tests || tests.length === 0) return

    const ids = tests.filter((t) => !t.name.startsWith(SETUP_TEST_PREFIX)).map((t) => t.id)
    const initialStatuses: Record<string, DatabaseTestStatus> = {}
    ids.forEach((id) => {
      initialStatuses[id] = 'queued'
    })
    setStatuses(initialStatuses)
    setExecutionQueue(ids)
  }

  // Process queue when it changes
  useEffect(() => {
    const runNext = async () => {
      if (!project || executionQueue.length === 0) return

      const testId = executionQueue[0]

      // Mark running
      setStatuses((prev) => ({ ...prev, [testId]: 'running' }))

      try {
        // Fetch latest SQL using refetch
        const { data: detail } = await refetchCurrentTest()

        const sql = detail?.query ?? ''

        if (sql.length === 0) throw new Error('Empty SQL')

        // Build combined setup SQL
        let combinedSetup = ''
        for (const sid of setupTestIds) {
          const sDetail = await queryClient.fetchQuery(
            databaseTestsKeys.detail(project?.ref, sid),
            () => getDatabaseTest({ projectRef: project?.ref, id: sid }),
            { staleTime: 60_000 }
          )
          combinedSetup += (sDetail?.query ?? '') + '\n\n'
        }

        const sqlToRun = combinedSetup.length > 0 ? combinedSetup + sql : sql

        // Execute
        await executeSql({
          projectRef: project.ref,
          connectionString: project.connectionString,
          sql: sqlToRun,
        })

        setStatuses((prev) => ({ ...prev, [testId]: 'passed' }))
      } catch (err) {
        setStatuses((prev) => ({ ...prev, [testId]: 'failed' }))
      } finally {
        // Remove from queue
        setExecutionQueue((prev) => prev.slice(1))
      }
    }

    // If not currently running and queue exists, run next
    if (executionQueue.length > 0) {
      runNext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionQueue])

  // Single test run (triggered from row)
  const handleRunSingleTest = async (testId: string) => {
    if (statuses[testId] === 'running' || executionQueue.includes(testId)) return

    // Fetch latest SQL for validation
    const detail = await queryClient.fetchQuery(
      databaseTestsKeys.detail(project?.ref, testId),
      () => getDatabaseTest({ projectRef: project?.ref, id: testId }),
      { staleTime: 0 }
    )

    const sql = detail?.query ?? ''
    const trimmed = sql.trim().toLowerCase()
    const valid = trimmed.startsWith('begin;') && trimmed.endsWith('rollback;')

    if (!valid) {
      setConfirmRunTestId(testId)
      return
    }

    setStatuses((prev) => ({ ...prev, [testId]: 'queued' }))
    setExecutionQueue((prev) => [...prev, testId])
  }

  const confirmRun = () => {
    if (!confirmRunTestId) return
    setStatuses((prev) => ({ ...prev, [confirmRunTestId]: 'queued' }))
    setExecutionQueue((prev) => [...prev, confirmRunTestId])
    setConfirmRunTestId(null)
  }

  const cancelRun = () => setConfirmRunTestId(null)

  const primaryActions = (
    <div className="flex items-center gap-x-2">
      <Button
        type="primary"
        onClick={createNewTest}
        loading={isCreatingTest}
        disabled={!project?.connectionString}
      >
        Create new test
      </Button>
      <ButtonTooltip
        type="default"
        disabled={!project?.connectionString}
        className="px-1 pointer-events-auto"
        icon={<AiIconAnimation size={16} />}
        onClick={() =>
          aiSnap.newChat({
            name: 'Create a new test',
            open: true,
            initialInput: `Write a pgTAP test to...`,
          })
        }
        tooltip={{
          content: {
            side: 'bottom',
            text: !project?.connectionString
              ? 'You need a database connection to create tests'
              : 'Create with Supabase Assistant',
          },
        }}
      />
    </div>
  )

  const secondaryActions = (
    <Button type="default" icon={<Play />} onClick={onRunAllTests}>
      Run all tests
    </Button>
  )

  return (
    <PageLayout
      title="Database Tests"
      subtitle="Run pgTAP tests against your database"
      primaryActions={primaryActions}
      secondaryActions={secondaryActions}
    >
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12 space-y-4">
            {!isLoadingExtensions && !isPgtapInstalled && (
              <Alert
                withIcon
                variant="info"
                title="pgTAP is not enabled"
                actions={
                  <Button asChild type="default">
                    <Link href={`/project/${project?.ref}/database/extensions?filter=pgtap`}>
                      Enable pgTAP
                    </Link>
                  </Button>
                }
              >
                The pgTAP extension is required to run database tests. Please enable it from the
                database extensions page.
              </Alert>
            )}
            <TestsList
              tests={tests ?? []}
              statuses={statuses}
              onSelectTest={onSelectTest}
              onRunTest={handleRunSingleTest}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
      <ConfirmationModal
        visible={showRunAllTestsModal}
        title="Run all tests"
        confirmLabel="Run all tests"
        onCancel={() => setShowRunAllTestsModal(false)}
        onConfirm={() => {
          onRunAllTests()
          setShowRunAllTestsModal(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to run all the tests? This may take a while.
        </p>
      </ConfirmationModal>

      <ConfirmDialog
        visible={confirmRunTestId !== null}
        danger
        title="Run test with invalid format?"
        description="Test query should start with BEGIN; and end with ROLLBACK;. Do you want to run it anyway?"
        buttonLabel="Run anyway"
        onSelectCancel={cancelRun}
        onSelectConfirm={confirmRun}
      />
    </PageLayout>
  )
}

DatabaseTestsPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseTestsPage
