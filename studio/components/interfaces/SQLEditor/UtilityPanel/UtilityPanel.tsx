import ResultsDropdown from './ResultsDropdown'
import UtilityActions from './UtilityActions'
import UtilityTabResults from './UtilityTabResults'

export type UtilityPanelProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  prettifyQuery: () => void
  executeQuery: () => void
}

const UtilityPanel = ({
  id,
  isExecuting,
  isDisabled,
  prettifyQuery,
  executeQuery,
}: UtilityPanelProps) => {
  return (
    <>
      <div className="flex justify-between overflow-visible px-6 py-2">
        <ResultsDropdown id={id} isExecuting={isExecuting} />

        <div className="inline-flex items-center justify-end">
          <UtilityActions
            id={id}
            isExecuting={isExecuting}
            isDisabled={isDisabled}
            prettifyQuery={prettifyQuery}
            executeQuery={executeQuery}
          />
        </div>
      </div>

      <div className="flex-1 p-0 pt-0 pb-0">
        <UtilityTabResults id={id} isExecuting={isExecuting} />
      </div>
    </>
  )
}

export default UtilityPanel
