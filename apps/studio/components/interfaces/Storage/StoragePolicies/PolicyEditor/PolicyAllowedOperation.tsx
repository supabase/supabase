import { noop } from 'lodash'
import { RadioGroupCard, RadioGroupCardItem } from 'ui'

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
          <RadioGroupCard
            id="allowed-operation"
            name="allowed-operation"
            className="flex flex-wrap gap-3"
            value={operation}
            onValueChange={(value) => onSelectOperation(value)}
          >
            {['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL'].map((op) => (
              <RadioGroupCardItem key={op} value={op} id={`r${op}`} label={op} className="w-24" />
            ))}
          </RadioGroupCard>
        </div>
      </div>
    </div>
  )
}

export default PolicyAllowedOperation
