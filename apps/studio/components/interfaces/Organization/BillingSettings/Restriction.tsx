import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import dayjs from 'dayjs'
import { useSelectedOrganization } from 'hooks'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'

export const Restriction = () => {
  const org = useSelectedOrganization()
  const { data: usage, isSuccess: isSuccessOrgUsage } = useOrgUsageQuery({ orgSlug: org?.slug })
  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery({
    orgSlug: org?.slug,
  })
  const snap = useOrgSettingsPageStateSnapshot()

  const hasExceededAnyLimits = Boolean(
    usage?.usages.find(
      (metric) =>
        !metric.unlimited && metric.capped && metric.usage > (metric?.pricing_free_units ?? 0)
    )
  )

  // don't show any alerts until everything has been fetched
  if (!isSuccessOrgUsage || !isSuccessSubscription || !org) {
    return null
  }

  let shownAlert: 'exceededLimits' | 'gracePeriod' | 'gracePeriodOver' | 'restricted' | null = null

  if (subscription && hasExceededAnyLimits && !org?.restriction_status) {
    shownAlert = 'exceededLimits'
  } else if (org?.restriction_status === 'grace_period') {
    shownAlert = 'gracePeriod'
  } else if (org?.restriction_status === 'grace_period_over') {
    shownAlert = 'gracePeriodOver'
  } else if (org?.restriction_status === 'restricted') {
    shownAlert = 'restricted'
  }

  if (shownAlert === null) {
    return null
  }

  return (
    <>
      {shownAlert === 'exceededLimits' && (
        <Alert_Shadcn_ variant="destructive">
          <AlertCircle strokeWidth={2} />
          <div className="flex flex-row items-center justify-between">
            <div>
              <AlertTitle_Shadcn_>
                Your organization's usage has exceeded its included quota
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                Your projects can become unresponsive or enter read-only mode.{' '}
                {subscription.plan.id === 'free'
                  ? 'Please upgrade to the Pro plan to ensure that your projects remain available.'
                  : 'Please disable spend cap to ensure that your projects remain available.'}
              </AlertDescription_Shadcn_>
            </div>
            <Button key="upgrade-button" asChild type="default">
              <Link
                href={`/org/${org?.slug}/billing?panel=${
                  subscription.plan.id === 'free' ? 'subscriptionPlan' : 'costControl'
                }`}
              >
                {subscription.plan.id === 'free' ? 'Upgrade plan' : 'Change spend cap'}
              </Link>
            </Button>
          </div>
        </Alert_Shadcn_>
      )}
      {shownAlert === 'gracePeriod' && (
        <Alert_Shadcn_ variant="warning">
          <AlertTriangle strokeWidth={2} />
          <div className="flex flex-row items-center justify-between gap-3">
            <div>
              <AlertTitle_Shadcn_>Your grace period has started.</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                <p>
                  Your organization is over its quota. You can continue with projects until your
                  grace period ends on{' '}
                  {dayjs(org.restriction_data['grace_period_end']).format('DD MMM, YYYY')}. After
                  that, requests that go over your quota will no longer be served.
                </p>
                <p>
                  Lower your usage or upgrade your plan. For details on service restrictions, check{' '}
                  <a className="cursor-pointer underline">our documentation</a>.
                </p>
              </AlertDescription_Shadcn_>
            </div>
            <Button key="upgrade-button" asChild type="default">
              <Link href={`/org/${org?.slug}/billing?panel=subscriptionPlan`}>Upgrade plan</Link>
            </Button>
          </div>
        </Alert_Shadcn_>
      )}
      {shownAlert === 'gracePeriodOver' && (
        <Alert_Shadcn_ variant="warning">
          <AlertTriangle strokeWidth={2} />
          <div className="flex flex-row items-center justify-between gap-3">
            <div>
              <AlertTitle_Shadcn_>Your grace period is over.</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                <p>
                  You have exceeded your plan’s quota in the past and your grace period ended on{' '}
                  {dayjs(org.restriction_data['grace_period_end']).format('DD MMM, YYYY')}. Service
                  restrictions will apply if your usage is above your quota. If service restrictions
                  are active, your projects will no longer be able to serve requests.
                </p>
                <p>
                  Stay below your plan’s quota upgrade your plan. For details on service
                  restrictions, check <a className="cursor-pointer underline">our documentation</a>.
                </p>
              </AlertDescription_Shadcn_>
            </div>
            <Button key="upgrade-button" asChild type="default">
              <Link href={`/org/${org?.slug}/billing?panel=subscriptionPlan`}>Upgrade plan</Link>
            </Button>
          </div>
        </Alert_Shadcn_>
      )}
      {shownAlert === 'restricted' && (
        <Alert_Shadcn_ variant="destructive">
          <AlertCircle strokeWidth={2} />
          <div className="flex flex-row items-center justify-between gap-3">
            <div>
              <AlertTitle_Shadcn_>All services are restricted.</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                <p>
                  Your projects are not able to serve requests to{' '}
                  <a className="cursor-pointer underline">service restrictions</a>. You have
                  exceeded your plan’s quota and your grace period ended on{' '}
                  {/* there's a non-breaking space between each date segment so that the dates are always in the same line */}
                  {dayjs(org.restriction_data['grace_period_end']).format('DD MMM, YYYY')}.
                </p>
                <p>Upgrade to lift restrictions or wait until your quota refills.</p>
              </AlertDescription_Shadcn_>
            </div>
            <Button key="upgrade-button" asChild type="default">
              <Link href={`/org/${org?.slug}/billing?panel=subscriptionPlan`}>Upgrade plan</Link>
            </Button>
          </div>
        </Alert_Shadcn_>
      )}
    </>
  )
}
