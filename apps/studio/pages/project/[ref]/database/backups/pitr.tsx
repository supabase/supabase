import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertCircle } from 'lucide-react'

import { useParams } from 'common'
import DatabaseBackupsNav from 'components/interfaces/Database/Backups/DatabaseBackupsNav'
import { PITRNotice } from 'components/interfaces/Database/Backups/PITR/PITRNotice'
import { PITRSelection } from 'components/interfaces/Database/Backups/PITR/PITRSelection'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { UpgradeToPro } from 'components/ui/UpgradeToPro'
import { useBackupsQuery } from 'data/database/backups-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useIsOrioleDbInAws, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL, PROJECT_STATUS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'

const DatabasePhysicalBackups: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Database Backups</PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
        <PageHeaderNavigationTabs>
          <DatabaseBackupsNav active="pitr" />
        </PageHeaderNavigationTabs>
      </PageHeader>
      <PageContainer>
        <PageSection>
          <PageSectionContent>
            <div className="space-y-8">
              <PITR />
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

DatabasePhysicalBackups.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

const PITR = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { hasAccess: hasAccessToPitr, isLoading: isLoadingEntitlements } =
    useCheckEntitlements('pitr.available_variants')
  const isOrioleDbInAws = useIsOrioleDbInAws()
  const {
    data: backups,
    error,
    isPending: isLoadingBackups,
    isError,
    isSuccess,
  } = useBackupsQuery({ projectRef })

  const isLoading = isLoadingBackups || isLoadingEntitlements
  const isEnabled = backups?.pitr_enabled
  const isActiveHealthy = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const { can: canReadPhysicalBackups, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'physical_backups'
  )

  if (isPermissionsLoaded && !canReadPhysicalBackups) {
    return <NoPermission resourceText="view PITR backups" />
  }

  if (isOrioleDbInAws) {
    return (
      <Admonition
        type="default"
        title="Database backups are not available for OrioleDB"
        description="OrioleDB is currently in public alpha and projects created are strictly ephemeral with no database backups"
      >
        <DocsButton abbrev={false} className="mt-2" href={DOCS_URL} />
      </Admonition>
    )
  }

  return (
    <>
      {isLoading && <GenericSkeletonLoader />}
      {isError && <AlertError error={error} subject="Failed to retrieve PITR backups" />}
      {isSuccess && (
        <>
          {!isEnabled ? (
            <UpgradeToPro
              addon={hasAccessToPitr ? 'pitr' : undefined}
              source="pitr"
              featureProposition="enable Point-in-Time Recovery"
              primaryText="Point in Time Recovery is a Pro Plan add-on"
              secondaryText={
                !hasAccessToPitr
                  ? 'Roll back your database to a specific second. Starts at $100/month. Pro Plan already includes daily backups at no extra cost.'
                  : 'Enable the add-on to add point-in-time recovery to your project.'
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
