import { Button } from 'ui'
import { IS_PLATFORM } from 'lib/constants'
import FavoriteButton from './FavoriteButton'
import SavingIndicator from './SavingIndicator'
import SizeToggleButton from './SizeToggleButton'

export type UtilityActionsProps = {
  id: string
  isExecuting?: boolean
  executeQuery?: (overrideSql?: string) => void
}

const UtilityActions = ({ id, isExecuting = false, executeQuery }: UtilityActionsProps) => {
  return (
    <>
      <SavingIndicator id={id} />
      {IS_PLATFORM && <FavoriteButton id={id} />}
      <SizeToggleButton id={id} />
      <Button
        onClick={() => executeQuery?.()}
        disabled={isExecuting}
        loading={isExecuting}
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
