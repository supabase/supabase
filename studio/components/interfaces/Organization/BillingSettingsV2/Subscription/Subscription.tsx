import dayjs from 'dayjs'
import Link from 'next/link'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms'
import SparkBar from 'components/ui/SparkBar'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useFlag } from 'hooks'
import { Alert, Button, IconExternalLink } from 'ui'
import ProjectUpdateDisabledTooltip from '../../BillingSettings/ProjectUpdateDisabledTooltip'

const Subscription = () => {
  const { slug } = useParams()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const {
    data: subscription,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgSubscriptionQuery({ orgSlug: slug })

  const currentPlan = subscription?.plan
  const planName = currentPlan?.name ?? 'Unknown'
  const billingCycleStart = dayjs.unix(subscription?.current_period_start ?? 0).utc()
  const billingCycleEnd = dayjs.unix(subscription?.current_period_end ?? 0).utc()
  const daysToCycleEnd = billingCycleEnd.diff(dayjs(), 'days')
  const daysWithinCycle = billingCycleEnd.diff(billingCycleStart, 'days')

  const canChangeTier =
    !projectUpdateDisabled && !['team', 'enterprise'].includes(currentPlan?.id ?? '')

  return (
    <FormSection
      id="plan"
      header={
        <FormSectionLabel>
          <div className="sticky space-y-6 top-16">
            <p className="text-base">Subscription Plan</p>
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
        </FormSectionLabel>
      }
    >
      <FormSectionContent loading={isLoading}>
        {isError && <AlertError subject="Failed to retrieve subscription" error={error} />}

        {isSuccess && (
          <div className="space-y-6">
            <div>
              <p className="text-sm">This organization is currently on the plan:</p>
              <p className="text-2xl text-brand-900 uppercase">{currentPlan?.name ?? 'Unknown'}</p>
            </div>

            <div>
              <ProjectUpdateDisabledTooltip projectUpdateDisabled={projectUpdateDisabled}>
                <Button
                  type="default"
                  disabled={!canChangeTier}
                  onClick={() => {}} // [JOSHEN TODO: Implement]
                >
                  Change subscription plan
                </Button>
              </ProjectUpdateDisabledTooltip>
              {!canChangeTier &&
                (projectUpdateDisabled ? (
                  <Alert withIcon variant="info" title={`Unable to update plan from ${planName}`}>
                    We have temporarily disabled project and subscription changes - our engineers
                    are working on a fix.
                  </Alert>
                ) : (
                  <Alert
                    withIcon
                    variant="info"
                    title={`Unable to update plan from ${planName}`}
                    actions={[
                      <div key="contact-support">
                        <Link
                          href={`/support/new?category=sales&subject=Change%20plan%20away%20from%20${planName}`}
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
            </div>

            {!subscription?.usage_billing_enabled && (
              <Alert
                withIcon
                variant="info"
                title="This organization is limited by the included usage"
                actions={
                  currentPlan?.id === 'free' ? (
                    // [Joshen TODO]: Implement
                    <Button type="default" onClick={() => {}}>
                      Upgrade Plan
                    </Button>
                  ) : (
                    // [Joshen TODO]: Implement
                    <Button type="default" onClick={() => {}}>
                      Adjust Spend Cap
                    </Button>
                  )
                }
              >
                <p className="text-sm text-scale-1000">
                  When this organization exceeds its{' '}
                  <Link href="#breakdown">
                    <a className="text-sm text-green-900 transition hover:text-green-1000">
                      included usage quotas
                    </a>
                  </Link>
                  , its projects may become unresponsive.{' '}
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
          </div>
        )}
      </FormSectionContent>
    </FormSection>
  )
}

export default Subscription
