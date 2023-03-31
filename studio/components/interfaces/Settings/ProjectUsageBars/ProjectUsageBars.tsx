import Link from 'next/link'
import { FC, useEffect } from 'react'
import { useRouter } from 'next/router'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import {
  Badge,
  Button,
  IconAlertCircle,
  IconInfo,
  Loading,
  IconExternalLink,
  Alert,
  IconBookOpen,
} from 'ui'

import { checkPermissions, useFlag, useStore } from 'hooks'
import { formatBytes } from 'lib/helpers'
import { PRICING_TIER_PRODUCT_IDS, USAGE_APPROACHING_THRESHOLD } from 'lib/constants'
import SparkBar from 'components/ui/SparkBar'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import InformationBox from 'components/ui/InformationBox'
import { USAGE_BASED_PRODUCTS } from 'components/interfaces/Billing/Billing.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useProjectReadOnlyQuery } from 'data/config/project-read-only-query'
import { ProjectUsageResponseUsageKeys, useProjectUsageQuery } from 'data/usage/project-usage-query'
import { getResourcesExceededLimits } from 'components/ui/OveragesBanner/OveragesBanner.utils'

interface Props {
  projectRef?: string
}

const ProjectUsage: FC<Props> = ({ projectRef }) => {
  const { ui } = useStore()
  const { data: usage, error, isLoading } = useProjectUsageQuery({ projectRef })
  const router = useRouter()

  const { project } = useProjectContext()
  const { data: isReadOnlyMode } = useProjectReadOnlyQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const overusageBadgeEnabled = useFlag('overusageBadge')

  const canUpdateSubscription = checkPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const subscriptionTier = ui.selectedProject?.subscription_tier
  const projectHasNoLimits =
    subscriptionTier === PRICING_TIER_PRODUCT_IDS.PAYG ||
    subscriptionTier === PRICING_TIER_PRODUCT_IDS.TEAM ||
    subscriptionTier === PRICING_TIER_PRODUCT_IDS.ENTERPRISE

  const resourcesExceededLimits = getResourcesExceededLimits(usage)

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
        message: `Failed to get project's usage data: ${(error as any)?.message ?? 'unknown'}`,
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

  const isPaidTier = subscriptionTier !== PRICING_TIER_PRODUCT_IDS.FREE

  const featureFootnotes: Record<string, JSX.Element | null> = {
    db_size: isPaidTier ? (
      <div className="flex justify-between items-center">
        <div className="flex flex-row space-x-4 text-scale-1000">
          {usage?.disk_volume_size_gb && <span>Disk Size: {usage.disk_volume_size_gb} GB</span>}
          <Badge>Auto-Scaling</Badge>
        </div>

        <Button type="default" icon={<IconExternalLink size={14} strokeWidth={1.5} />}>
          <a target="_blank" href="https://supabase.com/docs/guides/platform/database-usage">
            What is disk size?
          </a>
        </Button>
      </div>
    ) : null,
  }

  return (
    <Loading active={isLoading}>
      {usage && (
        <div>
          {resourcesExceededLimits.length > 0 &&
            showUsageExceedMessage &&
            overusageBadgeEnabled && (
              <div className="mb-10">
                <InformationBox
                  hideCollapse
                  defaultVisibility
                  icon={<IconAlertCircle strokeWidth={2} />}
                  title="You are exceeding your plans quota"
                  description={
                    <div className="p-1">
                      {subscriptionTier === PRICING_TIER_PRODUCT_IDS.FREE ? (
                        <div>
                          <p>
                            Your project is currently on the Free tier - upgrade to the Pro tier for
                            a greatly increased quota and continue to scale.
                          </p>
                          <p className="mb-4">
                            See{' '}
                            <Link href="https://supabase.com/pricing" passHref>
                              <a className="text-brand-900">pricing page</a>
                            </Link>{' '}
                            for a full breakdown of available plans.
                          </p>
                          <Link href={`/project/${projectRef}/settings/billing/update`}>
                            <a>
                              <Button>Upgrade to Pro</Button>
                            </a>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p>
                            By default, Pro projects have spend caps to control costs. When enabled,
                            usage is limited to the plan's quota, with restrictions when limits are
                            exceeded. To scale beyond Pro limits without restrictions, disable the
                            spend cap and pay for over-usage beyond the quota.
                          </p>
                          <Link href={`/project/${projectRef}/settings/billing/update/pro`}>
                            <a>
                              <Button>Configure Spend Cap</Button>
                            </a>
                          </Link>
                        </div>
                      )}
                    </div>
                  }
                />
              </div>
            )}

          {USAGE_BASED_PRODUCTS.map((product) => {
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
                    </tr>
                  </thead>
                  {/* Line items */}
                  {usage === undefined ? (
                    <div className="px-4 pt-1 pb-4 w-96">
                      <ShimmeringLoader />
                    </div>
                  ) : (
                    <tbody>
                      {product.features.map((feature) => {
                        const featureUsage = usage[feature.key as ProjectUsageResponseUsageKeys]
                        const usageValue = featureUsage.usage || 0
                        const usageRatio = usageValue / featureUsage.limit
                        const isApproaching = usageRatio >= USAGE_APPROACHING_THRESHOLD
                        const isExceeded = showUsageExceedMessage && usageRatio >= 1
                        const isAvailableInPlan = featureUsage.available_in_plan

                        let usageElement
                        if (!isAvailableInPlan) {
                          usageElement = (
                            <div className="flex items-center justify-between">
                              <span>Not included in {planName} tier</span>
                              {canUpdateSubscription && (
                                <Button
                                  size="tiny"
                                  onClick={() =>
                                    router.push(`/project/${projectRef}/settings/billing/update`)
                                  }
                                >
                                  Upgrade to Pro
                                </Button>
                              )}
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

                        return [
                          <tr
                            key={feature.title}
                            className="border-t border-panel-border-light dark:border-panel-border-dark"
                          >
                            <td className="px-6 py-3 text-sm whitespace-nowrap text-scale-1200">
                              {feature.title}
                              {feature.tooltip && (
                                <Tooltip.Root delayDuration={0}>
                                  <Tooltip.Trigger>
                                    <IconInfo className="ml-2" size={14} strokeWidth={2} />
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
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
                                  </Tooltip.Portal>
                                </Tooltip.Root>
                              )}
                            </td>
                            {ui.selectedProject?.subscription_tier !== undefined && (
                              <>
                                {showUsageExceedMessage && (
                                  <td className="hidden w-1/5 p-3 text-sm whitespace-nowrap text-scale-1200 lg:table-cell">
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
                          </tr>,
                          featureFootnotes[feature.key] && (
                            <tr key={`${feature.title}-footnote`}>
                              <td
                                className="whitespace-nowrap px-6 py-3 text-sm text-scale-1200"
                                colSpan={3}
                              >
                                {featureFootnotes[feature.key]}
                              </td>
                            </tr>
                          ),
                        ]
                      })}
                    </tbody>
                  )}
                </table>

                {isReadOnlyMode && product.title === 'Database' && (
                  <div className="p-6">
                    <Alert title={'Database is in read-only mode'} variant="danger" withIcon>
                      <p>
                        {isPaidTier ? (
                          <>
                            Your disk has reached 95% capacity and has entered{' '}
                            <a
                              href={`https://supabase.com/docs/guides/platform/database-usage#paid-tier-disk-auto-scaling`}
                              className="underline transition hover:text-scale-1200"
                            >
                              read-only mode
                            </a>
                            .
                          </>
                        ) : (
                          <>
                            You have exceeded the 500mb Database size limit and your project is now
                            in{' '}
                            <a
                              href={`https://supabase.com/docs/guides/platform/database-usage#free-tier-project-read-only-mode`}
                              className="underline transition hover:text-scale-1200"
                            >
                              read-only mode
                            </a>
                            .
                          </>
                        )}
                      </p>
                      {isPaidTier ? (
                        <>
                          <p>
                            For Pro and Enterprise projects,{' '}
                            <a
                              href="https://supabase.com/docs/guides/platform/database-usage#paid-tier-disk-auto-scaling"
                              className="underline transition hover:text-scale-1200"
                            >
                              Disk Size expands automatically
                            </a>{' '}
                            when it reaches 90% capacity, but can only occur once every six hours.
                            If the disk size has already expanded and then reaches 95% capacity
                            within 6 hours, then{' '}
                            <a
                              href="https://supabase.com/docs/guides/platform/database-usage#paid-tier-project-read-only-mode"
                              className="underline transition hover:text-scale-1200"
                            >
                              your disk will enter read-only mode
                            </a>{' '}
                            until it can resize again after 6 hours.
                          </p>
                          <p className="mt-2">
                            If you require help or need your disk changed to read/write mode so you
                            can delete data,{' '}
                            <Link
                              href={`/support/new?ref=${
                                projectRef ? projectRef : ''
                              }&category=Database_unresponsive&Subject=Read%20only%20mode%20issue`}
                            >
                              <a className="underline transition hover:text-scale-1200">
                                you can contact the support team
                              </a>
                            </Link>
                            .
                          </p>
                        </>
                      ) : (
                        <p>
                          You can either{' '}
                          <a
                            href="https://supabase.com/docs/guides/platform/database-usage#increasing-available-disk-size"
                            className="underline transition hover:text-scale-1200"
                          >
                            reduce your disk usage below 500mb
                          </a>{' '}
                          or{' '}
                          <Link
                            href={`/project/${
                              projectRef ? projectRef : ''
                            }/settings/billing/subscription`}
                          >
                            <a className="underline transition hover:text-scale-1200">
                              upgrade your project
                            </a>
                          </Link>
                          .
                        </p>
                      )}

                      {!isPaidTier ? (
                        <Button type="danger" className="mt-3">
                          <a
                            target="_blank"
                            href="https://supabase.com/docs/guides/platform/database-usage#database-storage-management"
                          >
                            Upgrade this project
                          </a>
                        </Button>
                      ) : (
                        <Button
                          type="danger"
                          icon={<IconBookOpen size={14} strokeWidth={1.5} />}
                          className="mt-3"
                        >
                          <a
                            target="_blank"
                            href="https://supabase.com/docs/guides/platform/database-usage#database-storage-management"
                          >
                            Database storage management docs
                          </a>
                        </Button>
                      )}
                    </Alert>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Loading>
  )
}

export default ProjectUsage
