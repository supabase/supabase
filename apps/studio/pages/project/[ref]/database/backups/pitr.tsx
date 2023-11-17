import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { Tabs } from 'ui'

import { PITRNotice, PITRSelection } from 'components/interfaces/Database/Backups/PITR'
import { DatabaseLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useBackupsQuery } from 'data/database/backups-query'
import { useCheckPermissions, useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'

const DatabasePhysicalBackups: NextPageWithLayout = () => {
  const router = useRouter()
  const { project } = useProjectContext()
  const ref = project?.ref ?? 'default'

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="space-y-6">
            <h3 className="text-xl text-foreground">Database Backups</h3>

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
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabasePhysicalBackups.getLayout = (page) => (
  <DatabaseLayout title="Database">{page}</DatabaseLayout>
)

const PITR = observer(() => {
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()
  const {
    data: backups,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useBackupsQuery({
    projectRef: project?.ref,
  })

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })

  const ref = project?.ref ?? 'default'
  const plan = subscription?.plan?.id
  const isEnabled = backups?.pitr_enabled

  const canReadPhysicalBackups = useCheckPermissions(PermissionAction.READ, 'physical_backups')

  if (!canReadPhysicalBackups) return <NoPermission resourceText="view PITR backups" />

  return (
    <>
      {isLoading && <GenericSkeletonLoader />}
      {isError && <AlertError error={error} subject="Failed to retrieve PITR backups" />}
      {isSuccess && (
        <>
          {isEnabled ? (
            <>
              <PITRNotice />
              <PITRSelection />
            </>
          ) : (
            <UpgradeToPro
              organizationSlug={organization!.slug}
              projectRef={ref}
              primaryText="Point in time recovery is a Pro plan add-on."
              secondaryText={
                plan === 'free'
                  ? 'Upgrade to the Pro plan with the PITR add-on selected to enable point in time recovery for your project.'
                  : 'Please enable the add-on to enable point in time recovery for your project.'
              }
              addon="pitr"
            />
          )}
        </>
      )}
    </>
  )
})

export default DatabasePhysicalBackups
