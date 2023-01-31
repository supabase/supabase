import Link from 'next/link'
import { FC } from 'react'
import { Badge, Button, Radio } from 'ui'

import { useFlag, useParams } from 'hooks'
import { getProductPrice } from '../Billing.utils'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'
import { SubscriptionAddon } from './AddOns.types'

interface Props {
  options: SubscriptionAddon[]
  currentOption?: SubscriptionAddon
  selectedOption: SubscriptionAddon
  onSelectOption: (option: any) => void
}

const CustomDomainSelection: FC<Props> = ({
  options,
  currentOption,
  selectedOption,
  onSelectOption,
}) => {
  const { ref } = useParams()
  const addonUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center space-x-2">
          <h4 className="text-lg">Custom Domains</h4>
          <Badge color="green">Optional</Badge>
        </div>
        <p className="text-sm text-scale-1100">Present a branded experience to your users</p>
      </div>
      {addonUpdateDisabled ? (
        <DisabledWarningDueToIncident title="Updating database add-ons is currently disabled" />
      ) : currentOption?.isLocked ? (
        <div
          className={[
            'flex items-center justify-between block w-full rounded px-4 py-3',
            'border border-scale-600 bg-scale-100 dark:border-scale-500 dark:bg-scale-400',
          ].join(' ')}
        >
          <div className="space-y-3">
            <h5 className="text-sm text-scale-1200">
              Your project currently has custom domains included
            </h5>
            <p className="text-sm text-scale-1100">
              If you would like to disable custom domains, do reach out to us
            </p>
          </div>
          <div className="">
            <Link
              href={`/support/new?ref=${ref}&category=sales&subject=Disable%20custom%20domains%20`}
            >
              <a>
                <Button>Contact us</Button>
              </a>
            </Link>
          </div>
        </div>
      ) : (
        <Radio.Group type="cards" className="billing-compute-radio">
          {options.map((option: any) => {
            const defaultPrice = getProductPrice(option)
            return (
              <Radio
                hidden
                key={option.id || 'micro-add-on'}
                align="vertical"
                // @ts-ignore
                label={
                  <div className="flex items-center space-x-4">
                    <p>{option.name}</p>
                    {currentOption?.id === option.id && (
                      <Badge color="brand">Current selection</Badge>
                    )}
                  </div>
                }
                // @ts-ignore
                description={
                  <div>
                    <p>{option.metadata.features}</p>
                  </div>
                }
                value={option.id}
                optionalLabel={<div>${defaultPrice.unit_amount / 100} / month</div>}
                checked={selectedOption?.id === option.id}
                onChange={() => onSelectOption(option)}
              />
            )
          })}
        </Radio.Group>
      )}
    </div>
  )
}

export default CustomDomainSelection
