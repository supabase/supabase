import type { ReactNode } from 'react'

import { useIsFeatureEnabled } from './useIsFeatureEnabled'
import { RESTRICTION_MESSAGES } from '@/components/interfaces/Organization/restriction.constants'
import { PricingMetric } from '@/data/analytics/org-daily-stats-query'
import { useOverdueInvoicesQuery } from '@/data/invoices/invoices-overdue-query'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useOrgUsageQuery } from '@/data/usage/org-usage-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export type WarningBannerProps = {
  variant: 'danger' | 'warning' | 'note'
  title: string
  description: ReactNode
}

/**
 * Logs metrics that are subject to fair-use quotas, mapped to the labels used on
 * the org usage page. Keep these in sync with the logs entries in Usage.constants.
 */
const LOGS_QUOTA_METRIC_LABELS: Partial<Record<PricingMetric, string>> = {
  [PricingMetric.LOG_INGESTION]: 'Log Ingestion',
  [PricingMetric.LOG_QUERYING]: 'Log Query',
}

/**
 * Compute billing-related restriction banners for the currently selected organization.
 *
 * The hook examines billing feature availability, overdue invoices, organization billing data,
 * and restriction status to produce an ordered list of warning/danger banner props.
 *
 * @returns An object containing:
 *  - `warnings`: an array of `WarningBannerProps` to display for the selected organization (may be empty).
 *  - `org`: the selected organization data (may be `undefined`).
 */
export function useOrganizationRestrictions() {
  const { data: org } = useSelectedOrganizationQuery()

  const { data: overdueInvoices } = useOverdueInvoicesQuery()
  const { data: organizations } = useOrganizationsQuery()
  const { data: usage, isSuccess: isSuccessOrgUsage } = useOrgUsageQuery({ orgSlug: org?.slug })

  const warnings: WarningBannerProps[] = []

  const billingEnabled = useIsFeatureEnabled('billing:all')
  if (!billingEnabled) {
    return { warnings, org }
  }

  const overdueInvoicesFromOtherOrgs = overdueInvoices?.filter(
    (invoice) => invoice.organization_id !== org?.id
  )
  const thisOrgHasOverdueInvoices = overdueInvoices?.filter(
    (invoice) => invoice.organization_id === org?.id
  )

  if (thisOrgHasOverdueInvoices?.length) {
    warnings.push({
      variant: 'danger',
      title: RESTRICTION_MESSAGES.OVERDUE_INVOICES.title,
      description: RESTRICTION_MESSAGES.OVERDUE_INVOICES.description(org?.slug ?? 'default'),
    })
  }

  if (overdueInvoicesFromOtherOrgs?.length) {
    const otherOrgSlug = organizations?.find(
      (o) => o.id === overdueInvoicesFromOtherOrgs[0].organization_id
    )?.slug
    warnings.push({
      variant: 'danger',
      title: RESTRICTION_MESSAGES.OVERDUE_INVOICES_FROM_OTHER_ORGS.title,
      description: RESTRICTION_MESSAGES.OVERDUE_INVOICES_FROM_OTHER_ORGS.description(
        otherOrgSlug ?? org?.slug ?? 'default'
      ),
    })
  }

  if (org?.restriction_status === 'grace_period') {
    warnings.push({
      variant: 'warning',
      title: RESTRICTION_MESSAGES.GRACE_PERIOD.title,
      description: RESTRICTION_MESSAGES.GRACE_PERIOD.description(
        org?.restriction_data?.['grace_period_end'] ?? '',
        org.slug
      ),
    })
  }

  if (org?.restriction_status === 'grace_period_over') {
    warnings.push({
      variant: 'warning',
      title: RESTRICTION_MESSAGES.GRACE_PERIOD_OVER.title,
      description: RESTRICTION_MESSAGES.GRACE_PERIOD_OVER.description(org.slug),
    })
  }

  if (org?.restriction_status === 'restricted') {
    warnings.push({
      variant: 'danger',
      title: RESTRICTION_MESSAGES.RESTRICTED.title,
      description: RESTRICTION_MESSAGES.RESTRICTED.description(org.slug),
    })
  }

  // Logs fair-use quota banner. Suppressed while the org is under a billing
  // restriction status (those banners cover the same exceeded-quota situation)
  // and until usage has loaded, to avoid flashing stale cross-org data. Uses
  // the same exceeded-quota predicate as the in-page Restriction component, so
  // it auto-resolves once usage drops back under the quota.
  if (!org?.restriction_status && isSuccessOrgUsage) {
    const exceededLogsMetricLabels = (usage?.usages ?? [])
      .filter(
        (metric) =>
          (metric.metric === PricingMetric.LOG_INGESTION ||
            metric.metric === PricingMetric.LOG_QUERYING) &&
          !metric.unlimited &&
          metric.capped &&
          metric.usage > (metric.pricing_free_units ?? 0)
      )
      .map((metric) => LOGS_QUOTA_METRIC_LABELS[metric.metric as PricingMetric] ?? metric.metric)

    if (exceededLogsMetricLabels.length > 0) {
      warnings.push({
        variant: 'warning',
        title: RESTRICTION_MESSAGES.LOGS_QUOTA_EXCEEDED.title,
        description: RESTRICTION_MESSAGES.LOGS_QUOTA_EXCEEDED.description(
          org?.slug ?? 'default',
          exceededLogsMetricLabels
        ),
      })
    }
  }

  return { warnings, org }
}
