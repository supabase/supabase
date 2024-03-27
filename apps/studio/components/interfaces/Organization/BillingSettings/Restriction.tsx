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

  if (!isSuccessOrgUsage || !isSuccessSubscription) {
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
    <div className="pt-4">
      {shownAlert === 'exceededLimits' && (
        <Alert_Shadcn_ variant="destructive">
          <AlertCircle strokeWidth={2} />
          <AlertTitle_Shadcn_>
            Your organization's usage has exceeded its included quota
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            Your projects can become unresponsive or enter read-only mode.{' '}
            {subscription.plan.id === 'free'
              ? 'Please upgrade to the Pro plan to ensure that your projects remain available.'
              : 'Please disable spend cap to ensure that your projects remain available.'}
            <Button key="upgrade-button" asChild type="default" className="ml-8">
              <Link
                href={`/org/${org?.slug}/billing?panel=${
                  subscription.plan.id === 'free' ? 'subscriptionPlan' : 'costControl'
                }`}
              >
                {subscription.plan.id === 'free' ? 'Upgrade plan' : 'Change spend cap'}
              </Link>
            </Button>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
      {shownAlert === 'gracePeriod' && (
        <Alert_Shadcn_ variant="warning">
          <AlertTriangle strokeWidth={2} />
          <AlertTitle_Shadcn_>The quota has been surpassed</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              Your organization has surpassed its plan’s quota. Service restrictions will apply if
              your usage is above your quota after your grace period. If Service Restrictions are
              active, your projects will no longer be able to serve requests.
            </p>
            <p>
              Your grace period ends on{' '}
              {dayjs(org.restriction_data['grace_period_end']).format('DD MMM YYYY')}.
            </p>
            <p>
              Reduce your usage below your plan’s quota or{' '}
              <a
                className="cursor-pointer underline"
                onClick={(e) => {
                  e.preventDefault()
                  snap.setPanelKey('subscriptionPlan')
                }}
              >
                upgrade your plan
              </a>
              .{/* [Learn More Button] (links to future doc page) */}
            </p>
            <p>
              Please refer to our documentation to{' '}
              <a className="cursor-pointer underline">learn more about restrictions</a>.
            </p>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
      {shownAlert === 'gracePeriodOver' && (
        <Alert_Shadcn_ variant="warning">
          <AlertTriangle strokeWidth={2} />
          <AlertTitle_Shadcn_>
            The quota has been surpassed and grace period is over
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              You have exceeded your plan’s quota in the past and your grace period ended on{' '}
              {dayjs(org.restriction_data['grace_period_end']).format('DD MMM YYYY')}. Service
              restrictions will apply if your usage is above your quota.
            </p>
            <p>
              If Service Restrictions are active, your projects will no longer be able to serve
              requests.
            </p>
            <p>
              Reduce your usage below your plan’s quota{' '}
              <a
                className="cursor-pointer underline"
                onClick={(e) => {
                  e.preventDefault()
                  snap.setPanelKey('subscriptionPlan')
                }}
              >
                upgrade your plan
              </a>
              .
            </p>
            <p>
              Please refer to our documentation to{' '}
              <a className="cursor-pointer underline">learn more about restrictions</a>.
            </p>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
      {shownAlert === 'restricted' && (
        <Alert_Shadcn_ variant="destructive">
          <AlertCircle strokeWidth={2} />
          <AlertTitle_Shadcn_>All services are restricted</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              Your services are currently restricted. Your projects are not able to serve requests.
            </p>
            <p>
              You have exceeded your plan’s quota and your grace period ended on{' '}
              {dayjs(org.restriction_data['grace_period_end']).format('DD MMM YYYY')}.
            </p>
            <p>
              <a
                className="cursor-pointer underline"
                onClick={(e) => {
                  e.preventDefault()
                  snap.setPanelKey('subscriptionPlan')
                }}
              >
                Upgrade
              </a>{' '}
              to lift restrictions or wait until your quota refills.
            </p>
            <p>
              Please refer to our documentation to{' '}
              <a className="cursor-pointer underline">learn more about restrictions</a>.
            </p>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
    </div>
  )
}
