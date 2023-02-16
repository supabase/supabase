import { FC } from 'react'
import { Input } from 'ui'

interface Props {
  name: string
  limit?: number
  onUpdatePolicyName: (name: string) => void
}

const PolicyName: FC<Props> = ({ name = '', limit = 100, onUpdatePolicyName }) => {
  return (
    <div className="flex space-x-12">
      <div className="flex w-1/3 flex-col space-y-2">
        <label className="text-base text-scale-1100" htmlFor="policy-name">
          Policy name
        </label>
        <p className="text-sm text-scale-900">A descriptive name for your policy</p>
      </div>
      <div className="relative w-2/3">
        <Input
          id="policy-name"
          value={name}
          onChange={(e) => onUpdatePolicyName(e.target.value)}
          actions={
            <span className="mr-3 text-sm text-scale-900">
              {name.length}/{limit}
            </span>
          }
        />
      </div>
    </div>
  )
}

export default PolicyName
