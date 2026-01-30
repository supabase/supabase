import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Info } from 'lucide-react'

import { useParams } from 'common'
import { BackupsList } from 'components/interfaces/Database/Backups/BackupsList'
import DatabaseBackupsNav from 'components/interfaces/Database/Backups/DatabaseBackupsNav'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import InformationBox from 'components/ui/InformationBox'
import NoPermission from 'components/ui/NoPermission'
import { useBackupsQuery } from 'data/database/backups-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsOrioleDbInAws } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
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

const DatabaseScheduledBackups: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()

  const {
    data: backups,
    error,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useBackupsQuery({ projectRef })

  const isOrioleDbInAws = useIsOrioleDbInAws()
  const isPitrEnabled = backups?.pitr_enabled

  const { can: canReadScheduledBackups, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'back_ups'
  )

  return (
    <>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Database Backups</PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
        <PageHeaderNavigationTabs>
          <DatabaseBackupsNav active="scheduled" />
        </PageHeaderNavigationTabs>
      </PageHeader>
      <PageContainer>
        <PageSection>
          <PageSectionContent>
            {isOrioleDbInAws ? (
              <Admonition
                type="default"
                title="Database backups are not available for OrioleDB"
                description="OrioleDB is currently in public alpha and projects created are strictly ephemeral with no database backups"
              >
                <DocsButton abbrev={false} className="mt-2" href={`${DOCS_URL}`} />
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
                        Projects are backed up daily around midnight of your project’s region and
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
                              href={`${DOCS_URL}/guides/platform/backups`}
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
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

DatabaseScheduledBackups.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseScheduledBackups
