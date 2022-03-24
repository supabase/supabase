import { FC } from 'react'
import dayjs from 'dayjs'
import { sum } from 'lodash'
import { useRouter } from 'next/router'
import { Loading, Button } from '@supabase/ui'
import { Dictionary } from '@supabase/grid'

import { formatBytes } from 'lib/helpers'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { useStore, useFlag, useSubscriptionStats } from 'hooks'
import CostBreakdownRow from './CostBreakdownRow'
import { StripeSubscription } from './Subscription.types'
import { deriveFeatureCost, deriveProductCost } from '../PAYGUsage/PAYGUsage.utils'
import { chargeableProducts } from '../PAYGUsage/PAYGUsage.constants'
import UpgradeButton from './UpgradeButton'

interface Props {
  project: any
  subscription: StripeSubscription
  paygStats?: Dictionary<number>
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

  const nativeBilling = useFlag('nativeBilling')
  const subscriptionStats = useSubscriptionStats()

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
      <div className="w-full rounded overflow-hidden border border-panel-border-light dark:border-panel-border-dark mb-8">
        <div className="bg-panel-body-light dark:bg-panel-body-dark">
          <div className="px-6 pt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-scale-1100 text-sm">
                {showProjectName ? project.name : 'Current subscription'}
              </p>
              <h3 className="text-xl mb-0">{subscription?.tier.name ?? '-'}</h3>
            </div>
            {nativeBilling ? (
              <div className="flex flex-col items-end space-y-2">
                <Button
                  disabled={!isOrgOwner}
                  onClick={() => router.push(`/project/${project.ref}/settings/billing/update`)}
                  type="primary"
                >
                  Change subscription
                </Button>
                {!isOrgOwner && (
                  <p className="text-sm text-scale-1100">
                    Only the organization owner can amend subscriptions
                  </p>
                )}
              </div>
            ) : (
              <UpgradeButton
                paid={paid}
                projectRef={project.ref}
                subscriptionStats={subscriptionStats}
              />
            )}
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
            <p className="text-sm text-scale-1100">
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
              <div className="px-6 py-3 relative border-t border-panel-border-light dark:border-panel-border-dark flex items-center">
                <div className="w-[40%]">
                  <p className="text-sm">Item</p>
                </div>
                <div className="w-[20%] flex justify-end">
                  <p className="text-sm">Amount</p>
                </div>
                <div className="w-[20%] flex justify-end">
                  <p className="text-sm">Unit Price</p>
                </div>
                <div className="w-[20%] flex justify-end">
                  <p className="text-sm">Price</p>
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
                  product.features.map((feature) => {
                    const cost = deriveFeatureCost(paygStats, feature).toFixed(3)
                    return (
                      <CostBreakdownRow
                        key={feature.attribute}
                        item={feature.title}
                        amount={formatBytes(paygStats?.[feature.attribute] ?? 0)}
                        unitPrice={`${feature.costPerUnit}/GB`}
                        price={cost}
                      />
                    )
                  })
                )}
              <div className="px-6 py-3 relative border-t border-panel-border-light dark:border-panel-border-dark flex items-center">
                <div className="w-[80%]">
                  <p className="text-sm">
                    Estimated cost for {dayjs.unix(currentPeriodStart).utc().format('MMM D, YYYY')}{' '}
                    - {dayjs.unix(currentPeriodEnd).utc().format('MMM D, YYYY')} so far
                  </p>
                </div>
                <div className="w-[20%] flex justify-end items-center space-x-1">
                  <p className="text-scale-1100">$</p>
                  <h3 className="text-xl m-0">{deriveTotalCost().toFixed(2)}</h3>
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
