import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Info } from 'lucide-react'

import { useParams } from 'common'
import { BackupsList } from 'components/interfaces/Database'
import DatabaseBackupsNav from 'components/interfaces/Database/Backups/DatabaseBackupsNav'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import InformationBox from 'components/ui/InformationBox'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBackupsQuery } from 'data/database/backups-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useIsOrioleDb } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'
import { Admonition } from 'ui-patterns'

const DatabaseScheduledBackups: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()

  const { data: backups, error, isLoading, isError, isSuccess } = useBackupsQuery({ projectRef })

  const isOrioleDb = useIsOrioleDb()
  const isPitrEnabled = backups?.pitr_enabled
  const isPermissionsLoaded = usePermissionsLoaded()

  const canReadScheduledBackups = useCheckPermissions(PermissionAction.READ, 'back_ups')

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="space-y-6">
            <FormHeader className="!mb-0" title="Database Backups" />

            <DatabaseBackupsNav active="scheduled" />

            {isOrioleDb ? (
              <Admonition
                type="default"
                title="Database backups are not available for OrioleDB"
                description="OrioleDB is currently in public alpha and projects created are strictly ephemeral with no database backups"
              >
                <DocsButton abbrev={false} className="mt-2" href="https://supabase.com/docs" />
              </Admonition>
            ) : (
              <div className="flex flex-col gap-y-4">
                {isLoading && <GenericSkeletonLoader />}

                {isError && (
                  <AlertError error={error} subject="Failed to retrieve scheduled backups" />
                )}

                {isSuccess && (
                  <>
                    {!isPitrEnabled && (
                      <p className="text-sm text-foreground-light">
                        Projects are backed up daily around midnight of your project's region and
                        can be restored at any time.
                      </p>
                    )}

                    {isPitrEnabled && (
                      <InformationBox
                        hideCollapse
                        defaultVisibility
                        icon={<Info strokeWidth={2} />}
                        title="Point-In-Time-Recovery (PITR) enabled"
                        description={
                          <div>
                            Your project uses PITR and full daily backups are no longer taken.
                            They're not needed, as PITR supports a superset of functionality, in
                            terms of the granular recovery that can be performed.{' '}
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
            )}
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
