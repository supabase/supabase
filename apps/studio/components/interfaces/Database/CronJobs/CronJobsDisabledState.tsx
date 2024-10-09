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
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'

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
      <div className="w-full h-full flex items-center justify-center">
        <ProductEmptyState title="Cron Jobs">
          <div className="text-sm text-foreground-light mb-4 grid gap-2">
            <p>
              Cron jobs in PostgreSQL allow you to schedule and automate tasks such as running SQL
              queries or maintenance routines at specified intervals.
            </p>
            <p>Enable cron jobs in your project.</p>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <Button type="primary" onClick={() => setShowEnableExtensionModal(true)}>
                  Enable Cron Jobs
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
            <Button asChild type="text" icon={<ExternalLink />}>
              <Link
                href="https://supabase.com/docs/guides/database/extensions/pg_cron"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </Link>
            </Button>
          </div>
        </ProductEmptyState>
      </div>

      <EnableExtensionModal
        visible={showEnableExtensionModal}
        extension={pgCronExtension}
        onCancel={() => setShowEnableExtensionModal(false)}
      />
    </>
  )
}
