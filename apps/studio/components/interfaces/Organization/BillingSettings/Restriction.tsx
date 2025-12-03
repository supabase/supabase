import dayjs from 'dayjs'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { PricingMetric } from 'data/analytics/org-daily-stats-query'
import { VIOLATION_TYPE_LABELS } from 'data/usage/constants'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { DOCS_URL } from 'lib/constants'
import { usePathname } from 'next/navigation'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CriticalIcon,
  WarningIcon,
} from 'ui'

export const Restriction = () => {
  const { data: org } = useSelectedOrganizationQuery()
  const { data: usage, isSuccess: isSuccessOrgUsage } = useOrgUsageQuery({ orgSlug: org?.slug })

  const pathname = usePathname()
  const isUsagePage = pathname?.endsWith('/usage')

  const hasExceededAnyLimits = Boolean(
    usage?.usages.find(
      (metric) =>
        metric.metric !== PricingMetric.DISK_SIZE_GB_HOURS_GP3 &&
        !metric.unlimited &&
        metric.capped &&
        metric.usage > (metric?.pricing_free_units ?? 0)
    )
  )

  // don't show any alerts until everything has been fetched
  if (!isSuccessOrgUsage || !org) {
    return null
  }

  let shownAlert: 'exceededLimits' | 'gracePeriod' | 'gracePeriodOver' | 'restricted' | null = null

  if (hasExceededAnyLimits && !org?.restriction_status) {
    shownAlert = 'exceededLimits'
  } else if (org?.restriction_status === 'grace_period') {
    shownAlert = 'gracePeriod'
  } else if (org?.restriction_status === 'grace_period_over') {
    shownAlert = 'gracePeriodOver'
  } else if (org?.restriction_status === 'restricted') {
    shownAlert = 'restricted'
  }

  if (shownAlert === null || !org?.restriction_data) {
    return null
  }

  const violationLabels =
    Array.isArray(org.restriction_data['violations']) &&
    org.restriction_data['violations'].length > 0
      ? `(${org.restriction_data['violations']
          .map((violation: string) => VIOLATION_TYPE_LABELS[violation] || violation)
          .join(', ')})`
      : ''

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
              {org.plan.id === 'free'
                ? 'Please upgrade to the Pro Plan to ensure that your projects remain available.'
                : 'Please disable spend cap to ensure that your projects remain available.'}
            </p>
            <div className="flex items-center gap-x-2 mt-3">
              <Button key="upgrade-button" asChild type="default">
                <Link
                  href={`/org/${org?.slug}/billing?panel=${
                    org.plan.id === 'free' ? 'subscriptionPlan' : 'costControl'
                  }`}
                >
                  {org.plan.id === 'free' ? 'Upgrade plan' : 'Change spend cap'}
                </Link>
              </Button>
              {!isUsagePage && (
                <Button key="view-usage-button" asChild type="default">
                  <Link href={`/org/${org?.slug}/usage`}>View usage</Link>
                </Button>
              )}
              <Button asChild type="default" icon={<ExternalLink />}>
                <a href={`${DOCS_URL}/guides/platform/cost-control#spend-cap`}>About spend cap</a>
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
              Your organization is over its quota
              {violationLabels && ` ${violationLabels}`}. You can continue with your projects until
              your grace period ends on{' '}
              <span className="text-foreground">
                {dayjs(org.restriction_data['grace_period_end']).format('DD MMM, YYYY')}
              </span>
              . After that, the Fair Use Policy will apply. If you plan to maintain this level of
              usage, {org.plan.id === 'free' ? 'upgrade your plan' : 'disable spend cap'} to avoid
              any restrictions. If restrictions are applied, requests to your projects will return a
              402 status code.
            </p>
            <div className="flex items-center gap-x-2 mt-3">
              <Button asChild key="upgrade-button" type="default">
                <Link
                  href={`/org/${org?.slug}/billing?panel=${
                    org.plan.id === 'free'
                      ? 'subscriptionPlan&source=fairUseGracePeriodStarted'
                      : 'costControl&source=fairUseGracePeriodStarted'
                  }`}
                >
                  {org.plan.id === 'free' ? 'Upgrade plan' : 'Disable spend cap'}
                </Link>
              </Button>

              {!isUsagePage && (
                <Button key="view-usage-button" asChild type="default">
                  <Link href={`/org/${org?.slug}/usage`}>View usage</Link>
                </Button>
              )}

              <Button asChild type="default" icon={<ExternalLink />}>
                <a href={`${DOCS_URL}/guides/platform/billing-faq#fair-use-policy`}>
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
              . Fair Use Policy applies now. Stay below your plan’s quota or{' '}
              {org.plan.id === 'free' ? 'upgrade your plan' : 'disable spend cap'} if you expect to
              exceed it. If you exceed your quota, requests will respond with a 402 status code.
            </p>
            <div className="flex items-center gap-x-2 mt-3">
              <Button key="upgrade-button" asChild type="default">
                <Link
                  href={`/org/${org?.slug}/billing?panel=${
                    org.plan.id === 'free'
                      ? 'subscriptionPlan&source=fairUseGracePeriodOver'
                      : 'costControl&source=fairUseGracePeriodOver'
                  }`}
                >
                  {org.plan.id === 'free' ? 'Upgrade plan' : 'Disable spend cap'}
                </Link>
              </Button>
              {!isUsagePage && (
                <Button key="view-usage-button" asChild type="default">
                  <Link href={`/org/${org?.slug}/usage`}>View usage</Link>
                </Button>
              )}
              <Button asChild type="default" icon={<ExternalLink />}>
                <a href={`${DOCS_URL}/guides/platform/billing-faq#fair-use-policy`}>
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
              quota{violationLabels && ` ${violationLabels}`}.{' '}
              {org.plan.id === 'free' ? 'Upgrade your plan' : 'Disable spend cap'} to lift
              restrictions or wait until your quota refills on your next billing period.
            </p>
            <div className="flex items-center gap-x-2 mt-3">
              <Button key="upgrade-button" asChild type="default">
                <Link
                  href={`/org/${org?.slug}/billing?panel=${
                    org.plan.id === 'free'
                      ? 'subscriptionPlan&source=fairUseRestricted'
                      : 'costControl&source=fairUseRestricted'
                  }`}
                >
                  {org.plan.id === 'free' ? 'Upgrade plan' : 'Disable spend cap'}
                </Link>
              </Button>
              {!isUsagePage && (
                <Button key="view-usage-button" asChild type="default">
                  <Link href={`/org/${org?.slug}/usage`}>View usage</Link>
                </Button>
              )}
              <Button asChild type="default" icon={<ExternalLink />}>
                <a href={`${DOCS_URL}/guides/platform/billing-faq#fair-use-policy`}>
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
