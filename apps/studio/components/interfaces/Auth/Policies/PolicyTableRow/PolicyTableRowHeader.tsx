import type { PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { noop } from 'lodash'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useQueryState } from 'nuqs'
import {
  AiIconAnimation,
  Badge,
  Button,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

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

  const canToggleRLS = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const isRealtimeSchema = table.schema === 'realtime'
  const isRealtimeMessagesTable = isRealtimeSchema && table.name === 'messages'
  const isTableLocked = isRealtimeSchema ? !isRealtimeMessagesTable : isLocked
  const [_, setEditView] = useQueryState('view', { defaultValue: '' })

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
            {!isRealtimeMessagesTable && (
              <ButtonTooltip
                type="default"
                disabled={!canToggleRLS}
                onClick={() => onSelectToggleRLS(table)}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: 'You need additional permissions to toggle RLS',
                  },
                }}
              >
                {table.rls_enabled ? 'Disable RLS' : 'Enable RLS'}
              </ButtonTooltip>
            )}
            <ButtonTooltip
              type="default"
              disabled={!canToggleRLS}
              onClick={() => onSelectCreatePolicy()}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canToggleRLS
                    ? 'You need additional permissions to create RLS policies'
                    : undefined,
                },
              }}
            >
              Create policy
            </ButtonTooltip>

            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <Button
                  type="default"
                  className="px-1"
                  onClick={() => {
                    onSelectCreatePolicy()
                    setEditView('conversation')
                  }}
                >
                  <AiIconAnimation className="scale-75 [&>div>div]:border-black dark:[&>div>div]:border-white" />
                </Button>
              </TooltipTrigger_Shadcn_>
              <TooltipContent_Shadcn_ side="top">
                {!canToggleRLS
                  ? 'You need additional permissions to create RLS policies'
                  : 'Create with Supabase Assistant'}
              </TooltipContent_Shadcn_>
            </Tooltip_Shadcn_>
          </div>
        </div>
      )}
    </div>
  )
}

export default PolicyTableRowHeader
