import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SparkBar from 'components/ui/SparkBar'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useFlag } from 'hooks/ui/useFlag'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { Alert, Button } from 'ui'
import { Admonition } from 'ui-patterns'
import ProjectUpdateDisabledTooltip from '../ProjectUpdateDisabledTooltip'
import { Restriction } from '../Restriction'
import PlanUpdateSidePanel from './PlanUpdateSidePanel'

const Subscription = () => {
  const { slug } = useParams()
  const snap = useOrgSettingsPageStateSnapshot()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const canReadSubscriptions = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  const {
    data: subscription,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgSubscriptionQuery({ orgSlug: slug }, { enabled: canReadSubscriptions })

  const currentPlan = subscription?.plan
  const planName = currentPlan?.name ?? 'Unknown'
  const billingCycleStart = dayjs.unix(subscription?.current_period_start ?? 0).utc()
  const billingCycleEnd = dayjs.unix(subscription?.current_period_end ?? 0).utc()
  const daysToCycleEnd = billingCycleEnd.diff(dayjs(), 'days')
  const daysWithinCycle = billingCycleEnd.diff(billingCycleStart, 'days')

  const canChangeTier = !projectUpdateDisabled && !['enterprise'].includes(currentPlan?.id ?? '')

  return (
    <>
      <ScaffoldSection>
        <div className="col-span-12 pb-2">
          <Restriction />
        </div>
        <ScaffoldSectionDetail>
          <div className="sticky space-y-6 top-12">
            <p className="text-foreground text-base m-0">Subscription Plan</p>
            <div className="space-y-2">
              <p className="text-sm text-foreground-light m-0">More information</p>
              <div>
                <Link href="https://supabase.com/pricing" target="_blank" rel="noreferrer">
                  <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                    <p className="text-sm m-0">Pricing</p>
                    <ExternalLink size={16} strokeWidth={1.5} />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {!canReadSubscriptions ? (
            <NoPermission resourceText="view this organization's subscription" />
          ) : (
            <>
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
                    <p className="text-2xl text-brand uppercase">
                      {currentPlan?.name ?? 'Unknown'}
                    </p>
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
                    {!canChangeTier &&
                      (projectUpdateDisabled ? (
                        <Alert
                          className="mt-2"
                          withIcon
                          variant="info"
                          title={`Unable to update plan from ${planName}`}
                        >
                          We have temporarily disabled project and subscription changes - our
                          engineers are working on a fix.
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
                    <Admonition
                      type="default"
                      title="This organization is limited by the included usage"
                    >
                      <div className="[&>p]:!leading-normal prose text-sm">
                        Projects may become unresponsive when this organization exceeds its{' '}
                        <Link href={`/org/${slug}/usage`}>included usage quota</Link>. To scale
                        seamlessly and pay for over-usage,{' '}
                        {currentPlan?.id === 'free'
                          ? 'upgrade to a paid plan.'
                          : 'you can disable Spend Cap under the Cost Control settings.'}
                      </div>
                      <Button
                        type="default"
                        className="mt-1"
                        onClick={() =>
                          snap.setPanelKey(
                            currentPlan?.id === 'free' ? 'subscriptionPlan' : 'costControl'
                          )
                        }
                      >
                        {currentPlan?.id === 'free' ? 'Upgrade Plan' : 'Adjust Spend Cap'}
                      </Button>
                    </Admonition>
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
            </>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
      <PlanUpdateSidePanel />
    </>
  )
}

export default Subscription
