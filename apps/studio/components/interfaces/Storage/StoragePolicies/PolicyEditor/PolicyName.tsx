import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from 'ui'

interface PolicyNameProps {
  name: string
  limit?: number
  onUpdatePolicyName: (name: string) => void
}

export const PolicyName = ({ name = '', limit = 100, onUpdatePolicyName }: PolicyNameProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-12">
      <div className="flex md:w-1/3 flex-col space-y-2">
        <label className="text-base text-foreground-light" htmlFor="policy-name">
          Policy name
        </label>
        <p className="text-sm text-foreground-lighter">A descriptive name for your policy</p>
      </div>
      <div className="relative md:w-2/3">
        <InputGroup>
          <InputGroupInput
            id="policy-name"
            value={name}
            onChange={(e) => onUpdatePolicyName(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>
              {name.length}/{limit}
            </InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  )
}
