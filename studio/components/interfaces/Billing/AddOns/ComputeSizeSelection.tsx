import { FC } from 'react'
import Link from 'next/link'
import { Badge, Button, IconExternalLink, Radio } from 'ui'

import { useFlag, useParams } from 'hooks'
import { getProductPrice } from '../Billing.utils'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'
import { SubscriptionAddon } from './AddOns.types'

interface Props {
  computeSizes: SubscriptionAddon[]
  currentComputeSize?: SubscriptionAddon
  selectedComputeSize: SubscriptionAddon
  onSelectOption: (option: any) => void
}

const ComputeSizeSelection: FC<Props> = ({
  computeSizes,
  currentComputeSize,
  selectedComputeSize,
  onSelectOption,
}) => {
  const { ref } = useParams()
  const addonUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-lg">Compute add-ons</h4>
            <Badge color="green">Optional</Badge>
          </div>
          <p className="text-sm text-scale-1100">
            Choose the database instance size that best fits your needs
          </p>
        </div>
        <Link href="https://supabase.com/docs/guides/platform/compute-add-ons">
          <a target="_blank">
            <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              About compute add-ons
            </Button>
          </a>
        </Link>
      </div>
      {addonUpdateDisabled ? (
        <DisabledWarningDueToIncident title="Updating database add-ons is currently disabled" />
      ) : currentComputeSize?.isLocked ? (
        <div
          className={[
            'flex items-center justify-between block w-full rounded px-4 py-3',
            'border border-scale-600 bg-scale-100 dark:border-scale-500 dark:bg-scale-400',
          ].join(' ')}
        >
          <div className="space-y-3">
            <h5 className="text-sm text-scale-1200">
              Your project currently has the {currentComputeSize.name} included
            </h5>
            <p className="text-sm text-scale-1100">
              If you would like to change your compute size, do reach out to us
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
          {computeSizes.map((option: any) => {
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
                    {currentComputeSize?.id === option.id && (
                      <Badge color="brand">Current selection</Badge>
                    )}
                  </div>
                }
                // @ts-ignore
                description={option.metadata.features}
                value={option.id}
                optionalLabel={
                  <div className="w-[6rem] flex items-center justify-end">
                    ${defaultPrice.unit_amount / 100} / month
                  </div>
                }
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
              <Link
                href={`/support/new?ref=${ref}&category=sales&subject=Enquiry%20for%20larger%20compute%20size`}
              >
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
