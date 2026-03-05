import dayjs from 'dayjs'
import type { ReactNode } from 'react'

import { RESTRICTION_MESSAGES } from 'components/interfaces/Organization/restriction.constants'
import { useOverdueInvoicesQuery } from 'data/invoices/invoices-overdue-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useIsFeatureEnabled } from './useIsFeatureEnabled'

export type WarningBannerProps = {
  variant: 'danger' | 'warning' | 'note'
  title: string
  description: ReactNode
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

  if (org && org.organization_missing_address && !org.billing_partner) {
    warnings.push({
      variant: 'danger',
      title: RESTRICTION_MESSAGES.MISSING_BILLING_INFO.title,
      description: RESTRICTION_MESSAGES.MISSING_BILLING_INFO.description(org.slug),
    })
  }

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
        dayjs(org?.restriction_data?.['grace_period_end']).format('DD MMM, YYYY'),
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

  return { warnings, org }
}
