import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { BackupsList } from 'components/interfaces/Database'
import { DatabaseLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import InformationBox from 'components/ui/InformationBox'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { IconInfo, Tabs } from 'ui'

const DatabaseScheduledBackups: NextPageWithLayout = () => {
  const router = useRouter()
  const { backups } = useStore()
  const { project } = useProjectContext()
  const ref = project?.ref

  const isPitrEnabled = backups?.configuration?.walg_enabled

  const canReadScheduledBackups = useCheckPermissions(PermissionAction.READ, 'back_ups')

  return (
    <div
      className={clsx(
        'mx-auto flex flex-col px-5 pt-6 pb-14',
        'lg:pt-8 lg:px-14 1xl:px-28 2xl:px-32 h-full'
      )}
    >
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
                    className="text-brand transition-colors hover:text-brand-1200"
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
    </div>
  )
}

DatabaseScheduledBackups.getLayout = (page) => (
  <DatabaseLayout title="Database">{page}</DatabaseLayout>
)

export default observer(DatabaseScheduledBackups)
