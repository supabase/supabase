import * as Tooltip from '@radix-ui/react-tooltip'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Button } from 'ui'
import EnableExtensionModal from '../Extensions/EnableExtensionModal'

export const CronJobsDisabledState = () => {
  const [showEnableExtensionModal, setShowEnableExtensionModal] = useState(false)
  const { project } = useProjectContext()
  const canToggleExtensions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'extensions'
  )

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgCronExtension = (data ?? []).find((ext) => ext.name === 'pg_cron')

  if (!pgCronExtension) return null

  return (
    <>
      <div>
        <div className="w-full px-12 py-12 bg-no-repeat border rounded-md bg-studio border-default">
          <div className="w-3/5 space-y-8">
            <div className="space-y-2">
              <h4 className="text-lg">pg_cron</h4>
              <p className="text-sm text-foreground-light">
                Cron jobs in PostgreSQL allow you to schedule and automate tasks such as running SQL
                queries or maintenance routines at specified intervals. These jobs are managed using
                cron-like syntax and are executed directly within the PostgreSQL server, making it
                easy to schedule recurring tasks without needing an external scheduler.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button asChild type="default" icon={<ExternalLink />}>
                <Link
                  href="https://supabase.com/docs/guides/database/extensions/pg_cron"
                  target="_blank"
                  rel="noreferrer"
                >
                  About pg_cron
                </Link>
              </Button>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger asChild>
                  <Button type="primary" onClick={() => setShowEnableExtensionModal(true)}>
                    Enable pg_cron
                  </Button>
                </Tooltip.Trigger>
                {!canToggleExtensions && (
                  <Tooltip.Portal>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-alternative py-1 px-2 leading-none shadow',
                          'border border-background',
                        ].join(' ')}
                      >
                        <span className="text-xs text-foreground">
                          You need additional permissions to enable pg_cron for this project
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
            </div>
          </div>
        </div>
      </div>

      <EnableExtensionModal
        visible={showEnableExtensionModal}
        extension={pgCronExtension}
        onCancel={() => setShowEnableExtensionModal(false)}
      />
    </>
  )
}
