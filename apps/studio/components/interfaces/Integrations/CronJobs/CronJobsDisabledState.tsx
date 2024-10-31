import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import EnableExtensionModal from 'components/interfaces/Database/Extensions/EnableExtensionModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

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
            <ButtonTooltip
              type="primary"
              disabled={!canToggleExtensions}
              onClick={() => setShowEnableExtensionModal(true)}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canToggleExtensions
                    ? 'You need additional permissions to enable pg_cron for this project'
                    : undefined,
                },
              }}
            >
              Enable Cron Jobs
            </ButtonTooltip>
            <DocsButton href="https://supabase.com/docs/guides/database/extensions/pg_cron" />
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
