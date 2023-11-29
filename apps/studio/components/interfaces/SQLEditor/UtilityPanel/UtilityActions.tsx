import * as Tooltip from '@radix-ui/react-tooltip'
import { IS_PLATFORM } from 'lib/constants'
import { detectOS } from 'lib/helpers'
import { Button, IconAlignLeft, IconCommand, IconCornerDownLeft } from 'ui'

import DatabaseSelector from 'components/ui/DatabaseSelector'
import { useState } from 'react'
import FavoriteButton from './FavoriteButton'
import SavingIndicator from './SavingIndicator'
import { useFlag } from 'hooks'
import SizeToggleButton from './SizeToggleButton'

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
  const readReplicasEnabled = useFlag('readReplicas')
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>('1')

  return (
    <>
      <SavingIndicator id={id} />

      {IS_PLATFORM && <FavoriteButton id={id} />}

      {/* [Joshen] Am opting to remove this - i don't think its useful? */}
      {/* [Joshen] Keeping in mind to not sprawl controls everywhere */}
      {/* [Joshen] There's eventually gonna be user impersonation here as well so let's see */}
      {/* <SizeToggleButton id={id} /> */}

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
        {readReplicasEnabled && (
          <DatabaseSelector
            selectedDatabaseId={selectedDatabaseId}
            onChangeDatabaseId={setSelectedDatabaseId}
          />
        )}

        <Button
          onClick={() => executeQuery()}
          disabled={isDisabled || isExecuting}
          loading={isExecuting}
          type="default"
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
        >
          {hasSelection ? 'Run selected' : 'Run'}
        </Button>
      </div>
    </>
  )
}

export default UtilityActions
