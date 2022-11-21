import Link from 'next/link'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { IconAlertCircle, Tabs } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { useStore, checkPermissions, useFlag } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import Loading from 'components/ui/Loading'
import NoPermission from 'components/ui/NoPermission'
import InformationBox from 'components/ui/InformationBox'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { PITRNotice, PITRSelection } from 'components/interfaces/Database/Backups/PITR'
import BackupsError from 'components/interfaces/Database/Backups/BackupsError'

const DatabasePhysicalBackups: NextPageWithLayout = () => {
  const { ui } = useStore()
  const router = useRouter()
  const ref = ui.selectedProject?.ref ?? 'default'

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 pt-12 pb-20">
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
  )
}

DatabasePhysicalBackups.getLayout = (page) => (
  <DatabaseLayout title="Database">{page}</DatabaseLayout>
)

const PITR = () => {
  const { ui, backups } = useStore()
  const { configuration, error, isLoading } = backups

  const ref = ui.selectedProject?.ref ?? 'default'
  const isEnabled = configuration.walg_enabled

  const isPITRSelfServeEnabled = useFlag('pitrSelfServe')
  const canReadPhysicalBackups = checkPermissions(PermissionAction.READ, 'physical_backups')
  if (!canReadPhysicalBackups) return <NoPermission resourceText="view PITR backups" />

  if (isLoading) return <Loading />
  if (error) return <BackupsError />
  if (!isEnabled)
    return isPITRSelfServeEnabled ? (
      <UpgradeToPro
        projectRef={ref}
        primaryText="Free Plan does not include point in time recovery."
        secondaryText="Please upgrade to the Pro plan to enable point in time recovery for your project."
      />
    ) : (
      <InformationBox
        hideCollapse
        defaultVisibility
        title={
          <div>
            <p>
              Point in time backups is an Enterprise feature. Reach out to us{' '}
              <Link
                href={`/support/new?ref=${ref}&category=sales&subject=Interest%20in%20enabling%20PITR%20for%20my%20project`}
              >
                <a className="text-brand-900">here</a>
              </Link>{' '}
              if you're interested!
            </p>
          </div>
        }
        icon={<IconAlertCircle size={18} strokeWidth={2} />}
      />
    )

  return (
    <>
      <PITRNotice />
      <PITRSelection />
    </>
  )
}

export default observer(DatabasePhysicalBackups)
