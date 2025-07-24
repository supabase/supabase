import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { Alert, Button, AiIconAnimation } from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

import { DatabaseTest } from 'data/database-tests/database-tests-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { Play } from 'lucide-react'
import TestsList, { TestsListHandle } from 'components/interfaces/Database/Tests/TestsList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useAppStateSnapshot } from 'state/app-state'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import type { NextPageWithLayout } from 'types'
import { toast } from 'sonner'
import { useProfile } from 'lib/profile'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useDatabaseTestCreateMutation } from 'data/database-tests/database-test-create-mutation'
import { useDatabaseTestUpdateMutation } from 'data/database-tests/database-test-update-mutation'

const DatabaseTestsPage: NextPageWithLayout = () => {
  const { setEditorPanel } = useAppStateSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const [showRunAllTestsModal, setShowRunAllTestsModal] = useState(false)
  const testsListRef = useRef<TestsListHandle>(null)

  const canReadTests = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')
  const canCreateTests = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')
  const isPermissionsLoaded = usePermissionsLoaded()

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
      onSave: (query) => {
        updateTest({
          projectRef: project?.ref!,
          id: test.id,
          name: test.name,
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
BEGIN;
SELECT plan(1);
-- Your test here
SELECT * FROM finish();
ROLLBACK;
      `.trim(),
      label: 'Create new test',
      saveLabel: 'Save test',
      onSave: (query) => {
        createTest({
          projectRef: project?.ref!,
          name: 'New test',
          connectionString: project?.connectionString,
          query,
        })
      },
    })
  }

  const onRunAllTests = () => {
    setShowRunAllTestsModal(true)
  }

  const primaryActions = (
    <div className="flex items-center gap-x-2">
      <Button
        type="primary"
        onClick={createNewTest}
        loading={isCreatingTest}
        disabled={!canCreateTests}
      >
        Create new test
      </Button>
      <ButtonTooltip
        type="default"
        disabled={!canCreateTests}
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
            text: !canCreateTests
              ? 'You need additional permissions to create tests'
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
            <TestsList ref={testsListRef} onSelectTest={onSelectTest} />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
      <ConfirmationModal
        visible={showRunAllTestsModal}
        title="Run all tests"
        confirmLabel="Run all tests"
        onCancel={() => setShowRunAllTestsModal(false)}
        onConfirm={() => {
          testsListRef.current?.runAllTests()
          setShowRunAllTestsModal(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to run all the tests? This may take a while.
        </p>
      </ConfirmationModal>
    </PageLayout>
  )
}

DatabaseTestsPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseTestsPage
