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
    <div className="flex justify-between space-x-12">
      <div className="flex w-1/3 flex-col space-y-2">
        <label className="text-base text-foreground-light" htmlFor="allowed-operation">
          Allowed operation
        </label>
        <p className="text-sm text-foreground-lighter">Select an operation for this policy</p>
      </div>
      <div className="w-2/3">
        <div className="flex items-center space-x-8">
          <Radio.Group type="small-cards" size="tiny" id="allowed-operation">
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
    </div>
  )
}

export default PolicyAllowedOperation
