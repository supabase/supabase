import { FC } from 'react'
import { Badge, Radio } from '@supabase/ui'
import { getProductPrice } from '../Billing.utils'

interface Props {
  computeSizes: any[]
  currentComputeSize: any
  selectedComputeSize: any
  onSelectOption: (option: any) => void
}

const ComputeSizeSelection: FC<Props> = ({
  computeSizes,
  currentComputeSize,
  selectedComputeSize,
  onSelectOption,
}) => {
  // [Joshen] We should have some indication on what's the current compute
  // size of the project based on currentComputeSize
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center space-x-2">
          <h4 className="text-lg">Database add-ons</h4>
          <Badge color="green">Optional</Badge>
        </div>
        <p className="text-sm text-scale-1100">
          Choose the database instance size that best fits your needs
        </p>
      </div>
      <Radio.Group type="cards" className="billing-compute-radio">
        {computeSizes.map((option: any) => {
          const defaultPrice = getProductPrice(option)
          return (
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
              optionalLabel={<div>${defaultPrice.unit_amount / 100} / month</div>}
              checked={selectedComputeSize?.id === option.id}
              onChange={() => onSelectOption(option)}
            />
          )
        })}
      </Radio.Group>
    </div>
  )
}

export default ComputeSizeSelection
