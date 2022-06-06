import { FC } from 'react'
import Link from 'next/link'
import { Badge, Button, Radio } from '@supabase/ui'

import { useStore, useFlag } from 'hooks'
import { getProductPrice } from '../Billing.utils'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'

interface Props {
  computeSizes: any[]
  selectedComputeSize: any
  onSelectOption: (option: any) => void
}

const ComputeSizeSelection: FC<Props> = ({ computeSizes, selectedComputeSize, onSelectOption }) => {
  const { ui } = useStore()
  const projectRef = ui.selectedProjectRef
  const addonUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center space-x-2">
          <h4 className="text-lg">Database add-ons</h4>
          <Badge color="green">Optional</Badge>
        </div>
        <p className="text-scale-1100 text-sm">
          Choose the database instance size that best fits your needs
        </p>
      </div>
      {addonUpdateDisabled ? (
        <DisabledWarningDueToIncident title="Updating database add-ons is currently disabled" />
      ) : (
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
          <Radio
            hidden
            disabled
            key="compute-size-cta"
            align="vertical"
            label="Need a larger add on?"
            description="Reach out to us - we've got you covered!"
            optionalLabel={
              <Link href={`/support/new?ref=${projectRef}&category=sales`}>
                <a>
                  <Button>Contact us</Button>
                </a>
              </Link>
            }
          />
        </Radio.Group>
      )}
    </div>
  )
}

export default ComputeSizeSelection
