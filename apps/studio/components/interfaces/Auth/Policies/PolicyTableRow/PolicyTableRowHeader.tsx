import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { Lock, Unlock } from 'lucide-react'
import { useQueryState } from 'nuqs'

import { useParams } from 'common'
import { useIsDatabaseFunctionsAssistantEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { EditorTablePageLink } from 'data/prefetchers/project.$ref.editor.$id'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useAppStateSnapshot } from 'state/app-state'
import { AiIconAnimation, Badge } from 'ui'

interface PolicyTableRowHeaderProps {
  table: {
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }
  isLocked: boolean
  onSelectToggleRLS: (table: {
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }) => void
  onSelectCreatePolicy: () => void
}

const PolicyTableRowHeader = ({
  table,
  isLocked,
  onSelectToggleRLS = noop,
  onSelectCreatePolicy,
}: PolicyTableRowHeaderProps) => {
  const { ref } = useParams()
  const { setAiAssistantPanel } = useAppStateSnapshot()

  const enableAssistantV2 = useIsDatabaseFunctionsAssistantEnabled()
  const canToggleRLS = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const isRealtimeSchema = table.schema === 'realtime'
  const isRealtimeMessagesTable = isRealtimeSchema && table.name === 'messages'
  const isTableLocked = isRealtimeSchema ? !isRealtimeMessagesTable : isLocked
  const [_, setEditView] = useQueryState('view', { defaultValue: '' })

  return (
    <div id={table.id.toString()} className="flex w-full items-center justify-between">
      <div className="flex gap-x-4 text-left">
        <EditorTablePageLink
          projectRef={ref}
          id={String(table.id)}
          className="flex items-center gap-x-2"
        >
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
        </EditorTablePageLink>
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
              disabled={!canToggleRLS}
              onClick={() => onSelectCreatePolicy()}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canToggleRLS
                    ? !canToggleRLS
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
                if (enableAssistantV2) {
                  setAiAssistantPanel({
                    open: true,
                    editor: 'rls-policies',
                    entity: undefined,
                    tables: [{ schema: table.schema, name: table.name }],
                  })
                } else {
                  onSelectCreatePolicy()
                  setEditView('conversation')
                }
              }}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canToggleRLS
                    ? 'You need additional permissions to create RLS policies'
                    : 'Create with Supabase Assistant',
                },
              }}
            >
              <AiIconAnimation className="scale-75 [&>div>div]:border-black dark:[&>div>div]:border-white" />
            </ButtonTooltip>
          </div>
        </div>
      )}
    </div>
  )
}

export default PolicyTableRowHeader
