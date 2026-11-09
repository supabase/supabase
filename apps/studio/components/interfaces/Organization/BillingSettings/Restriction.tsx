import dayjs from 'dayjs'
import { ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle, Button, CriticalIcon, WarningIcon } from 'ui'

import { PricingMetric } from '@/data/analytics/org-daily-stats-query'
import { VIOLATION_TYPE_LABELS } from '@/data/usage/constants'
import { useOrgUsageQuery } from '@/data/usage/org-usage-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { DOCS_URL } from '@/lib/constants'

export const Restriction = () => {
  const { data: org } = useSelectedOrganizationQuery()
  const { data: usage, isSuccess: isSuccessOrgUsage } = useOrgUsageQuery({ orgSlug: org?.slug })

  const pathname = usePathname()
  const isUsagePage = pathname?.endsWith('/usage')

  const hasExceededAnyLimits = Boolean(
    usage?.usages.find(
      (metric) =>
        metric.metric !== PricingMetric.DISK_SIZE_GB_HOURS_GP3 &&
        // Log metrics should not trigger the exceeded limits alert for now (soft rollout)
        metric.metric !== PricingMetric.LOG_INGESTION &&
        metric.metric !== PricingMetric.LOG_QUERYING &&
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
        <Alert variant="destructive">
          <CriticalIcon />

          <AlertTitle>Your organization's usage has exceeded its included quota</AlertTitle>
          <AlertDescription>
            <p>
              Your projects can become unresponsive or enter read-only mode.{' '}
              {org.plan.id === 'free' ? (
                <span>
                  Please upgrade to the Pro Plan to ensure that your projects remain available.
                </span>
              ) : (
                <span>Please disable spend cap to ensure that your projects remain available.</span>
              )}
            </p>
            <div className="flex items-center gap-x-2 mt-3">
              <Button key="upgrade-button" asChild>
                <Link
                  href={`/org/${org?.slug}/billing?panel=${
                    org.plan.id === 'free' ? 'subscriptionPlan' : 'costControl'
                  }`}
                >
                  {org.plan.id === 'free' ? 'Upgrade plan' : 'Change spend cap'}
                </Link>
              </Button>
              {!isUsagePage && (
                <Button key="view-usage-button" asChild>
                  <Link href={`/org/${org?.slug}/usage`}>View usage</Link>
                </Button>
              )}
              <Button asChild icon={<ExternalLinkIcon />}>
                <a href={`${DOCS_URL}/guides/platform/cost-control#spend-cap`}>About spend cap</a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {shownAlert === 'gracePeriod' && (
        <Alert variant="warning">
          <WarningIcon />
          <AlertTitle>Your grace period has started.</AlertTitle>
          <AlertDescription>
            <p className="leading-tight">
              Your organization went over its quota in the previous billing cycle
              {violationLabels && <span>{` ${violationLabels}`}</span>}
              <span>
                . You can continue with your projects until your grace period ends on
              </span>{' '}
              <span className="text-foreground">
                {dayjs(org.restriction_data['grace_period_end']).format('DD MMM, YYYY')}
              </span>
              <span>
                . After that, the Fair Use Policy will apply. If you plan to maintain this level of
                usage,
              </span>{' '}
              {org.plan.id === 'free' ? (
                <span>upgrade your plan</span>
              ) : (
                <span>disable spend cap</span>
              )}{' '}
              <span>
                to avoid any restrictions. If restrictions are applied, requests to your projects
                will return a 402 status code.
              </span>
            </p>
            <div className="flex items-center gap-x-2 mt-3">
              <Button asChild key="upgrade-button">
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
                <Button key="view-usage-button" asChild>
                  <Link href={`/org/${org?.slug}/usage`}>View usage</Link>
                </Button>
              )}

              <Button asChild icon={<ExternalLinkIcon />}>
                <a href={`${DOCS_URL}/guides/platform/billing-faq#fair-use-policy`}>
                  About Fair Use Policy
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {shownAlert === 'gracePeriodOver' && (
        <Alert variant="warning">
          <WarningIcon />
          <AlertTitle>Your grace period is over.</AlertTitle>
          <AlertDescription>
            <p>
              Your grace period ended on{' '}
              <span className="text-foreground">
                {dayjs(org.restriction_data['grace_period_end']).format('DD MMM, YYYY')}
              </span>
              . Fair Use Policy applies now. If your organization is over its quota, your projects
              can be restricted and requests will respond with a 402 status code.{' '}
              {org.plan.id === 'free' ? (
                <span>Upgrade your plan</span>
              ) : (
                <span>Disable spend cap</span>
              )}{' '}
              <span>if you expect to exceed your plan's quota.</span>
            </p>
            <div className="flex items-center gap-x-2 mt-3">
              <Button key="upgrade-button" asChild>
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
                <Button key="view-usage-button" asChild>
                  <Link href={`/org/${org?.slug}/usage`}>View usage</Link>
                </Button>
              )}
              <Button asChild icon={<ExternalLinkIcon />}>
                <a href={`${DOCS_URL}/guides/platform/billing-faq#fair-use-policy`}>
                  About Fair Use Policy
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {shownAlert === 'restricted' && (
        <Alert variant="destructive">
          <CriticalIcon />
          <AlertTitle>All services are restricted.</AlertTitle>
          <AlertDescription>
            <p>
              Fair Use Policy applies and your service is restricted. Your projects are not able to
              serve requests and will respond with a 402 status code. You have exceeded your plan's
              quota{violationLabels && <span>{` ${violationLabels}`}</span>}
              <span>.</span>{' '}
              {org.plan.id === 'free' ? (
                <span>Upgrade your plan</span>
              ) : (
                <span>Disable spend cap</span>
              )}{' '}
              <span>
                to lift restrictions immediately, or wait until the start of your next billing
                period. Note that there may be a short delay after your billing period resets before
                restrictions are fully lifted.
              </span>
            </p>
            <div className="flex items-center gap-x-2 mt-3">
              <Button key="upgrade-button" asChild>
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
                <Button key="view-usage-button" asChild>
                  <Link href={`/org/${org?.slug}/usage`}>View usage</Link>
                </Button>
              )}
              <Button asChild icon={<ExternalLinkIcon />}>
                <a href={`${DOCS_URL}/guides/platform/billing-faq#fair-use-policy`}>
                  About Fair Use Policy
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
