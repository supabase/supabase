import Link from 'next/link'
import { FC } from 'react'
import { Badge, IconAlertCircle, Radio, Button } from 'ui'

import { useFlag, useParams, useStore } from 'hooks'
import { SubscriptionAddon } from './AddOns.types'
import { getProductPrice } from '../Billing.utils'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'
import InformationBox from 'components/ui/InformationBox'
import { getSemanticVersion } from './AddOns.utils'

interface Props {
  pitrDurationOptions: SubscriptionAddon[]
  currentPitrDuration?: SubscriptionAddon
  selectedPitrDuration?: SubscriptionAddon
  onSelectOption: (option: any) => void
}

const PITRDurationSelection: FC<Props> = ({
  pitrDurationOptions,
  currentPitrDuration,
  selectedPitrDuration,
  onSelectOption,
}) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const addonUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const projectRegion = ui.selectedProject?.region ?? ''

  // Only projects of version greater than supabase-postgrest-14.1.0.44 can use PITR
  const sufficientPgVersion = getSemanticVersion(ui.selectedProject?.dbVersion ?? '') >= 141044
  const isDisabledForRegion = ['ap-northeast-2'].includes(projectRegion)

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
        {sufficientPgVersion && !isDisabledForRegion && !currentPitrDuration?.isLocked && (
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
      ) : !sufficientPgVersion ? (
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
      ) : currentPitrDuration?.isLocked ? (
        <div
          className={[
            'flex items-center justify-between block w-full rounded px-4 py-3',
            'border border-scale-600 bg-scale-100 dark:border-scale-500 dark:bg-scale-400',
          ].join(' ')}
        >
          <div className="space-y-3">
            <h5 className="text-sm text-scale-1200">
              Your project currently has {currentPitrDuration.name} included
            </h5>
            <p className="text-sm text-scale-1100">
              If you would like to change your PITR duration, do reach out to us
            </p>
          </div>
          <div className="">
            <Link href={`/support/new?ref=${ref}&category=sales&subject=Change%20PITR%20duration`}>
              <a>
                <Button>Contact us</Button>
              </a>
            </Link>
          </div>
        </div>
      ) : isDisabledForRegion ? (
        <InformationBox
          hideCollapse
          defaultVisibility
          title={`PITR is not available for your project's region (${projectRegion})`}
          description={
            <div className="flex items-center justify-between m-1">
              <p className="text-sm leading-normal">
                Reach out to us if you're interested! We'll see what we can do for you.
              </p>
              <Link
                href={`/support/new?ref=${ref}&category=sales&subject=Enquiry%20on%20PITR%20for%20project%20in%20${projectRegion}`}
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
