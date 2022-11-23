import { FC } from 'react'
import { useRouter } from 'next/router'
import { Badge, IconAlertCircle, Radio, Button } from 'ui'

import { useFlag, useStore } from 'hooks'
import { DatabaseAddon } from './AddOns.types'
import { getProductPrice } from '../Billing.utils'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'
import InformationBox from 'components/ui/InformationBox'
import { getSemanticVersion } from './AddOns.utils'
import Link from 'next/link'

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
  const { ui } = useStore()
  const router = useRouter()
  const { ref } = router.query
  const addonUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  // Only projects of version greater than supabase-postgrest-14.1.0.44 can use PITR
  const canUsePITR = getSemanticVersion(ui.selectedProject?.dbVersion ?? '') > 141044

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center space-x-2">
          <h4 className="text-lg">Point in time recovery (PITR)</h4>
          <Badge color="green">Optional</Badge>
        </div>
        <p className="text-sm text-scale-1100">
          Restore your database from a specific point in time
        </p>
        {canUsePITR && (
          <div className="mt-2">
            <InformationBox
              icon={<IconAlertCircle strokeWidth={2} />}
              title="Your project is required to minimally be on a Small Add-on to enable PITR"
              description="This is to ensure that your project has enough resources to execute PITR successfully"
            />
          </div>
        )}
      </div>
      {addonUpdateDisabled ? (
        <DisabledWarningDueToIncident title="Updating database add-ons is currently disabled" />
      ) : !canUsePITR ? (
        <InformationBox
          hideCollapse
          defaultVisibility
          title="Your project is too old to be able to enable PITR for"
          description={
            <div className="flex items-center justify-between m-1">
              <p className="text-sm leading-normal">Reach out to us if you're interested!</p>
              <Link
                href={`/support/new?ref=${ref}&category=sales&subject=Project%20too%20old%20old%20for%20PITR`}
              >
                <a>
                  <Button type="default">Contact support</Button>
                </a>
              </Link>
            </div>
          }
          icon={<IconAlertCircle strokeWidth={2} />}
        />
      ) : (
        <Radio.Group type="cards" className="billing-compute-radio">
          {pitrDurationOptions.map((option: any) => {
            const defaultPrice = getProductPrice(option)
            return (
              <Radio
                hidden
                key={option.id || 'pitr-disabled'}
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
