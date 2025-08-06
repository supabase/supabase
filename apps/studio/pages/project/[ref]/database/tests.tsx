import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Alert, Button, AiIconAnimation } from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

import { DatabaseTest } from 'data/database-tests/database-tests-query'
import { Play } from 'lucide-react'
import TestsList from 'components/interfaces/Database/Tests/TestsList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import type { NextPageWithLayout } from 'types'
import { useProfile } from 'lib/profile'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useDatabaseTestCreateMutation } from 'data/database-tests/database-test-create-mutation'
import { useDatabaseTestUpdateMutation } from 'data/database-tests/database-test-update-mutation'
import { useDatabaseTestsQuery } from 'data/database-tests/database-tests-query'
import { getDatabaseTest } from 'data/database-tests/database-test-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useQueryClient } from '@tanstack/react-query'
import { databaseTestsKeys } from 'data/database-tests/database-tests-key'
import { SETUP_TEST_PREFIX } from 'components/interfaces/Database/Tests/Tests.constants'
import { DatabaseTestStatus } from 'components/interfaces/Database/Tests/Tests.types'
import { isTestSuccessful } from 'components/interfaces/Database/Tests/Tests.utils'
import EditorPanel from 'components/ui/EditorPanel/EditorPanel'

const DatabaseTestsPage: NextPageWithLayout = () => {
  const aiSnap = useAiAssistantStateSnapshot()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const [showRunAllTestsModal, setShowRunAllTestsModal] = useState(false)

  const [statuses, setStatuses] = useState<Record<string, DatabaseTestStatus>>({})
  const [executionQueue, setExecutionQueue] = useState<string[]>([])
  const [confirmRunTestId, setConfirmRunTestId] = useState<string | null>(null)
  const [editorPanelOpen, setEditorPanelOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState<DatabaseTest | null>(null)

  const queryClient = useQueryClient()
  const { mutateAsync: executeSql } = useExecuteSqlMutation()

  const { data: tests } = useDatabaseTestsQuery({
    projectRef: project?.ref,
  })

  const setupTestIds = (tests ?? []).filter((t) => t.name.startsWith('00_setup')).map((t) => t.id)

  const { mutate: createTest, isLoading: isCreatingTest } = useDatabaseTestCreateMutation({
    onSuccess: () => {
      setEditorPanelOpen(false)
      setSelectedTest(null)
    },
  })

  const { mutate: updateTest, isLoading: isUpdatingTest } = useDatabaseTestUpdateMutation({
    onSuccess: () => {
      setEditorPanelOpen(false)
      setSelectedTest(null)
    },
  })

  const onSelectTest = (test: DatabaseTest) => {
    setSelectedTest(test)
    setEditorPanelOpen(true)
  }

  const createNewTest = () => {
    setSelectedTest(null)
    setEditorPanelOpen(true)
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

      setStatuses((prev) => ({ ...prev, [testId]: 'running' }))

      try {
        const detail = await queryClient.fetchQuery(
          databaseTestsKeys.detail(project?.ref, testId),
          () => getDatabaseTest({ projectRef: project?.ref, id: testId }),
          { staleTime: 0 }
        )

        const sql = detail?.query ?? ''

        if (sql.length === 0) throw new Error('Empty SQL')

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

        const result = await executeSql({
          projectRef: project.ref,
          connectionString: project.connectionString,
          sql: sqlToRun,
        })

        console.log('result', result)

        if (isTestSuccessful(result)) {
          setStatuses((prev) => ({ ...prev, [testId]: 'passed' }))
        } else {
          setStatuses((prev) => ({ ...prev, [testId]: 'failed' }))
        }
      } catch (err) {
        setStatuses((prev) => ({ ...prev, [testId]: 'failed' }))
      } finally {
        setExecutionQueue((prev) => prev.slice(1))
      }
    }

    // If not currently running and queue exists, run next
    if (executionQueue.length > 0) {
      runNext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionQueue])

  const handleRunSingleTest = async (testId: string) => {
    if (statuses[testId] === 'running' || executionQueue.includes(testId)) return

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
            initialInput: `Write a pgTap test to...`,
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
    <Button type="default" icon={<Play />} onClick={() => setShowRunAllTestsModal(true)}>
      Run all tests
    </Button>
  )

  return (
    <PageLayout
      title="Database Tests"
      subtitle="Run tests against your database"
      primaryActions={primaryActions}
      secondaryActions={secondaryActions}
    >
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12 space-y-4">
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
          All tests will be run in the order they are listed. Setup tests will be run before each
          main test.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        visible={confirmRunTestId !== null}
        title="Run test with invalid format?"
        description="Test query should start with BEGIN; and end with ROLLBACK;. Do you want to run it anyway?"
        confirmLabel="Run anyway"
        variant="destructive"
        onCancel={cancelRun}
        onConfirm={confirmRun}
      />
      <EditorPanel
        open={editorPanelOpen}
        onClose={() => {
          setEditorPanelOpen(false)
          setSelectedTest(null)
        }}
        initialValue={
          selectedTest
            ? selectedTest.query
            : `
begin;
select plan(1);
-- Verify RLS is enabled on all tables in the public schema
select tests.rls_enabled('public');
select * from finish();
rollback;
      `.trim()
        }
        label={selectedTest ? `Edit test: ${selectedTest.name}` : 'Create new test'}
        saveLabel={'Save test'}
        saveValue={selectedTest?.name || 'New test'}
        onSave={(query: string, name: string) => {
          if (!profile?.id) return
          if (selectedTest) {
            updateTest({
              projectRef: project?.ref!,
              id: selectedTest.id,
              name: name || selectedTest.name,
              query,
              ownerId: profile?.id,
            })
          } else {
            createTest({
              projectRef: project?.ref!,
              name: name || 'New test',
              query,
            })
          }
          setEditorPanelOpen(false)
          setSelectedTest(null)
        }}
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
