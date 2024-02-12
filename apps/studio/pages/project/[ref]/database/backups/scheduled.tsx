import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'

import { BackupsList } from 'components/interfaces/Database'
import { DatabaseLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import InformationBox from 'components/ui/InformationBox'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBackupsQuery } from 'data/database/backups-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks'
import { NextPageWithLayout } from 'types'
import { IconInfo, Tabs } from 'ui'
import DatabaseBackupsNav from 'components/interfaces/Database/Backups/DatabaseBackupsNav'

const DatabaseScheduledBackups: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const ref = project?.ref || 'default'

  const {
    data: backups,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useBackupsQuery({ projectRef: ref })

  const isPitrEnabled = backups?.pitr_enabled
  const canReadScheduledBackups = useCheckPermissions(PermissionAction.READ, 'back_ups')
  const isPermissionsLoaded = usePermissionsLoaded()

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="space-y-6">
            <h3 className="text-xl text-foreground">Database Backups</h3>

            <DatabaseBackupsNav active="scheduled" projRef={ref} />
            <div className="space-y-8">
              {isLoading && <GenericSkeletonLoader />}

              {isError && (
                <AlertError error={error} subject="Failed to retrieve scheduled backups" />
              )}

              {isSuccess && (
                <>
                  {!isPitrEnabled && (
                    <p className="text-sm text-foreground-light">
                      Projects are backed up daily around midnight of your project's region and can
                      be restored at any time.
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
                          Your project uses PITR and full daily backups are no longer taken. They're
                          not needed, as PITR supports a superset of functionality, in terms of the
                          granular recovery that can be performed.{' '}
                          <a
                            className="text-brand transition-colors hover:text-brand-600"
                            href="https://supabase.com/docs/guides/platform/backups"
                          >
                            Learn more
                          </a>
                        </div>
                      }
                    />
                  )}

                  {isPermissionsLoaded && !canReadScheduledBackups ? (
                    <NoPermission resourceText="view scheduled backups" />
                  ) : (
                    <BackupsList />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabaseScheduledBackups.getLayout = (page) => (
  <DatabaseLayout title="Database">{page}</DatabaseLayout>
)

export default DatabaseScheduledBackups
