import { FC } from 'react'
import { Badge, Radio } from 'ui'

import { useFlag } from 'hooks'
import { DatabaseAddon } from './AddOns.types'
import { getProductPrice } from '../Billing.utils'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'

interface Props {
  pitrDurationOptions: DatabaseAddon[]
  currentPitrDuration?: DatabaseAddon
  selectedPitrDuration?: DatabaseAddon
  onSelectOption: (option: any) => void
}

const PITRDurationSelection: FC<Props> = ({
  pitrDurationOptions,
  currentPitrDuration,
  selectedPitrDuration,
  onSelectOption,
}) => {
  const addonUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center space-x-2">
          <h4 className="text-lg">Point in time recovery</h4>
          <Badge color="green">Optional</Badge>
        </div>
        <p className="text-sm text-scale-1100">
          Restore your database from a specific point in time
        </p>
      </div>
      {addonUpdateDisabled ? (
        <DisabledWarningDueToIncident title="Updating database add-ons is currently disabled" />
      ) : (
        <Radio.Group type="cards" className="billing-compute-radio">
          {pitrDurationOptions.map((option: any) => {
            const defaultPrice = getProductPrice(option)
            return (
              <Radio
                hidden
                key={option.id}
                align="vertical"
                // @ts-ignore
                label={
                  <div className="flex items-center space-x-4">
                    <p>{option.name}</p>
                    {currentPitrDuration?.id === option.id && (
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
                checked={selectedPitrDuration?.id === option.id}
                onChange={() => onSelectOption(option)}
              />
            )
          })}
        </Radio.Group>
      )}
    </div>
  )
}

export default PITRDurationSelection
