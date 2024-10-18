import { PermissionAction } from '@supabase/shared-types/out/constants'

import DatabaseBackupsNav from 'components/interfaces/Database/Backups/DatabaseBackupsNav'
import { PITRNotice, PITRSelection } from 'components/interfaces/Database/Backups/PITR'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useBackupsQuery } from 'data/database/backups-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { PROJECT_STATUS } from 'lib/constants'
import { AlertCircle } from 'lucide-react'
import type { NextPageWithLayout } from 'types'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'

const DatabasePhysicalBackups: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const ref = project?.ref ?? 'default'

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="space-y-6">
            <FormHeader className="!mb-0" title="Database Backups" />
            <DatabaseBackupsNav active="pitr" projRef={ref} />
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

const PITR = () => {
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

  const plan = subscription?.plan?.id
  const isEnabled = backups?.pitr_enabled
  const isActiveHealthy = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadPhysicalBackups = useCheckPermissions(PermissionAction.READ, 'physical_backups')

  if (isPermissionsLoaded && !canReadPhysicalBackups) {
    return <NoPermission resourceText="view PITR backups" />
  }

  return (
    <>
      {isLoading && <GenericSkeletonLoader />}
      {isError && <AlertError error={error} subject="Failed to retrieve PITR backups" />}
      {isSuccess && (
        <>
          {!isEnabled ? (
            <UpgradeToPro
              addon="pitr"
              primaryText="Point in Time Recovery is a Pro Plan add-on."
              secondaryText={
                plan === 'free'
                  ? 'With PITR, you can roll back to a specific time (to the second!). PITR starts from $100/mo and is available for Pro Plan customers. Note that the Pro Plan already includes daily backups for no extra charge — PITR is an optional upgrade.'
                  : 'Please enable the add-on to enable point in time recovery for your project.'
              }
            />
          ) : !isActiveHealthy ? (
            <Alert_Shadcn_>
              <AlertCircle />
              <AlertTitle_Shadcn_>
                Point in Time Recovery is not available while project is offline
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                Your project needs to be online to restore your database with Point in Time Recovery
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          ) : (
            <>
              <PITRNotice />
              <PITRSelection />
            </>
          )}
        </>
      )}
    </>
  )
}

export default DatabasePhysicalBackups
