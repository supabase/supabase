import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SparkBar from 'components/ui/SparkBar'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import dayjs from 'dayjs'
import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import { Alert, Button, IconExternalLink } from 'ui'
import TierUpdateSidePanel from './TierUpdateSidePanel'
import Link from 'next/link'
import { useFlag, useStore } from 'hooks'
import ProjectUpdateDisabledTooltip from '../../ProjectUpdateDisabledTooltip'
import SubscriptionPaymentMethod from './SubscriptionPaymentMethod'

export interface SubscriptionTierProps {}

const SubscriptionTier = ({}: SubscriptionTierProps) => {
  const { ref: projectRef } = useParams()
  const { ui } = useStore()
  const orgSlug = ui.selectedOrganization?.slug ?? ''
  const snap = useSubscriptionPageStateSnapshot()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')
  const { data: subscription, isLoading } = useProjectSubscriptionV2Query({ projectRef })

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
              To manage your billing address, emails or tax IDs, head to your{' '}
              <Link href={`/org/${orgSlug}/billing`}>
                <a rel="noreferrer">
                  <p className="text-sm text-green-900 transition hover:text-green-1000">
                    organization settings
                  </p>
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
              <p className="text-2xl text-brand-900 uppercase">{tierName}</p>
            </div>
            <div>
              <ProjectUpdateDisabledTooltip projectUpdateDisabled={projectUpdateDisabled}>
                <Button
                  type="default"
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
                  Please contact us if you'd like to change your project's plan
                </Alert>
              ))}
            {!subscription?.usage_billing_enabled && (
              <Alert withIcon variant="info" title="This project is limited by the included usage">
                <p className="text-sm text-scale-1000">
                  When this project exceeds its included usage quotas, it may become unresponsive.{' '}
                  {currentPlan?.id === 'free'
                    ? 'If you wish to exceed the included usage, you should upgrade to a paid plan.'
                    : 'You can change the Cost Control settings if you plan on exceeding the included usage quotas.'}
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

            {subscription && <SubscriptionPaymentMethod subscription={subscription} />}
          </div>
        )}
      </div>

      <TierUpdateSidePanel />
    </>
  )
}

export default SubscriptionTier
