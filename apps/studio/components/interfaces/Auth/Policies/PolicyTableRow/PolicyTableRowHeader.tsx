import * as Tooltip from '@radix-ui/react-tooltip'
import type { PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useIsRLSAIAssistantEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Badge, Button, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_ } from 'ui'

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

  const isRealtimeSchema = table.schema === 'realtime'
  const isRealtimeMessagesTable = isRealtimeSchema && table.name === 'messages'
  const isTableLocked = isRealtimeSchema ? !isRealtimeMessagesTable : isLocked

  return (
    <div id={table.id.toString()} className="flex w-full items-center justify-between">
      <div className="flex gap-x-4 text-left">
        <Link href={`/project/${ref}/editor/${table.id}`}>
          <h4 className="m-0">{table.name}</h4>
        </Link>
        <div className="flex items-center gap-x-2">
          {isTableLocked && (
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
      {!isTableLocked && (
        <div className="flex-1">
          <div className="flex flex-row justify-end gap-x-2">
            {!isRealtimeMessagesTable ? (
              <Tooltip_Shadcn_ delayDuration={0}>
                <TooltipTrigger_Shadcn_ asChild>
                  <Button
                    type="default"
                    disabled={!canToggleRLS}
                    onClick={() => onSelectToggleRLS(table)}
                  >
                    {table.rls_enabled ? 'Disable RLS' : 'Enable RLS'}
                  </Button>
                </TooltipTrigger_Shadcn_>
                {!canToggleRLS && (
                  <TooltipContent_Shadcn_ side="bottom">
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
                  </TooltipContent_Shadcn_>
                )}
              </Tooltip_Shadcn_>
            ) : null}
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
