import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconAlertCircle } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useKeyboardShortcuts, useStore, checkPermissions } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { useSqlStore } from 'localStores/sqlEditor/SqlEditorStore'
import SavingIndicator from './SavingIndicator'
import FavouriteButton from './FavouriteButton'
import SizeToggleButton from './SizeToggleButton'

interface Props {
  updateSqlSnippet: (value: any) => void
}

const UtilityActions: FC<Props> = ({ updateSqlSnippet }) => {
  const { ui } = useStore()
  const sqlEditorStore: any = useSqlStore()

  const canCreateSQLSnippet = checkPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: ui.profile?.id },
    subject: { id: ui.profile?.id },
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

export default observer(UtilityActions)
