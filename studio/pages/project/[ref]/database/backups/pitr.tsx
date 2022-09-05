import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Tabs } from '@supabase/ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore, checkPermissions } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { PITRBackupSelection } from 'components/interfaces/Database'
import { NextPageWithLayout } from 'types'
import NoPermission from 'components/ui/NoPermission'
import { PITRNotice, PITRSelection } from 'components/interfaces/Database/Backups/PITR'

const DatabaseScheduledBackups: NextPageWithLayout = () => {
  const { ui } = useStore()
  const router = useRouter()

  const ref = ui.selectedProject?.ref ?? 'default'

  const canReadPhysicalBackups = checkPermissions(PermissionAction.READ, 'physical_backups')

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 pt-12 pb-20">
      <h3 className="text-scale-1200 text-xl">Backups</h3>

      <Tabs
        type="underlined"
        activeId="pitr"
        onChange={(id: any) => {
          if (id === 'scheduled') router.push(`/project/${ref}/database/backups/scheduled`)
        }}
      >
        <Tabs.Panel id="scheduled" label="Scheduled backups" />
        <Tabs.Panel id="pitr" label="Point in Time" />
      </Tabs>

      <div className="space-y-8">
        {canReadPhysicalBackups ? (
          <>
            <PITRNotice />
            <PITRSelection />
            {/* <PITRBackupSelection /> */}
          </>
        ) : (
          <NoPermission resourceText="view PITR backups" />
        )}
      </div>
    </div>
  )
}

DatabaseScheduledBackups.getLayout = (page) => (
  <DatabaseLayout title="Database">{page}</DatabaseLayout>
)

export default observer(DatabaseScheduledBackups)
