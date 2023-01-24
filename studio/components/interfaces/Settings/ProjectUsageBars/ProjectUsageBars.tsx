import { FC, useEffect } from 'react'
import { Badge, Button, IconAlertCircle, IconInfo, Loading } from 'ui'

import { useStore, useProjectUsage } from 'hooks'
import { formatBytes } from 'lib/helpers'
import { PRICING_TIER_PRODUCT_IDS, USAGE_APPROACHING_THRESHOLD } from 'lib/constants'
import SparkBar from 'components/ui/SparkBar'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import InformationBox from 'components/ui/InformationBox'
import { USAGE_BASED_PRODUCTS } from 'components/interfaces/Billing/Billing.constants'
import { useRouter } from 'next/router'
import * as Tooltip from '@radix-ui/react-tooltip'

interface Props {
  projectRef?: string
}

const ProjectUsage: FC<Props> = ({ projectRef }) => {
  const { ui } = useStore()
  const { usage, error, isLoading } = useProjectUsage(projectRef)
  const router = useRouter()

  const subscriptionTier = ui.selectedProject?.subscription_tier

  const projectHasNoLimits =
    subscriptionTier === PRICING_TIER_PRODUCT_IDS.PAYG ||
    subscriptionTier === PRICING_TIER_PRODUCT_IDS.TEAM ||
    subscriptionTier === PRICING_TIER_PRODUCT_IDS.ENTERPRISE

  const showUsageExceedMessage = subscriptionTier !== undefined && !projectHasNoLimits

  const planNames = {
    [PRICING_TIER_PRODUCT_IDS.FREE]: 'Free',
    [PRICING_TIER_PRODUCT_IDS.PRO]: 'Pro',
    [PRICING_TIER_PRODUCT_IDS.PAYG]: 'Pro',
    [PRICING_TIER_PRODUCT_IDS.TEAM]: 'Team',
    [PRICING_TIER_PRODUCT_IDS.ENTERPRISE]: 'Enterprise',
  }

  const planName = subscriptionTier ? planNames[subscriptionTier] || 'current' : 'current'

  useEffect(() => {
    if (error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to get project's usage data: ${error?.message ?? 'unknown'}`,
      })
    }
  }, [error])

  if (!isLoading && error) {
    return (
      <InformationBox
        hideCollapse
        defaultVisibility
        icon={<IconAlertCircle strokeWidth={2} />}
        title="There was an issue loading the usage details of your project"
      />
    )
  }

  return (
    <Loading active={isLoading}>
      {usage && (
        <div>
          {USAGE_BASED_PRODUCTS.map((product) => {
            const isExceededUsage =
              showUsageExceedMessage &&
              product.features
                .map((feature) => {
                  const featureUsage = usage[feature.key]
                  return featureUsage.usage / featureUsage.limit > 1
                })
                .some((x) => x === true)

            return (
              <div
                key={product.title}
                className={[
                  'mb-8 overflow-hidden rounded border',
                  'border-panel-border-light dark:border-panel-border-dark',
                ].join(' ')}
              >
                <table className="w-full bg-panel-body-light dark:bg-panel-body-dark">
                  {/* Header */}
                  <thead className="bg-panel-header-light dark:bg-panel-header-dark">
                    <tr className="overflow-hidden rounded">
                      <th className="w-1/4 px-6 py-3 text-left">
                        <div className="flex items-center space-x-4">
                          <div
                            className={[
                              'flex h-8 w-8 items-center justify-center',
                              'rounded bg-scale-500 dark:bg-white',
                            ].join(' ')}
                          >
                            {product.icon}
                          </div>
                          <h5 className="mb-0">{product.title}</h5>
                        </div>
                      </th>
                      {/* Plan Limits */}
                      <th className="hidden p-3 text-left text-xs font-medium leading-4 text-gray-400 lg:table-cell">
                        {isExceededUsage && <Badge color="red">Exceeded usage</Badge>}
                      </th>
                      {/* Usage */}
                      <th className="p-3 text-left text-xs font-medium leading-4 text-gray-400" />
                    </tr>
                  </thead>

                  {/* Line items */}
                  {usage === undefined ? (
                    <div className="w-96 px-4 pt-1 pb-4">
                      <ShimmeringLoader />
                    </div>
                  ) : (
                    <tbody>
                      {product.features.map((feature) => {
                        const featureUsage = usage[feature.key]
                        const usageValue = featureUsage.usage || 0
                        const usageRatio = usageValue / featureUsage.limit
                        const isApproaching = usageRatio >= USAGE_APPROACHING_THRESHOLD
                        const isExceeded = showUsageExceedMessage && usageRatio >= 1
                        const isAvailableInPlan = featureUsage.available_in_plan

                        let usageElement
                        if (!isAvailableInPlan) {
                          usageElement = (
                            <div className="flex justify-between items-center">
                              <span>Not included in {planName} tier</span>
                              <Button
                                size="tiny"
                                onClick={() =>
                                  router.push(`/project/${projectRef}/settings/billing/update`)
                                }
                              >
                                Upgrade to Pro
                              </Button>
                            </div>
                          )
                        } else if (showUsageExceedMessage) {
                          usageElement = (
                            <SparkBar
                              type="horizontal"
                              barClass={`${
                                isExceeded
                                  ? 'bg-red-900'
                                  : isApproaching
                                  ? 'bg-yellow-900'
                                  : 'bg-brand-900'
                              }`}
                              value={usageValue}
                              max={featureUsage.limit}
                              labelBottom={
                                feature.units === 'bytes'
                                  ? formatBytes(usageValue)
                                  : usageValue.toLocaleString()
                              }
                              labelTop={
                                feature.units === 'bytes'
                                  ? formatBytes(featureUsage.limit)
                                  : featureUsage.limit.toLocaleString()
                              }
                            />
                          )
                        } else {
                          usageElement = (
                            <span>
                              {feature.units === 'bytes' ? formatBytes(usageValue) : usageValue}
                            </span>
                          )
                        }

                        return (
                          <tr
                            key={feature.title}
                            className="border-t border-panel-border-light dark:border-panel-border-dark"
                          >
                            <td className="whitespace-nowrap px-6 py-3 text-sm text-scale-1200">
                              {feature.title}
                              {feature.tooltip && (
                                <Tooltip.Root delayDuration={0}>
                                  <Tooltip.Trigger>
                                    <IconInfo className="ml-2" size={14} strokeWidth={2} />
                                  </Tooltip.Trigger>
                                  <Tooltip.Content side="bottom">
                                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                                    <div
                                      className={[
                                        'max-w-md', // size
                                        'flex items-center justify-center',
                                        'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                                        'border border-scale-200', //border
                                      ].join(' ')}
                                    >
                                      <span className="text-xs text-center text-scale-1200">
                                        {feature.tooltip}
                                      </span>
                                    </div>
                                  </Tooltip.Content>
                                </Tooltip.Root>
                              )}
                            </td>
                            {ui.selectedProject?.subscription_tier !== undefined && (
                              <>
                                {showUsageExceedMessage && (
                                  <td className="hidden w-1/5 whitespace-nowrap p-3 text-sm text-scale-1200 lg:table-cell">
                                    {isAvailableInPlan ? (
                                      <>{(usageRatio * 100).toFixed(2)} %</>
                                    ) : (
                                      <>-</>
                                    )}
                                  </td>
                                )}
                                <td className="px-6 py-3 text-sm text-scale-1200">
                                  {usageElement}
                                </td>
                              </>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  )}
                </table>
              </div>
            )
          })}
        </div>
      )}
    </Loading>
  )
}

export default ProjectUsage
