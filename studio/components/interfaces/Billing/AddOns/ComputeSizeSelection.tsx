import { FC } from 'react'
import { Radio } from '@supabase/ui'
import { formatComputeSizes } from './AddOns.utils'

interface Props {
  computeSizes: any[]
  selectedComputeSize: any
  onSelectOption: (option: any) => void
}

const ComputeSizeSelection: FC<Props> = ({ computeSizes, selectedComputeSize, onSelectOption }) => {
  const formattedComputeSizes = formatComputeSizes(computeSizes)
  return (
    <div className="space-y-4">
      <div>
        <p>Compute size</p>
        <p className="text-sm text-scale-1100">
          Choose the database instance size that best fits your needs
        </p>
      </div>
      <Radio.Group type="cards" className="billing-compute-radio">
        {formattedComputeSizes.map((option: any) => (
          <Radio
            hidden
            key={option.id}
            align="vertical"
            label={option.name}
            // @ts-ignore
            description={
              <div>
                <p>{option.description}</p>
                <p>{option.metadata.features}</p>
              </div>
            }
            value={option.id}
            optionalLabel={<div>${option.prices[0].unit_amount / 100} / month</div>}
            checked={selectedComputeSize?.id === option.id}
            onChange={() => onSelectOption(option)}
          />
        ))}
      </Radio.Group>
    </div>
  )
}

export default ComputeSizeSelection
