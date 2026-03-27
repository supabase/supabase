'use client'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { BackupsList } from 'components/interfaces/Database/Backups/BackupsList'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import InformationBox from 'components/ui/InformationBox'
import NoPermission from 'components/ui/NoPermission'
import { useBackupsQuery } from 'data/database/backups-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsOrioleDbInAws } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { Info } from 'lucide-react'
import { Admonition } from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { useV2Params } from '@/app/v2/V2ParamsContext'

/**
 * Scheduled database backups (PITR copy, Oriole notice, permissions) — same data path as v1
 * `pages/project/[ref]/database/backups/scheduled.tsx`, rendered under v2 project settings.
 */
export function V2BackupsScheduled() {
  const { projectRef } = useV2Params()

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
    <div className="flex flex-col gap-4 p-4 max-w-4xl">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Database backups</h1>
        <p className="text-xs text-foreground-lighter mt-0.5">
          Scheduled backups and point-in-time recovery status for this project.
        </p>
      </div>

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
                  Projects are backed up daily around midnight of your project’s region and can be
                  restored at any time.
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
                      Your project uses PITR and full daily backups are no longer taken. PITR lets
                      you restore to a specific time (down to the second) within your selected PITR
                      retention period.{' '}
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
    </div>
  )
}
