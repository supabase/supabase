import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Tabs } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { useStore, checkPermissions } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import Loading from 'components/ui/Loading'
import NoPermission from 'components/ui/NoPermission'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { PITRNotice, PITRSelection } from 'components/interfaces/Database/Backups/PITR'
import BackupsError from 'components/interfaces/Database/Backups/BackupsError'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'

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
  const tier = ui.selectedProject?.subscription_tier
  const isEnabled = configuration.walg_enabled

  const canReadPhysicalBackups = checkPermissions(PermissionAction.READ, 'physical_backups')
  if (!canReadPhysicalBackups) return <NoPermission resourceText="view PITR backups" />

  if (isLoading) return <Loading />
  if (error) return <BackupsError />
  if (!isEnabled) {
    return (
      <UpgradeToPro
        projectRef={ref}
        primaryText="Point in time recovery is a Pro plan add-on."
        secondaryText={
          tier === PRICING_TIER_PRODUCT_IDS.FREE
            ? 'Please upgrade to the Pro plan with the PITR add-on selected to enable point in time recovery for your project.'
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
}

export default observer(DatabasePhysicalBackups)
