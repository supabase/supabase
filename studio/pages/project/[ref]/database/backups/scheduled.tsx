import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { IconAlertCircle, IconHelpCircle, IconInfo, IconMessageCircle, Tabs } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions, useStore } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { BackupsList } from 'components/interfaces/Database'
import NoPermission from 'components/ui/NoPermission'
import { FormsContainer } from 'components/ui/Forms'
import InformationBox from 'components/ui/InformationBox'

const DatabaseScheduledBackups: NextPageWithLayout = () => {
  const { ui, backups } = useStore()
  const router = useRouter()
  const ref = ui.selectedProject?.ref

  const isPitrEnabled = backups?.configuration?.walg_enabled

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
          {!isPitrEnabled && (
            <p className="text-sm text-scale-1100">
              Projects are backed up daily around midnight of your project's region and can be
              restored at any time.
            </p>
          )}

          {isPitrEnabled && (
            <InformationBox
              hideCollapse
              defaultVisibility
              icon={<IconInfo strokeWidth={2} />}
              title="Point-In-Time-Recovery (PITR) enabled"
              description={
                <div>
                  Your project uses PITR and full daily backups are no longer taken. They're not
                  needed, as PITR supports a superset of functionality, in terms of the granular
                  recovery that can be performed.{' '}
                  <a
                    className="text-brand-900 transition-colors hover:text-brand-1200"
                    href="https://supabase.com/docs/guides/platform/backups"
                  >
                    Learn more
                  </a>
                </div>
              }
            />
          )}

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
