import type { PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { Lock, Unlock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useIsRLSAIAssistantEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Badge } from 'ui'

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
        <Link href={`/project/${ref}/editor/${table.id}`} className="flex items-center gap-x-2">
          {table.rls_enabled ? (
            <div className="flex items-center gap-x-1 text-xs">
              <Lock size={14} strokeWidth={2} className="text-brand" />
            </div>
          ) : (
            <div className="flex items-center gap-x-1 text-xs">
              <Unlock size={14} strokeWidth={2} className="text-warning-600" />
            </div>
          )}
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
            {!isAiAssistantEnabled && (
              <ButtonTooltip
                type="default"
                disabled={!canToggleRLS}
                onClick={() => onSelectCreatePolicy()}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: 'You need additional permissions to create RLS policies',
                  },
                }}
              >
                Create policy
              </ButtonTooltip>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PolicyTableRowHeader
