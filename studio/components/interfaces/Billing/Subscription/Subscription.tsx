import dayjs from 'dayjs'
import { FC } from 'react'
import { sum } from 'lodash'
import { useRouter } from 'next/router'
import { Button, Loading } from '@supabase/ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore, useFlag } from 'hooks'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { formatBytes } from 'lib/helpers'

import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { chargeableProducts } from '../PAYGUsage/PAYGUsage.constants'
import { PaygStats, ProductFeature } from '../PAYGUsage/PAYGUsage.types'
import { deriveFeatureCost, deriveProductCost } from '../PAYGUsage/PAYGUsage.utils'
import CostBreakdownRow from './CostBreakdownRow'
import { StripeSubscription } from './Subscription.types'
import NoPermission from 'components/ui/NoPermission'

interface Props {
  project: any
  subscription: StripeSubscription
  paygStats: PaygStats | undefined
  loading?: boolean
  showProjectName?: boolean
  currentPeriodStart: number
  currentPeriodEnd: number
}

const Subscription: FC<Props> = ({
  project,
  subscription,
  paygStats,
  loading = false,
  showProjectName = false,
  currentPeriodStart,
  currentPeriodEnd,
}) => {
  const { ui } = useStore()
  const router = useRouter()

  const enablePermissions = useFlag('enablePermissions')
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const canReadSubscription = checkPermissions(PermissionAction.READ, 'subscriptions')
  const canUpdateSubscription = enablePermissions
    ? checkPermissions(PermissionAction.BILLING_WRITE, 'stripe.subscriptions')
    : ui.selectedOrganization?.is_owner

  const isPayg = subscription?.tier.prod_id === STRIPE_PRODUCT_IDS.PAYG
  const isEnterprise = subscription.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.ENTERPRISE

  const addOns = subscription?.addons ?? []
  const paid = subscription && subscription.tier.unit_amount > 0
  const basePlanCost = subscription?.tier.unit_amount / 100

  const deriveTotalCost = (): number => {
    const totalAddOnCost = sum(addOns.map((addOn) => addOn.unit_amount / 100))
    const totalUsageCost = isPayg
      ? Number(sum(chargeableProducts.map((product) => deriveProductCost(paygStats, product))))
      : 0
    return basePlanCost + totalAddOnCost + totalUsageCost
  }

  return (
    <Loading active={loading}>
      <div className="border-panel-border-light dark:border-panel-border-dark mb-8 w-full overflow-hidden rounded border">
        <div className="bg-panel-body-light dark:bg-panel-body-dark">
          <div className="flex items-center justify-between px-6 pt-4">
            <div className="flex flex-col">
              <p className="text-scale-1100 text-sm">
                {showProjectName ? project.name : 'Current subscription'}
              </p>
              <h3 className="mb-0 text-xl">{subscription?.tier.name ?? '-'}</h3>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Button
                    disabled={!canUpdateSubscription || projectUpdateDisabled}
                    onClick={() => {
                      const url = isEnterprise
                        ? `/project/${project.ref}/settings/billing/update/enterprise`
                        : `/project/${project.ref}/settings/billing/update`
                      router.push(url)
                    }}
                    type="primary"
                  >
                    {isEnterprise ? 'Change add-ons' : 'Change subscription'}
                  </Button>
                </Tooltip.Trigger>
                {!canUpdateSubscription || projectUpdateDisabled ? (
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'border-scale-200 border text-center', //border
                        'bg-scale-100 rounded py-1 px-2 leading-none shadow', // background
                      ].join(' ')}
                    >
                      <span className="text-scale-1200 text-xs">
                        {projectUpdateDisabled ? (
                          <>
                            Subscription changes are currently disabled.
                            <br />
                            Our engineers are working on a fix.
                          </>
                        ) : !canUpdateSubscription && enablePermissions ? (
                          'You need additional permissions to amend subscriptions'
                        ) : !canUpdateSubscription && !enablePermissions ? (
                          'Only the organization owner can amend subscriptions'
                        ) : (
                          ''
                        )}
                      </span>
                    </div>
                  </Tooltip.Content>
                ) : (
                  <></>
                )}
              </Tooltip.Root>
            </div>
          </div>
          {paid && (
            <div className="px-6 pt-4">
              <p>
                The next payment for this plan will be occur on{' '}
                {dayjs.unix(currentPeriodEnd).utc().format('MMM D, YYYY')}.
              </p>
            </div>
          )}
          <div className="mt-2 px-6 pb-4">
            <p className="text-scale-1100 text-sm">
              See our{' '}
              <a href="https://supabase.com/pricing" target="_blank" className="underline">
                pricing
              </a>{' '}
              for a more detailed analysis of what Supabase has on offer.
            </p>
          </div>

          {!canReadSubscription ? (
            <div className="px-6 pb-4">
              <NoPermission resourceText="view this project's subscription" />
            </div>
          ) : !loading && subscription ? (
            // Cost breakdown
            <>
              <div className="border-panel-border-light dark:border-panel-border-dark relative flex items-center border-t px-6 py-3">
                <div className="w-[40%]">
                  <p className="text-scale-900 text-xs uppercase">Item</p>
                </div>
                <div className="flex w-[20%] justify-end">
                  <p className="text-scale-900 text-xs uppercase">Amount</p>
                </div>
                <div className="flex w-[20%] justify-end">
                  <p className="text-scale-900 text-xs uppercase">Unit Price</p>
                </div>
                <div className="flex w-[20%] justify-end">
                  <p className="text-scale-900 text-xs uppercase">Price</p>
                </div>
              </div>
              <CostBreakdownRow
                item="Base Plan"
                amount={1}
                unitPrice={basePlanCost}
                price={basePlanCost}
              />
              {addOns.map((addOn) => (
                <CostBreakdownRow
                  key={addOn.prod_id}
                  item={addOn.name}
                  amount={1}
                  unitPrice={addOn.unit_amount / 100}
                  price={addOn.unit_amount / 100}
                />
              ))}
              {isPayg &&
                chargeableProducts.map((product) =>
                  product.features.map((feature: ProductFeature) => {
                    const derivedCost = deriveFeatureCost(paygStats, feature)
                    const cost = derivedCost.toFixed(2)
                    return (
                      <CostBreakdownRow
                        key={feature.attribute}
                        item={feature.title}
                        freeQuota={feature.freeQuota}
                        amount={formatBytes(
                          paygStats?.[feature.attribute]?.[feature.pricingModel] ?? 0
                        )}
                        unitPrice={`${feature.costPerUnit}/GB`}
                        price={cost}
                      />
                    )
                  })
                )}
              <div className="border-panel-border-light dark:border-panel-border-dark relative flex items-center border-t px-6 py-3">
                <div className="w-[80%]">
                  <p className="text-scale-1100 text-sm">
                    Estimated cost for {dayjs.unix(currentPeriodStart).utc().format('MMM D, YYYY')}{' '}
                    - {dayjs.unix(currentPeriodEnd).utc().format('MMM D, YYYY')} so far
                  </p>
                </div>
                <div className="flex w-[20%] items-center justify-end space-x-1">
                  <p className="text-scale-1100">$</p>
                  <h3 className="m-0 text-xl">{deriveTotalCost().toFixed(2)}</h3>
                </div>
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    </Loading>
  )
}

export default Subscription
