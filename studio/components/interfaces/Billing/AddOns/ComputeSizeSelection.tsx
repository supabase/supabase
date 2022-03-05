import { FC } from 'react'
import { Radio } from '@supabase/ui'
import { COMPUTE_SIZES } from './AddOns.constant'

// [TODO] please type the vairables properly

interface Props {
  selectedComputeSize: any
  onSelectOption: (option: any) => void
}

const ComputeSizeSelection: FC<Props> = ({ selectedComputeSize, onSelectOption }) => {
  return (
    <div className="space-y-4">
      <div>
        <p>Compute size</p>
        <p className="text-sm text-scale-1100">
          Choose the database instance size that best fits your needs
        </p>
      </div>
      <Radio.Group type="cards" className="billing-compute-radio">
        {COMPUTE_SIZES.map((option: any) => (
          <Radio
            hidden
            key={option.id}
            align="vertical"
            label={option.name}
            // @ts-ignore
            description={
              <div>
                <p>{option.description}</p>
                <p>{option.specs}</p>
              </div>
            }
            value={option.id}
            optionalLabel={<div>${option.price} / month</div>}
            checked={selectedComputeSize?.id === option.id}
            onChange={() => onSelectOption(option)}
          />
        ))}
      </Radio.Group>
    </div>
  )
}

export default ComputeSizeSelection
