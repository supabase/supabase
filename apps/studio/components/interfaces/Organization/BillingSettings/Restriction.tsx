import dayjs from 'dayjs'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { CriticalIcon, WarningIcon } from 'ui'

export const Restriction = () => {
  const org = useSelectedOrganization()
  const { data: usage, isSuccess: isSuccessOrgUsage } = useOrgUsageQuery({ orgSlug: org?.slug })
  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery({
    orgSlug: org?.slug,
  })

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
          <CriticalIcon />

          <AlertTitle_Shadcn_>
            Your organization's usage has exceeded its included quota
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              Your projects can become unresponsive or enter read-only mode.{' '}
              {subscription.plan.id === 'free'
                ? 'Please upgrade to the Pro Plan to ensure that your projects remain available.'
                : 'Please disable spend cap to ensure that your projects remain available.'}
            </p>
            <div className="flex items-center gap-x-2 mt-3">
              <Button key="upgrade-button" asChild type="default">
                <Link
                  href={`/org/${org?.slug}/billing?panel=${
                    subscription.plan.id === 'free' ? 'subscriptionPlan' : 'costControl'
                  }`}
                >
                  {subscription.plan.id === 'free' ? 'Upgrade plan' : 'Change spend cap'}
                </Link>
              </Button>
              <Button asChild type="default" icon={<ExternalLink />}>
                <a href="https://supabase.com/docs/guides/platform/spend-cap">About spend cap</a>
              </Button>
            </div>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
      {shownAlert === 'gracePeriod' && (
        <Alert_Shadcn_ variant="warning">
          <WarningIcon />
          <AlertTitle_Shadcn_>Your grace period has started.</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p className="leading-tight">
              Your organization is over its quota. You can continue with your projects until your
              grace period ends on{' '}
              <span className="text-foreground">
                {dayjs(org.restriction_data['grace_period_end']).format('DD MMM, YYYY')}
              </span>
              . After that, the Fair Use Policy will apply. If you plan to maintain this level of
              usage, upgrade your plan to avoid any restrictions. If restrictions are applied,
              requests to your projects will return a 402 status code.
            </p>
            <div className="flex items-center gap-x-2 mt-3">
              <Button asChild key="upgrade-button" type="default">
                <Link href={`/org/${org?.slug}/billing?panel=subscriptionPlan`}>Upgrade plan</Link>
              </Button>
              <Button asChild type="default" icon={<ExternalLink />}>
                <a href="https://supabase.com/docs/guides/platform/billing-faq#fair-use-policy">
                  About Fair Use Policy
                </a>
              </Button>
            </div>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
      {shownAlert === 'gracePeriodOver' && (
        <Alert_Shadcn_ variant="warning">
          <WarningIcon />
          <AlertTitle_Shadcn_>Your grace period is over.</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              Your grace period ended on{' '}
              <span className="text-foreground">
                {dayjs(org.restriction_data['grace_period_end']).format('DD MMM, YYYY')}
              </span>
              . Fair Use Policy applies now. Stay below your plan’s quota or upgrade your plan if
              you expect to exceed it. If you exceed your quota, requests will respond with a 402
              status code.
            </p>
            <div className="flex items-center gap-x-2 mt-3">
              <Button key="upgrade-button" asChild type="default">
                <Link href={`/org/${org?.slug}/billing?panel=subscriptionPlan`}>Upgrade plan</Link>
              </Button>
              <Button asChild type="default" icon={<ExternalLink />}>
                <a href="https://supabase.com/docs/guides/platform/billing-faq#fair-use-policy">
                  About Fair Use Policy
                </a>
              </Button>
            </div>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
      {shownAlert === 'restricted' && (
        <Alert_Shadcn_ variant="destructive">
          <CriticalIcon />
          <AlertTitle_Shadcn_>All services are restricted.</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              Fair Use Policy applies and your service is restricted. Your projects are not able to
              serve requests and will respond with a 402 status code. You have exceeded your plan’s
              quota and your grace period ended on{' '}
              <span className="text-foreground">
                {dayjs(org.restriction_data['grace_period_end']).format('DD MMM, YYYY')}
              </span>
              . Upgrade to lift restrictions or wait until your quota refills.
            </p>
            <div className="flex items-center gap-x-2 mt-3">
              <Button key="upgrade-button" asChild type="default">
                <Link href={`/org/${org?.slug}/billing?panel=subscriptionPlan`}>Upgrade plan</Link>
              </Button>
              <Button asChild type="default" icon={<ExternalLink />}>
                <a href="https://supabase.com/docs/guides/platform/billing-faq#fair-use-policy">
                  About Fair Use Policy
                </a>
              </Button>
            </div>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
    </>
  )
}
