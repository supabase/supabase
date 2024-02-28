import * as Tooltip from '@radix-ui/react-tooltip'
import { IS_PLATFORM } from 'lib/constants'
import { detectOS } from 'lib/helpers'
import { Button, IconAlignLeft, IconCommand, IconCornerDownLeft, Toggle_Shadcn, cn } from 'ui'

import { RoleImpersonationPopover } from 'components/interfaces/RoleImpersonationSelector'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { useLocalStorageQuery, useSelectedProject } from 'hooks'
import FavoriteButton from './FavoriteButton'
import SavingIndicator from './SavingIndicator'

export type UtilityActionsProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  hasSelection: boolean
  prettifyQuery: () => void
  executeQuery: () => void
}

const UtilityActions = ({
  id,
  isExecuting = false,
  isDisabled = false,
  hasSelection,
  prettifyQuery,
  executeQuery,
}: UtilityActionsProps) => {
  const os = detectOS()
  const project = useSelectedProject()
  const showReadReplicasUI = project?.is_read_replicas_enabled
  const [intellisenseEnabled, setIntellisenseEnabled] = useLocalStorageQuery(
    'supabase_sql-editor-intellisense-enabled',
    true
  )

  return (
    <>
      <SavingIndicator id={id} />

      <Toggle_Shadcn
        aria-label="Toggle Intellisense"
        size="sm"
        pressed={intellisenseEnabled}
        className="text-xs font-normal h-auto group"
        onPressedChange={() => setIntellisenseEnabled(!intellisenseEnabled)}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'w-2 h-2 flex  rounded-full transition-colors ',
              intellisenseEnabled ? 'bg-green-900' : 'bg-surface-400 group-hover:bg-green-600'
            )}
          ></span>
          Intellisense
        </div>
      </Toggle_Shadcn>
      {IS_PLATFORM && <FavoriteButton id={id} />}
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger asChild>
          <Button
            type="text"
            onClick={() => prettifyQuery()}
            icon={<IconAlignLeft size="tiny" strokeWidth={2} className="text-gray-1100" />}
          />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-alternative py-1 px-2 leading-none shadow',
                'border border-background',
              ].join(' ')}
            >
              <span className="text-xs text-foreground">Prettify SQL</span>
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <div className="flex items-center justify-between gap-x-2 mx-2">
        <div className="flex items-center">
          {showReadReplicasUI && <DatabaseSelector variant="connected-on-right" />}
          <RoleImpersonationPopover
            serviceRoleLabel="postgres"
            variant={showReadReplicasUI ? 'connected-on-both' : 'connected-on-right'}
          />
          <Button
            onClick={() => executeQuery()}
            disabled={isDisabled || isExecuting}
            loading={isExecuting}
            type="primary"
            size="tiny"
            iconRight={
              <div className="flex items-center space-x-1">
                {os === 'macos' ? (
                  <IconCommand size={10} strokeWidth={1.5} />
                ) : (
                  <p className="text-xs text-foreground-light">CTRL</p>
                )}
                <IconCornerDownLeft size={10} strokeWidth={1.5} />
              </div>
            }
            className="rounded-l-none"
          >
            {hasSelection ? 'Run selected' : 'Run'}
          </Button>
        </div>
      </div>
    </>
  )
}

export default UtilityActions
