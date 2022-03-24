import { FC } from 'react'
import { Radio } from '@supabase/ui'

interface Props {
  computeSizes: any[]
  selectedComputeSize: any
  onSelectOption: (option: any) => void
}

const ComputeSizeSelection: FC<Props> = ({ computeSizes, selectedComputeSize, onSelectOption }) => {
  return (
    <div className="space-y-4">
      <div>
        <p>Compute size</p>
        <p className="text-sm text-scale-1100">
          Choose the database instance size that best fits your needs
        </p>
      </div>
      <Radio.Group type="cards" className="billing-compute-radio">
        {computeSizes.map((option: any) => {
          const defaultPriceId = option.metadata.default_price_id
          const price =
            defaultPriceId !== undefined
              ? option.prices.find((price: any) => price.id === defaultPriceId).unit_amount
              : option.prices[0].unit_amount

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
              optionalLabel={<div>${price / 100} / month</div>}
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
