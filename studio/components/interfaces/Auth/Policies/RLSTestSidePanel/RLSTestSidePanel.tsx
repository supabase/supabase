import toast from 'react-hot-toast'
import { Button, SidePanel } from 'ui'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useCheckDbDevInstalledQuery } from 'data/database-testing/check-dbdev-installed-query'
import { useDbDevInstallationMutation } from 'data/database-testing/install-dbdev-mutation'
import { useSupabaseTestHelpersInstallationMutation } from 'data/database-testing/install-supabase-test-helpers-mutation'
import { useRLSTestInsertMutation } from 'data/database-testing/rls-test-insert-mutation'
import { useCheckSupabaseTestHelpersInstalledQuery } from 'data/database-testing/check-supabase-test-helpers-installed-query'
import RoleSelect from './RoleSelect'
import { Operation, Role } from './RLSTestSidePanel.types'
import OperationSelect from './OperationSelect'

// [Joshen] So right now what I can test
// - Authenticated vs Anonymous user
// - Insert
// Need to look into whether can support
// - Update, Delete, Select (These should be relatively straight forward)
// - Authenticating as a specific user (These may need to dive into test helpers's code base)
//   - But is there any security concerns/risks?
// UX could be that playground is only applicable if RLS is on?
// To check
// - Does running the insert test mess up some ID increment logic? e,g next inserted row if id is not passed is not 2, but 10

// But this is great so far I think - it ties in the whole "database extensions" being part of the dashboard chat we had yesterday

interface RLSTestSidePanelProps {
  visible: boolean
  onClose: () => void
}

const RLSTestSidePanel = ({ visible, onClose }: RLSTestSidePanelProps) => {
  const { project } = useProjectContext()

  const [role, setRole] = useState<Role>('anonymous')
  const [operation, setOperation] = useState<Operation>('insert')

  const { data: isDbDevInstalled, isLoading: isCheckingDbDev } = useCheckDbDevInstalledQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: isTestHelpersInstalled, isLoading: isCheckingTestHelpers } =
    useCheckSupabaseTestHelpersInstalledQuery({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    })

  const { mutate: runRLSTestInsert, isLoading: isRunning } = useRLSTestInsertMutation({
    onSuccess: (res, variables) => {
      const duration = 5000
      if (res === false) {
        toast.error(`Operation unsuccessful for role: ${variables.type}`, { duration })
      } else {
        toast.success(`Operation successful for role: ${variables.type}`, { duration })
      }
    },
  })
  const { mutate: installDbDev, isLoading: isInstallingDbDev } = useDbDevInstallationMutation({
    onSuccess: () => {
      toast.success('Successfully installed dbdev')
    },
  })
  const { mutate: installSupabaseTestHelpers, isLoading: isInstallingTestHelpers } =
    useSupabaseTestHelpersInstallationMutation({
      onSuccess: () => {
        toast.success('Successfully installed supabase_test_helpers')
      },
    })

  return (
    <SidePanel visible={visible} onCancel={() => onClose()} header="Test RLS policies">
      <div className="py-3">
        <SidePanel.Content>
          <div className="flex items-center gap-x-2 mb-3">
            <Button
              type="default"
              loading={isCheckingDbDev || isInstallingDbDev}
              disabled={isCheckingDbDev || isInstallingDbDev || isDbDevInstalled}
              onClick={() => {
                if (!project) return console.error('Project is required')
                installDbDev({
                  projectRef: project?.ref,
                  connectionString: project?.connectionString,
                })
              }}
            >
              {isDbDevInstalled ? 'DbDev installed' : 'Install dbdev'}
            </Button>
            <Button
              type="default"
              loading={isCheckingTestHelpers || isInstallingTestHelpers}
              disabled={isCheckingTestHelpers || isInstallingTestHelpers || isTestHelpersInstalled}
              onClick={() => {
                if (!project) return console.error('Project is required')
                installSupabaseTestHelpers({
                  projectRef: project?.ref,
                  connectionString: project?.connectionString,
                })
              }}
            >
              {isTestHelpersInstalled ? 'Test helpers installed' : 'Install supabase test helpers'}
            </Button>
          </div>
        </SidePanel.Content>

        <SidePanel.Separator />

        <SidePanel.Content className="flex flex-col gap-y-4">
          <RoleSelect role={role} onSelectRole={setRole} />
          <OperationSelect operation={operation} onSelectOperation={setOperation} />

          <div>
            <Button
              type="default"
              loading={isRunning}
              disabled={isRunning}
              onClick={() => {
                if (!project) return console.error('Project is required')
                runRLSTestInsert({
                  projectRef: project?.ref,
                  connectionString: project?.connectionString,
                  type: role,
                  data: { schema: 'public', table: 'test_table', column: 'name', value: 'test' },
                })
              }}
            >
              Run RLS Test Insert as {role}
            </Button>
          </div>
        </SidePanel.Content>
      </div>
    </SidePanel>
  )
}

export default RLSTestSidePanel
