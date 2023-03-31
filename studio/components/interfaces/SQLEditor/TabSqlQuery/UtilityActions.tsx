import { Button, IconAlertCircle } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useKeyboardShortcuts, checkPermissions } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { useProfileQuery } from 'data/profile/profile-query'
import { useSqlStore } from 'localStores/sqlEditor/SqlEditorStore'
import SavingIndicator from './SavingIndicator'
import FavouriteButton from './FavouriteButton'
import SizeToggleButton from './SizeToggleButton'

export interface UtilityActionsProps {
  updateSqlSnippet: (value: any) => void
}

const UtilityActions = ({ updateSqlSnippet }: UtilityActionsProps) => {
  const { data: profile } = useProfileQuery()
  const sqlEditorStore: any = useSqlStore()

  const canCreateSQLSnippet = checkPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  useKeyboardShortcuts(
    {
      'Command+Enter': (event: any) => {
        event.preventDefault()
        executeQuery()
      },
    },
    // @ts-ignore
    ['INPUT']
  )

  async function executeQuery() {
    if (sqlEditorStore.isExecuting) return
    await sqlEditorStore.startExecuting()
  }

  return (
    <>
      {!canCreateSQLSnippet && (
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <IconAlertCircle size={14} strokeWidth={2} />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                  'w-48 border border-scale-200',
                ].join(' ')}
              >
                <span className="text-xs text-scale-1200">
                  Queries are not saved as you do not have sufficient permissions
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}
      <SavingIndicator updateSqlSnippet={updateSqlSnippet} />
      {IS_PLATFORM && canCreateSQLSnippet && <FavouriteButton />}
      <SizeToggleButton />
      <Button
        onClick={executeQuery}
        disabled={sqlEditorStore.isExecuting}
        loading={sqlEditorStore.isExecuting}
        type="text"
        size="tiny"
        shadow={false}
        className="mx-2"
      >
        RUN
      </Button>
    </>
  )
}

export default UtilityActions
