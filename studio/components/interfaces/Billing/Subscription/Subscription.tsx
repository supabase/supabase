import dayjs from 'dayjs'
import { FC, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Button, Loading } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useFlag, useStore } from 'hooks'
import { useParams } from 'common/hooks'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { formatBytes } from 'lib/helpers'

import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import CostBreakdownRow from './CostBreakdownRow'
import NoPermission from 'components/ui/NoPermission'
import { USAGE_BASED_PRODUCTS } from 'components/interfaces/Billing/Billing.constants'
import { ProjectUsageResponseUsageKeys, useProjectUsageQuery } from 'data/usage/project-usage-query'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { useIsProjectActive } from 'components/layouts/ProjectLayout/ProjectContext'

interface Props {
  showProjectName?: boolean
}

const Subscription: FC<Props> = ({ showProjectName = false }) => {
  const router = useRouter()
  const { ui } = useStore()
  const { ref: projectRef } = useParams()
  const isActive = useIsProjectActive()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const canReadSubscription = checkPermissions(PermissionAction.READ, 'subscriptions')
  const canUpdateSubscription = checkPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const project = ui.selectedProject
  const {
    data: subscription,
    isLoading: loading,
    error,
  } = useProjectSubscriptionQuery({ projectRef: ui.selectedProject?.ref })
  const { data: usage, isLoading: loadingUsage } = useProjectUsageQuery({ projectRef })

  const isPayg = subscription?.tier.prod_id === STRIPE_PRODUCT_IDS.PAYG
  const isEnterprise = subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.ENTERPRISE

  const addOns = subscription?.addons ?? []
  const paid = subscription && subscription.tier.unit_amount > 0
  const basePlanCost = (subscription?.tier.unit_amount ?? 0) / 100

  const currentPeriodStart = subscription?.billing.current_period_start ?? 0
  const currentPeriodEnd = subscription?.billing.current_period_end ?? 0

  const deriveTotalCost = (): number => {
    const totalAddOnCost = addOns
      .map((addOn) => addOn.unit_amount / 100)
      .reduce((prev, current) => prev + current, 0)
    const totalUsageCost =
      usage === undefined
        ? 0
        : Object.keys(usage)
            .map((productKey) => {
              return usage[productKey as ProjectUsageResponseUsageKeys].cost ?? 0
            })
            .reduce((prev, current) => prev + current, 0)

    return basePlanCost + totalAddOnCost + totalUsageCost
  }

  useEffect(() => {
    if (error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to get project subscription: ${(error as any)?.message ?? 'unknown'}`,
      })
    }
  }, [error])

  return (
    <Loading active={loading}>
      <div className="w-full mb-8 overflow-hidden border rounded border-panel-border-light dark:border-panel-border-dark">
        <div className="bg-panel-body-light dark:bg-panel-body-dark">
          <div className="flex items-center justify-between px-6 pt-4">
            <div className="flex flex-col">
              <p className="text-sm text-scale-1100">
                {showProjectName ? project?.name ?? '' : 'Current subscription'}
              </p>
              <h3 className="mb-0 text-xl">{subscription?.tier.name ?? '-'}</h3>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Button
                    disabled={!canUpdateSubscription || projectUpdateDisabled || !isActive}
                    onClick={() => {
                      const url = isEnterprise
                        ? `/project/${projectRef}/settings/billing/update/enterprise`
                        : `/project/${projectRef}/settings/billing/update`
                      router.push(url)
                    }}
                    type="primary"
                  >
                    {isEnterprise ? 'Change add-ons' : 'Change subscription'}
                  </Button>
                </Tooltip.Trigger>
                {!canUpdateSubscription || projectUpdateDisabled || !isActive ? (
                  <Tooltip.Portal>
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
                          ) : !isActive ? (
                            'Unable to update subscription as project is not active'
                          ) : (
                            ''
                          )}
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
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
          <div className="px-6 pb-4 mt-2">
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
              <div className="relative flex items-center px-6 py-3 border-t border-panel-border-light dark:border-panel-border-dark">
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
                    const amount = usage?.[feature.key as ProjectUsageResponseUsageKeys]?.usage ?? 0
                    const limit = usage?.[feature.key as ProjectUsageResponseUsageKeys]?.limit ?? 0
                    const cost = (
                      usage?.[feature.key as ProjectUsageResponseUsageKeys]?.cost ?? 0
                    ).toFixed(2)

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
