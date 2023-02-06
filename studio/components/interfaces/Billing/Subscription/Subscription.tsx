import dayjs from 'dayjs'
import { FC } from 'react'
import { useRouter } from 'next/router'
import { Button, Loading } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore, useFlag, useProjectUsage } from 'hooks'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { formatBytes } from 'lib/helpers'

import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import CostBreakdownRow from './CostBreakdownRow'
import { StripeSubscription } from './Subscription.types'
import NoPermission from 'components/ui/NoPermission'
import { USAGE_BASED_PRODUCTS } from 'components/interfaces/Billing/Billing.constants'

interface Props {
  project: any
  subscription: StripeSubscription
  loading?: boolean
  showProjectName?: boolean
  currentPeriodStart: number
  currentPeriodEnd: number
}

const Subscription: FC<Props> = ({
  project,
  subscription,
  loading = false,
  showProjectName = false,
  currentPeriodStart,
  currentPeriodEnd,
}) => {
  const { ui } = useStore()
  const router = useRouter()

  const { ref } = router.query
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const canReadSubscription = checkPermissions(PermissionAction.READ, 'subscriptions')
  const canUpdateSubscription = checkPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const { usage, isLoading: loadingUsage } = useProjectUsage(ref as string)

  const isPayg = subscription?.tier.prod_id === STRIPE_PRODUCT_IDS.PAYG
  const isEnterprise = subscription.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.ENTERPRISE

  const addOns = subscription?.addons ?? []
  const paid = subscription && subscription.tier.unit_amount > 0
  const basePlanCost = subscription?.tier.unit_amount / 100

  const deriveTotalCost = (): number => {
    const totalAddOnCost = addOns
      .map((addOn) => addOn.unit_amount / 100)
      .reduce((prev, current) => prev + current, 0)
    const totalUsageCost =
      usage === undefined
        ? 0
        : Object.keys(usage)
            .map((productKey) => {
              return usage[productKey].cost ?? 0
            })
            .reduce((prev, current) => prev + current, 0)

    return basePlanCost + totalAddOnCost + totalUsageCost
  }

  return (
    <Loading active={loading || loadingUsage}>
      <div className="mb-8 w-full overflow-hidden rounded border border-panel-border-light dark:border-panel-border-dark">
        <div className="bg-panel-body-light dark:bg-panel-body-dark">
          <div className="flex items-center justify-between px-6 pt-4">
            <div className="flex flex-col">
              <p className="text-sm text-scale-1100">
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
                        'border border-scale-200 text-center', //border
                        'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                      ].join(' ')}
                    >
                      <span className="text-xs text-scale-1200">
                        {projectUpdateDisabled ? (
                          <>
                            Subscription changes are currently disabled.
                            <br />
                            Our engineers are working on a fix.
                          </>
                        ) : !canUpdateSubscription ? (
                          'You need additional permissions to amend subscriptions'
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
            <p className="text-sm text-scale-1100">
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
              <div className="relative flex items-center border-t border-panel-border-light px-6 py-3 dark:border-panel-border-dark">
                <div className="w-[40%]">
                  <p className="text-xs uppercase text-scale-900">Item</p>
                </div>
                <div className="flex w-[20%] justify-end">
                  <p className="text-xs uppercase text-scale-900">Amount</p>
                </div>
                <div className="flex w-[20%] justify-end">
                  <p className="text-xs uppercase text-scale-900">Unit Price</p>
                </div>
                <div className="flex w-[20%] justify-end">
                  <p className="text-xs uppercase text-scale-900">Price</p>
                </div>
              </div>
              <CostBreakdownRow
                item="Base Plan"
                amount={1}
                unitPrice={basePlanCost.toFixed(2)}
                price={basePlanCost.toFixed(2)}
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
                USAGE_BASED_PRODUCTS.map((product) => {
                  return product.features.map((feature) => {
                    const amount = usage?.[feature.key]?.usage ?? 0
                    const limit = usage?.[feature.key]?.limit ?? 0
                    const cost = (usage?.[feature.key]?.cost ?? 0).toFixed(2)

                    return (
                      <CostBreakdownRow
                        key={feature.key}
                        item={feature.title}
                        amount={
                          feature.units === 'bytes' ? formatBytes(amount) : amount.toLocaleString()
                        }
                        unitPrice={
                          feature.units === 'bytes'
                            ? `${feature.costPerUnit}/GB`
                            : feature.costPerUnit
                        }
                        price={cost}
                        note={
                          feature.units === 'bytes'
                            ? `${formatBytes(limit)} included`
                            : `${limit.toLocaleString()} included`
                        }
                      />
                    )
                  })
                })}
              <div
                className={[
                  'relative flex items-center border-t px-6 py-3',
                  'border-panel-border-light dark:border-panel-border-dark',
                ].join(' ')}
              >
                <div className="w-[80%]">
                  <p className="text-sm text-scale-1100">
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
