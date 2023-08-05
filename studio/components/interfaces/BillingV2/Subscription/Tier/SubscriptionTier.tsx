import dayjs from 'dayjs'
import Link from 'next/link'

import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SparkBar from 'components/ui/SparkBar'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useFlag, useSelectedOrganization } from 'hooks'
import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import { Alert, Button, IconExternalLink } from 'ui'
import ProjectUpdateDisabledTooltip from 'components/interfaces/Organization/BillingSettings/ProjectUpdateDisabledTooltip'
import SubscriptionPaymentMethod from './SubscriptionPaymentMethod'
import TierUpdateSidePanel from './TierUpdateSidePanel'

export interface SubscriptionTierProps {}

const SubscriptionTier = ({}: SubscriptionTierProps) => {
  const { ref: projectRef } = useParams()
  const selectedOrganization = useSelectedOrganization()
  const orgSlug = selectedOrganization?.slug ?? ''
  const snap = useSubscriptionPageStateSnapshot()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')
  const { data: subscription, isLoading, refetch } = useProjectSubscriptionV2Query({ projectRef })

  const currentPlan = subscription?.plan
  const tierName = currentPlan?.name || 'Unknown'

  const billingCycleStart = dayjs.unix(subscription?.current_period_start ?? 0).utc()
  const billingCycleEnd = dayjs.unix(subscription?.current_period_end ?? 0).utc()
  const daysToCycleEnd = billingCycleEnd.diff(dayjs(), 'days')
  const daysWithinCycle = billingCycleEnd.diff(billingCycleStart, 'days')

  const canChangeTier =
    !projectUpdateDisabled && !['team', 'enterprise'].includes(currentPlan?.id ?? '')

  return (
    <>
      <div className="grid grid-cols-12 gap-6" id="plan">
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="sticky space-y-6 top-16">
            <p className="text-base">Subscription plan</p>
            <div className="text-sm text-scale-1000">
              To manage your billing address, emails or Tax ID, head to your{' '}
              <Link href={`/org/${orgSlug}/billing`}>
                <a>
                  <span className="text-sm text-green-900 transition hover:text-green-1000">
                    organization settings
                  </span>
                  .
                </a>
              </Link>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-scale-1100">More information</p>
              <div>
                <Link href="https://supabase.com/pricing">
                  <a target="_blank" rel="noreferrer">
                    <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                      <p className="text-sm">Pricing</p>
                      <IconExternalLink size={16} strokeWidth={1.5} />
                    </div>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="col-span-12 lg:col-span-7 space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : (
          <div className="col-span-12 lg:col-span-7 space-y-6">
            <div>
              <p className="text-sm">This project is currently on the plan:</p>
              <p className="text-2xl text-brand uppercase">{tierName}</p>
            </div>
            <div>
              <ProjectUpdateDisabledTooltip projectUpdateDisabled={projectUpdateDisabled}>
                <Button
                  type="default"
                  className="pointer-events-auto"
                  disabled={!canChangeTier}
                  onClick={() => snap.setPanelKey('subscriptionPlan')}
                >
                  Change subscription plan
                </Button>
              </ProjectUpdateDisabledTooltip>
            </div>
            {!canChangeTier &&
              (projectUpdateDisabled ? (
                <Alert withIcon variant="info" title={`Unable to update plan from ${tierName}`}>
                  We have temporarily disabled project and subscription changes - our engineers are
                  working on a fix.
                </Alert>
              ) : (
                <Alert
                  withIcon
                  variant="info"
                  title={`Unable to update plan from ${tierName}`}
                  actions={[
                    <div key="contact-support">
                      <Link
                        href={`/support/new?ref=${projectRef}&category=sales&subject=Change%20plan%20away%20from%20${tierName}`}
                      >
                        <a>
                          <Button type="default">Contact support</Button>
                        </a>
                      </Link>
                    </div>,
                  ]}
                >
                  Please contact us if you'd like to change your plan.
                </Alert>
              ))}
            {!subscription?.usage_billing_enabled && (
              <Alert
                withIcon
                variant="info"
                title="This project is limited by the included usage"
                actions={
                  currentPlan?.id === 'free' ? (
                    <Button type="default" onClick={() => snap.setPanelKey('subscriptionPlan')}>
                      Upgrade Plan
                    </Button>
                  ) : (
                    <Button type="default" onClick={() => snap.setPanelKey('costControl')}>
                      Adjust Spend Cap
                    </Button>
                  )
                }
              >
                <p className="text-sm text-scale-1000">
                  When this project exceeds its{' '}
                  <Link href="#breakdown">
                    <a className="text-sm text-green-900 transition hover:text-green-1000">
                      included usage quotas
                    </a>
                  </Link>
                  , it may become unresponsive.{' '}
                  {currentPlan?.id === 'free' ? (
                    <p className="pr-4">
                      If you wish to exceed the included usage, you should upgrade to a paid plan.
                    </p>
                  ) : (
                    <p className="pr-4">
                      You currently have Spend Cap enabled - when you exceed your plan's limit, you
                      will experience restrictions. To scale seamlessly and pay for over-usage, you
                      can adjust your Cost Control settings.
                    </p>
                  )}
                </p>
              </Alert>
            )}
            <SparkBar
              type="horizontal"
              value={daysWithinCycle - daysToCycleEnd}
              max={daysWithinCycle}
              barClass="bg-scale-1200"
              labelBottom={`Current billing cycle (${billingCycleStart.format(
                'MMM DD'
              )} - ${billingCycleEnd.format('MMM DD')})`}
              bgClass="bg-gray-300 dark:bg-gray-600"
              labelBottomClass="!text-scale-1000 pb-1"
              labelTop={`${daysToCycleEnd} Days left`}
            />

            {subscription && (
              <SubscriptionPaymentMethod
                subscription={subscription}
                onSubscriptionUpdated={() => refetch()}
              />
            )}
          </div>
        )}
      </div>

      <TierUpdateSidePanel />
    </>
  )
}

export default SubscriptionTier
