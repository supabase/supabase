import { FC } from 'react'
import dayjs from 'dayjs'
import { sum } from 'lodash'
import { useRouter } from 'next/router'
import { Loading, Button } from '@supabase/ui'

import { formatBytes } from 'lib/helpers'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { useStore, useFlag } from 'hooks'
import CostBreakdownRow from './CostBreakdownRow'
import { StripeSubscription } from './Subscription.types'
import { deriveFeatureCost, deriveProductCost } from '../PAYGUsage/PAYGUsage.utils'
import { chargeableProducts } from '../PAYGUsage/PAYGUsage.constants'
import { PaygStats, ProductFeature } from '../PAYGUsage/PAYGUsage.types'

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
  const router = useRouter()
  const { ui } = useStore()
  const isOrgOwner = ui.selectedOrganization?.is_owner
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const isPayg = subscription?.tier.prod_id === STRIPE_PRODUCT_IDS.PAYG
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
              <Button
                disabled={!isOrgOwner || projectUpdateDisabled}
                onClick={() => router.push(`/project/${project.ref}/settings/billing/update`)}
                type="primary"
              >
                Change subscription
              </Button>
              {!isOrgOwner ? (
                <p className="text-scale-1100 text-xs">
                  Only the organization owner can amend subscriptions
                </p>
              ) : projectUpdateDisabled ? (
                <p className="text-scale-1100 text-right text-xs">
                  Subscription changes are currently disabled
                  <br />
                  Our engineers are working on a fix
                </p>
              ) : (
                <div />
              )}
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

          {/* Cost Breakdown */}
          {!loading && subscription && (
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
          )}
        </div>
      </div>
    </Loading>
  )
}

export default Subscription
