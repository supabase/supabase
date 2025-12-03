import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { Lock, Table } from 'lucide-react'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { EditorTablePageLink } from 'data/prefetchers/project.$ref.editor.$id'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { AiIconAnimation, Badge, CardTitle } from 'ui'
import type { PolicyTable } from './PolicyTableRow.types'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'

interface PolicyTableRowHeaderProps {
  table: PolicyTable
  isLocked: boolean
  onSelectToggleRLS: (table: PolicyTable) => void
  onSelectCreatePolicy: (table: PolicyTable) => void
}

export const PolicyTableRowHeader = ({
  table,
  isLocked,
  onSelectToggleRLS = noop,
  onSelectCreatePolicy,
}: PolicyTableRowHeaderProps) => {
  const { ref } = useParams()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const { can: canCreatePolicies } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'policies'
  )
  const { can: canToggleRLS } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const isRealtimeSchema = table.schema === 'realtime'
  const isRealtimeMessagesTable = isRealtimeSchema && table.name === 'messages'
  const isTableLocked = isRealtimeSchema ? !isRealtimeMessagesTable : isLocked

  return (
    <div id={table.id.toString()} className="flex w-full items-center justify-between">
      <div className="flex gap-x-4 text-left flex-wrap">
        <EditorTablePageLink
          projectRef={ref}
          id={String(table.id)}
          className="flex items-center gap-3 flex-wrap"
        >
          <Table strokeWidth={1.5} size={16} className="text-foreground-muted" />
          <CardTitle className="m-0 normal-case">{table.name}</CardTitle>
          {!table.rls_enabled && (
            <Badge variant="warning" className="shrink-0">
              RLS Disabled
            </Badge>
          )}
        </EditorTablePageLink>
        {isTableLocked && (
          <Badge>
            <span className="flex gap-2 items-center text-xs uppercase text-foreground-lighter">
              <Lock size={12} /> Locked
            </span>
          </Badge>
        )}
      </div>
      {!isTableLocked && (
        <div className="flex-1">
          <div className="flex flex-row justify-end gap-x-2">
            {!isRealtimeMessagesTable && (
              <ButtonTooltip
                type="default"
                disabled={!canToggleRLS}
                onClick={() => onSelectToggleRLS(table)}
                data-testid={`${table.name}-toggle-rls`}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canToggleRLS
                      ? 'You need additional permissions to toggle RLS'
                      : undefined,
                  },
                }}
              >
                {table.rls_enabled ? 'Disable RLS' : 'Enable RLS'}
              </ButtonTooltip>
            )}
            <ButtonTooltip
              type="default"
              disabled={!canToggleRLS || !canCreatePolicies}
              onClick={() => onSelectCreatePolicy(table)}
              data-testid={`${table.name}-create-policy`}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canToggleRLS
                    ? !canToggleRLS || !canCreatePolicies
                      ? 'You need additional permissions to create RLS policies'
                      : undefined
                    : undefined,
                },
              }}
            >
              Create policy
            </ButtonTooltip>

            <ButtonTooltip
              type="default"
              className="px-1"
              onClick={() => {
                openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                aiSnap.newChat({
                  name: 'Create new policy',
                  initialInput: `Create and name a new policy for the ${table.schema} schema on the ${table.name} table that ...`,
                })
              }}
              tooltip={{
                content: {
                  side: 'bottom',
                  text:
                    !canToggleRLS || !canCreatePolicies
                      ? 'You need additional permissions to create RLS policies'
                      : 'Create with Supabase Assistant',
                },
              }}
            >
              <AiIconAnimation size={16} />
            </ButtonTooltip>
          </div>
        </div>
      )}
    </div>
  )
}
