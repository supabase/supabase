import { Button, IconCommand, IconCornerDownLeft } from 'ui'
import { IS_PLATFORM } from 'lib/constants'
import FavoriteButton from './FavoriteButton'
import SavingIndicator from './SavingIndicator'
import SizeToggleButton from './SizeToggleButton'
import { detectOS } from 'lib/helpers'

export type UtilityActionsProps = {
  id: string
  isExecuting?: boolean
  executeQuery: () => void
}

const UtilityActions = ({ id, isExecuting = false, executeQuery }: UtilityActionsProps) => {
  const os = detectOS()

  return (
    <>
      <SavingIndicator id={id} />
      {IS_PLATFORM && <FavoriteButton id={id} />}
      <SizeToggleButton id={id} />
      <Button
        onClick={() => executeQuery()}
        disabled={isExecuting}
        loading={isExecuting}
        type="default"
        size="tiny"
        className="mx-2"
        iconRight={
          <div className="flex items-center space-x-1">
            {os === 'macos' ? (
              <IconCommand size={10} strokeWidth={1.5} />
            ) : (
              <p className="text-xs text-scale-1100">CTRL</p>
            )}
            <IconCornerDownLeft size={10} strokeWidth={1.5} />
          </div>
        }
      >
        RUN
      </Button>
    </>
  )
}

export default UtilityActions
