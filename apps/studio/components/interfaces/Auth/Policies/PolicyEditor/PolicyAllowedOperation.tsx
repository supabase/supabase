import { noop } from 'lodash'
import { Radio } from 'ui'

interface PolicyAllowedOperationProps {
  operation: string
  onSelectOperation: (operation: string) => void
}

const PolicyAllowedOperation = ({
  operation = '',
  onSelectOperation = noop,
}: PolicyAllowedOperationProps) => {
  return (
    <div className="flex flex-wrap justify-between gap-y-4">
      <div className="flex w-1/3 min-w-[180px] flex-col space-y-2">
        <label className="text-base text-foreground-light" htmlFor="allowed-operation">
          Allowed operation
        </label>
        <p className="text-sm text-foreground-lighter">Select an operation for this policy</p>
      </div>
      <div className="flex-1">
        <Radio.Group
          type="small-cards"
          size="tiny"
          id="allowed-operation"
          groupClassName="flex flex-row flex-wrap gap-3"
        >
          {['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL'].map((op) => (
            <Radio
              key={op}
              name="allowed-operation"
              label={op}
              value={op}
              checked={operation === op}
              onChange={(e) => onSelectOperation(e.target.value)}
            />
          ))}
        </Radio.Group>
      </div>
    </div>
  )
}

export default PolicyAllowedOperation
