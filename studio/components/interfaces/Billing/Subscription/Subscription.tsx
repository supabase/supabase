import { FC } from 'react'
import dayjs from 'dayjs'
import { sum } from 'lodash'
import { Typography, Loading } from '@supabase/ui'

import UpgradeButton from './UpgradeButton'
import CostBreakdownRow from './CostBreakdownRow'
import { StripeSubscription } from './Subscription.types'
import { deriveFeatureCost, deriveProductCost } from '../PAYGUsage/PAYGUsage.utils'
import { chargeableProducts } from '../PAYGUsage/PAYGUsage.constants'
import { formatBytes } from 'lib/helpers'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { Dictionary } from '@supabase/grid'
import { SubscriptionStats } from 'hooks'

interface Props {
  project: any
  subscription: StripeSubscription
  subscriptionStats: SubscriptionStats
  paygStats?: Dictionary<number>
  loading?: boolean
  showProjectName?: boolean
  currentPeriodStart: number
  currentPeriodEnd: number
}

const Subscription: FC<Props> = ({
  project,
  subscription,
  subscriptionStats,
  paygStats,
  loading = false,
  showProjectName = false,
  currentPeriodStart,
  currentPeriodEnd,
}) => {
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
              <Typography.Text>
                {showProjectName ? project.name : 'Current subscription'}
              </Typography.Text>
              <Typography.Title level={3} className="mb-0">
                {subscription?.tier.name ?? '-'}
              </Typography.Title>
            </div>
            {/* @ts-ignore */}
            <UpgradeButton
              subscriptionStats={subscriptionStats}
              projectRef={project.ref}
              paid={paid}
            />
          </div>
          {paid && (
            <div className="px-6 pt-4">
              <Typography.Text>
                The next payment for this plan will be occur on{' '}
                {dayjs.unix(currentPeriodEnd).utc().format('MMM D, YYYY')}.
              </Typography.Text>
            </div>
          )}
          <div className="mt-2 px-6 pb-4">
            <Typography.Text type="secondary">
              See our{' '}
              <a href="https://supabase.com/pricing" target="_blank" className="underline">
                pricing
              </a>{' '}
              for a more detailed analysis of what Supabase has on offer.
            </Typography.Text>
          </div>

          {/* Cost Breakdown */}
          {!loading && subscription && (
            <>
              <div className="px-6 py-3 relative border-t border-panel-border-light dark:border-panel-border-dark flex items-center">
                <div className="w-[40%]">
                  <Typography.Text>Item</Typography.Text>
                </div>
                <div className="w-[20%] flex justify-end">
                  <Typography.Text>Amount</Typography.Text>
                </div>
                <div className="w-[20%] flex justify-end">
                  <Typography.Text>Unit Price</Typography.Text>
                </div>
                <div className="w-[20%] flex justify-end">
                  <Typography.Text>Price</Typography.Text>
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
                  <Typography.Text>
                    Estimated cost for {dayjs.unix(currentPeriodStart).utc().format('MMM D, YYYY')}{' '}
                    - {dayjs.unix(currentPeriodEnd).utc().format('MMM D, YYYY')} so far
                  </Typography.Text>
                </div>
                <div className="w-[20%] flex justify-end items-center space-x-1">
                  <Typography.Text className="opacity-50">$</Typography.Text>
                  <Typography.Title level={3} className="m-0">
                    {deriveTotalCost().toFixed(2)}
                  </Typography.Title>
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
