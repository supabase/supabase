import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import EnableExtensionModal from 'components/interfaces/Database/Extensions/EnableExtensionModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { DocsButton } from 'components/ui/DocsButton'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Button } from 'ui'

export const QueuesDisabledState = () => {
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

  const pgmqExtension = (data ?? []).find((ext) => ext.name === 'pgmq')

  if (!pgmqExtension) return null

  return (
    <>
      <div className="w-full h-full flex items-center justify-center">
        <ProductEmptyState title="Queues">
          <div className="text-sm text-foreground-light mb-4 grid gap-2">
            <p>
              Message queues in PostgreSQL allow you to handle asynchronous tasks, manage workloads,
              and enable reliable communication between different parts of your application.
            </p>
            <p>Enable queues in your project.</p>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <Button type="primary" onClick={() => setShowEnableExtensionModal(true)}>
                  Enable Queues
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
                        You need additional permissions to enable pgmq for this project
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
            <DocsButton href="https://supabase.com/docs/guides/database/extensions/pgmq" />
          </div>
        </ProductEmptyState>
      </div>

      <EnableExtensionModal
        visible={showEnableExtensionModal}
        extension={pgmqExtension}
        onCancel={() => setShowEnableExtensionModal(false)}
      />
    </>
  )
}
