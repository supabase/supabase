import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertCircle } from 'lucide-react'
import { useMemo } from 'react'

import { useParams } from 'common'
import { PITRNotice } from 'components/interfaces/Database/Backups/PITR/PITRNotice'
import { PITRSelection } from 'components/interfaces/Database/Backups/PITR/PITRSelection'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout, type NavigationItem } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useBackupsQuery } from 'data/database/backups-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useIsOrioleDbInAws, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL, PROJECT_STATUS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns'

const DatabasePhysicalBackups: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer size="large">
      <ScaffoldSection isFullWidth>
        <div className="space-y-8">
          <PITR />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabasePhysicalBackups.getLayout = (page) => {
  const BackupPageLayout = () => {
    const { ref, cloud_provider } = useSelectedProjectQuery()?.data || {}
    const { databaseRestoreToNewProject } = useIsFeatureEnabled(['database:restore_to_new_project'])

    const navigationItems: NavigationItem[] = useMemo(
      () => [
        {
          label: 'Scheduled backups',
          href: `/project/${ref}/database/backups/scheduled`,
        },
        {
          label: 'Point in time',
          href: `/project/${ref}/database/backups/pitr`,
          active: true,
        },
        ...(databaseRestoreToNewProject && cloud_provider !== 'FLY'
          ? [
              {
                label: 'Restore to new project',
                href: `/project/${ref}/database/backups/restore-to-new-project`,
                badge: 'Beta',
              },
            ]
          : []),
      ],
      [ref, databaseRestoreToNewProject, cloud_provider]
    )

    return (
      <PageLayout title="Database Backups" size="large" navigationItems={navigationItems}>
        {page}
      </PageLayout>
    )
  }

  return (
    <DefaultLayout>
      <DatabaseLayout title="Database">
        <BackupPageLayout />
      </DatabaseLayout>
    </DefaultLayout>
  )
}

const PITR = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const isOrioleDbInAws = useIsOrioleDbInAws()
  const { data: backups, error, isLoading, isError, isSuccess } = useBackupsQuery({ projectRef })

  const plan = organization?.plan?.id
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
              addon="pitr"
              source="pitr"
              primaryText="Point in Time Recovery is a Pro Plan add-on."
              secondaryText={
                plan === 'free'
                  ? 'With PITR, you can roll back to a specific time (to the second!). PITR starts from $100/mo and is available for Pro Plan customers. Note that the Pro Plan already includes daily backups for no extra charge — PITR is an optional upgrade that starts at $100/month.'
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
