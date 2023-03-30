import { useState } from 'react'
import { Button, IconAlertCircle, IconCommand, IconCornerDownLeft } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useKeyboardShortcuts, checkPermissions } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { useProfileQuery } from 'data/profile/profile-query'
import { useSqlStore } from 'localStores/sqlEditor/SqlEditorStore'
import SavingIndicator from './SavingIndicator'
import FavouriteButton from './FavouriteButton'
import SizeToggleButton from './SizeToggleButton'
import AskSupabaseAIModal from './AskSupabaseAIModal'

export interface UtilityActionsProps {
  updateSqlSnippet: (value: any) => void
}

export const AiIcon = ({ className }: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
    />
  </svg>
)

const UtilityActions = ({ updateSqlSnippet }: UtilityActionsProps) => {
  const { data: profile } = useProfileQuery()
  const sqlEditorStore: any = useSqlStore()
  const [showAiPromptModal, setShowAiPromptModal] = useState(false)

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
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
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
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="default"
            icon={<AiIcon className="text-scale-1100 w-4 h-4" />}
            onClick={() => setShowAiPromptModal(true)}
          >
            Ask Supabase AI
          </Button>
          <Button
            onClick={executeQuery}
            disabled={sqlEditorStore.isExecuting}
            loading={sqlEditorStore.isExecuting}
            type="default"
            size="tiny"
            shadow={false}
            iconRight={
              <div className="flex items-center space-x-1">
                <IconCommand size={10} strokeWidth={1.5} />
                <IconCornerDownLeft size={10} strokeWidth={1.5} />
              </div>
            }
          >
            RUN
          </Button>
        </div>
      </div>
      <AskSupabaseAIModal visible={showAiPromptModal} onClose={() => setShowAiPromptModal(false)} />
    </>
  )
}

export default UtilityActions
