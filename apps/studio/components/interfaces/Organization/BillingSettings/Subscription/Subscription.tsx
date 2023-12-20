import dayjs from 'dayjs'
import Link from 'next/link'

import { useParams } from 'common'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SparkBar from 'components/ui/SparkBar'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useFlag } from 'hooks'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconCalendar,
  IconExternalLink,
} from 'ui'
import ProjectUpdateDisabledTooltip from '../ProjectUpdateDisabledTooltip'
import PlanUpdateSidePanel from './PlanUpdateSidePanel'
import { useOrganizationBillingSubscriptionCancelSchedule } from 'data/subscriptions/org-subscription-cancel-schedule-mutation'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'

const Subscription = () => {
  const { slug } = useParams()
  const snap = useOrgSettingsPageStateSnapshot()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const {
    data: subscription,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgSubscriptionQuery({ orgSlug: slug })

  const { data: usage } = useOrgUsageQuery({ orgSlug: slug })

  const { mutate: cancelSubscriptionSchedule, isLoading: cancelSubscriptionScheduleLoading } =
    useOrganizationBillingSubscriptionCancelSchedule()

  const currentPlan = subscription?.plan
  const planName = currentPlan?.name ?? 'Unknown'
  const billingCycleStart = dayjs.unix(subscription?.current_period_start ?? 0).utc()
  const billingCycleEnd = dayjs.unix(subscription?.current_period_end ?? 0).utc()
  const daysToCycleEnd = billingCycleEnd.diff(dayjs(), 'days')
  const daysWithinCycle = billingCycleEnd.diff(billingCycleStart, 'days')

  const canChangeTier = !projectUpdateDisabled && !['enterprise'].includes(currentPlan?.id ?? '')

  const hasExceededAnyLimits = Boolean(
    usage?.usages.find(
      (metric) =>
        !metric.unlimited && metric.capped && metric.usage > (metric?.pricing_free_units ?? 0)
    )
  )

  return (
    <>
      {subscription && hasExceededAnyLimits && (
        <div className="mt-5">
          <Alert
            withIcon
            variant="danger"
            title="Your organization's usage has exceeded its included quota"
            actions={[
              <div key="upgrade-buttons" className="space-x-3">
                <Button asChild type="outline">
                  <Link href={`/org/${slug}/usage`}>View usage</Link>
                </Button>

                <Button asChild type="default">
                  <Link
                    href={`/org/${slug}/billing?panel=${
                      subscription.plan.id === 'free' ? 'subscriptionPlan' : 'costControl'
                    }`}
                  >
                    {subscription.plan.id === 'free' ? 'Upgrade plan' : 'Change spend cap'}
                  </Link>
                </Button>
              </div>,
            ]}
          >
            <p>
              Your projects can become unresponsive or enter read-only mode.{' '}
              {subscription.plan.id === 'free'
                ? 'Please upgrade to the Pro plan to ensure that your projects remain available.'
                : 'Please disable Spend Cap to ensure that your projects remain available.'}
            </p>
          </Alert>
        </div>
      )}

      <ScaffoldSection>
        <ScaffoldSectionDetail>
          <div className="sticky space-y-6 top-12">
            <p className="text-base m-0">Subscription Plan</p>
            <div className="space-y-2">
              <p className="text-sm text-foreground-light m-0">More information</p>
              <div>
                <Link href="https://supabase.com/pricing" target="_blank" rel="noreferrer">
                  <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                    <p className="text-sm m-0">Pricing</p>
                    <IconExternalLink size={16} strokeWidth={1.5} />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {isLoading && (
            <div className="space-y-2">
              <ShimmeringLoader />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          )}

          {isError && <AlertError subject="Failed to retrieve subscription" error={error} />}

          {isSuccess && (
            <div className="space-y-6">
              <div>
                <p className="text-sm">This organization is currently on the plan:</p>
                <p className="text-2xl text-brand uppercase">{currentPlan?.name ?? 'Unknown'}</p>
              </div>

              {subscription?.scheduled_plan_change &&
                subscription?.scheduled_plan_change?.target_plan !== subscription.plan.id && (
                  <Alert_Shadcn_ className="mb-2" title="Scheduled downgrade">
                    <IconCalendar className="h-4 w-4" />
                    <AlertTitle_Shadcn_>Scheduled downgrade</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                      <div>
                        Your organization will automatically be downgraded from the{' '}
                        <span>{subscription.plan.name}</span> plan to the{' '}
                        <span className="capitalize">
                          {subscription?.scheduled_plan_change?.target_plan}
                        </span>{' '}
                        plan on{' '}
                        {dayjs(subscription?.scheduled_plan_change?.at).format('MMMM D, YYYY')}. If
                        you would like to stay on the <span>{subscription.plan.name}</span> plan,
                        cancel the scheduled downgrade.
                      </div>
                      <div>
                        <Button
                          type="default"
                          loading={cancelSubscriptionScheduleLoading}
                          onClick={() => {
                            return cancelSubscriptionSchedule({ slug: slug! })
                          }}
                        >
                          Cancel downgrade
                        </Button>
                      </div>
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}

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
                {!canChangeTier &&
                  (projectUpdateDisabled ? (
                    <Alert
                      className="mt-2"
                      withIcon
                      variant="info"
                      title={`Unable to update plan from ${planName}`}
                    >
                      We have temporarily disabled project and subscription changes - our engineers
                      are working on a fix.
                    </Alert>
                  ) : (
                    <Alert
                      withIcon
                      className="mt-2"
                      variant="info"
                      title={`Unable to update plan from ${planName}`}
                      actions={[
                        <div key="contact-support">
                          <Button asChild type="default">
                            <Link
                              href={`/support/new?category=sales&subject=Change%20plan%20away%20from%20${planName}`}
                            >
                              Contact support
                            </Link>
                          </Button>
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
                  <div className="text-sm text-foreground-light mr-2">
                    When this organization exceeds its{' '}
                    <Link
                      href={`/org/${slug}/usage`}
                      className="text-sm text-green-900 transition hover:text-green-1000"
                    >
                      included usage quotas
                    </Link>
                    , its projects may become unresponsive.{' '}
                    {currentPlan?.id === 'free' ? (
                      <p className="pr-4 mt-1">
                        If you wish to exceed the included usage, you should upgrade to a paid plan.
                      </p>
                    ) : (
                      <p className="pr-4 mt-1">
                        You currently have Spend Cap enabled - when you exceed your plan's limit,
                        you will experience restrictions. To scale seamlessly and pay for
                        over-usage, you can adjust your Cost Control settings.
                      </p>
                    )}
                  </div>
                </Alert>
              )}

              <SparkBar
                type="horizontal"
                value={daysWithinCycle - daysToCycleEnd}
                max={daysWithinCycle}
                barClass="bg-foreground"
                labelBottom={`Current billing cycle (${billingCycleStart.format(
                  'MMM DD'
                )} - ${billingCycleEnd.format('MMM DD')})`}
                bgClass="bg-surface-300"
                labelBottomClass="!text-foreground-light pb-1"
                labelTop={`${daysToCycleEnd} days remaining`}
              />
            </div>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
      <PlanUpdateSidePanel />
    </>
  )
}

export default Subscription
