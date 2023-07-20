import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { Tabs } from 'ui'

import BackupsError from 'components/interfaces/Database/Backups/BackupsError'
import { PITRNotice, PITRSelection } from 'components/interfaces/Database/Backups/PITR'
import { DatabaseLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Loading from 'components/ui/Loading'
import NoPermission from 'components/ui/NoPermission'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useCheckPermissions, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'

const DatabasePhysicalBackups: NextPageWithLayout = () => {
  const router = useRouter()
  const { project } = useProjectContext()
  const ref = project?.ref ?? 'default'

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
          activeId="pitr"
          onChange={(id: any) => {
            if (id === 'scheduled') router.push(`/project/${ref}/database/backups/scheduled`)
          }}
        >
          <Tabs.Panel id="scheduled" label="Scheduled backups" />
          <Tabs.Panel id="pitr" label="Point in Time" />
        </Tabs>

        <div className="space-y-8">
          <PITR />
        </div>
      </div>
    </div>
  )
}

DatabasePhysicalBackups.getLayout = (page) => (
  <DatabaseLayout title="Database">{page}</DatabaseLayout>
)

const PITR = observer(() => {
  const { backups } = useStore()
  const { project } = useProjectContext()
  const { configuration, error, isLoading } = backups

  const { data: subscription } = useProjectSubscriptionV2Query(
    { projectRef: project?.ref },
    { enabled: project?.ref !== undefined }
  )

  const ref = project?.ref ?? 'default'
  const plan = subscription?.plan?.id
  const isEnabled = configuration.walg_enabled

  const canReadPhysicalBackups = useCheckPermissions(PermissionAction.READ, 'physical_backups')
  if (!canReadPhysicalBackups) return <NoPermission resourceText="view PITR backups" />

  if (isLoading) return <Loading />
  if (error) return <BackupsError />
  if (!isEnabled) {
    return (
      <UpgradeToPro
        projectRef={ref}
        primaryText="Point in time recovery is a Pro plan add-on."
        secondaryText={
          plan === 'free'
            ? 'Upgrade to the Pro plan with the PITR add-on selected to enable point in time recovery for your project.'
            : 'Please enable the add-on to enable point in time recovery for your project.'
        }
      />
    )
  }

  return (
    <>
      <PITRNotice />
      <PITRSelection />
    </>
  )
})

export default DatabasePhysicalBackups
