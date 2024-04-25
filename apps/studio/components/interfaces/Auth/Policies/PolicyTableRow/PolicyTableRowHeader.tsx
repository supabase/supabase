import * as Tooltip from '@radix-ui/react-tooltip'
import type { PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useIsRLSAIAssistantEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useCheckPermissions } from 'hooks'
import { Badge, Button } from 'ui'

interface PolicyTableRowHeaderProps {
  table: PostgresTable
  isLocked: boolean
  onSelectToggleRLS: (table: PostgresTable) => void
  onSelectCreatePolicy: () => void
}

const PolicyTableRowHeader = ({
  table,
  isLocked,
  onSelectToggleRLS = noop,
  onSelectCreatePolicy,
}: PolicyTableRowHeaderProps) => {
  const router = useRouter()
  const { ref } = router.query

  const isAiAssistantEnabled = useIsRLSAIAssistantEnabled()
  const canToggleRLS = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  return (
    <div id={table.id.toString()} className="flex w-full items-center justify-between">
      <div className="flex gap-x-4 text-left">
        <Link href={`/project/${ref}/editor/${table.id}`}>
          <h4 className="m-0">{table.name}</h4>
        </Link>
        <div className="flex items-center gap-x-2">
          {isLocked && (
            <Badge>
              <span className="flex gap-2 items-center text-xs uppercase text-foreground-lighter">
                <Lock size={12} /> Locked
              </span>
            </Badge>
          )}
          <Badge variant={table.rls_enabled ? 'brand' : 'warning'}>
            {table.rls_enabled ? 'Row Level Security enabled' : 'Row Level Security disabled'}
          </Badge>
        </div>
      </div>
      {!isLocked && (
        <div className="flex-1">
          <div className="flex flex-row justify-end gap-x-2">
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <Button
                  type="default"
                  disabled={!canToggleRLS}
                  onClick={() => onSelectToggleRLS(table)}
                >
                  {table.rls_enabled ? 'Disable RLS' : 'Enable RLS'}
                </Button>
              </Tooltip.Trigger>
              {!canToggleRLS && (
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
                        You need additional permissions to toggle RLS
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
            {!isAiAssistantEnabled && (
              <Button
                type="default"
                disabled={!canToggleRLS}
                onClick={() => onSelectCreatePolicy()}
              >
                Create policy
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PolicyTableRowHeader
