import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Tabs } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions, useStore } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { BackupsList } from 'components/interfaces/Database'
import NoPermission from 'components/ui/NoPermission'
import { FormsContainer } from 'components/ui/Forms'

const DatabaseScheduledBackups: NextPageWithLayout = () => {
  const { ui } = useStore()
  const router = useRouter()
  const ref = ui.selectedProject?.ref

  const canReadScheduledBackups = checkPermissions(PermissionAction.READ, 'back_ups')

  return (
    <FormsContainer>
      <div className="space-y-6">
        <h3 className="text-xl text-scale-1200">Backups</h3>

        <Tabs
          type="underlined"
          size="small"
          activeId="scheduled"
          onChange={(id: any) => {
            if (id === 'pitr') router.push(`/project/${ref}/database/backups/pitr`)
          }}
        >
          <Tabs.Panel id="scheduled" label="Scheduled backups" />
          <Tabs.Panel id="pitr" label="Point in Time" />
        </Tabs>

        <div className="space-y-4">
          <p className="text-sm text-scale-1100">
            Projects are backed up daily around midnight of your project's region and can be
            restored at any time.
          </p>
          {canReadScheduledBackups ? (
            <BackupsList />
          ) : (
            <NoPermission resourceText="view scheduled backups" />
          )}
        </div>
      </div>
    </FormsContainer>
  )
}

DatabaseScheduledBackups.getLayout = (page) => (
  <DatabaseLayout title="Database">{page}</DatabaseLayout>
)

export default observer(DatabaseScheduledBackups)
