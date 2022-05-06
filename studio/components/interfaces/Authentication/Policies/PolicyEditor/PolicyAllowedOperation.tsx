import { FC } from 'react'
import { Radio } from '@supabase/ui'

interface Props {
  operation: string
  onSelectOperation: (operation: string) => void
}

const PolicyAllowedOperation: FC<Props> = ({ operation = '', onSelectOperation }) => {
  return (
    <div className="flex justify-between space-x-12">
      <div className="flex w-1/3 flex-col space-y-2">
        <label className="text-scale-1100 text-base" htmlFor="allowed-operation">
          Allowed operation
        </label>
        <p className="text-scale-900 text-sm">Selection an operation for this policy</p>
      </div>
      <div className="w-2/3">
        <div className="flex items-center space-x-8">
          <Radio.Group type="small-cards" id="allowed-operation">
            <Radio
              name="allowed-operation"
              label="SELECT"
              value="SELECT"
              checked={operation === 'SELECT'}
              onChange={(e) => onSelectOperation(e.target.value)}
            />
            <Radio
              name="allowed-operation"
              label="INSERT"
              value="INSERT"
              checked={operation === 'INSERT'}
              onChange={(e) => onSelectOperation(e.target.value)}
            />
            <Radio
              name="allowed-operation"
              label="UPDATE"
              value="UPDATE"
              checked={operation === 'UPDATE'}
              onChange={(e) => onSelectOperation(e.target.value)}
            />
            <Radio
              name="allowed-operation"
              label="DELETE"
              value="DELETE"
              checked={operation === 'DELETE'}
              onChange={(e) => onSelectOperation(e.target.value)}
            />
            <Radio
              name="allowed-operation"
              label="ALL"
              value="ALL"
              checked={operation === 'ALL'}
              onChange={(e) => onSelectOperation(e.target.value)}
            />
          </Radio.Group>
        </div>
      </div>
    </div>
  )
}

export default PolicyAllowedOperation
