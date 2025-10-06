import dayjs from 'dayjs'

import { RESTRICTION_MESSAGES } from 'components/interfaces/Organization/restriction.constants'
import { useOverdueInvoicesQuery } from 'data/invoices/invoices-overdue-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useBillingCustomerDataForm } from 'components/interfaces/Organization/BillingSettings/BillingCustomerData/useBillingCustomerDataForm'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useIsFeatureEnabled } from './useIsFeatureEnabled'

export type WarningBannerProps = {
  type: 'danger' | 'warning' | 'note'
  title: string
  message: string
  link: string
}

export function useOrganizationRestrictions() {
  const { data: org } = useSelectedOrganizationQuery()

  const { data: overdueInvoices } = useOverdueInvoicesQuery()
  const { data: organizations } = useOrganizationsQuery()
  const { data: billingCustomer } = useOrganizationCustomerProfileQuery({ slug: org?.slug })

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

  if (
    org &&
    org.plan.id !== 'free' &&
    billingCustomer &&
    !billingCustomer.address?.line1 &&
    !org.billing_partner
  ) {
    warnings.push({
      type: 'warning',
      title: RESTRICTION_MESSAGES.MISSING_BILLING_INFO.title,
      message: RESTRICTION_MESSAGES.MISSING_BILLING_INFO.message,
      link: `/org/${org?.slug}/billing#address`,
    })
  }

  if (thisOrgHasOverdueInvoices?.length) {
    warnings.push({
      type: 'danger',
      title: RESTRICTION_MESSAGES.OVERDUE_INVOICES.title,
      message: RESTRICTION_MESSAGES.OVERDUE_INVOICES.message,
      link: `/org/${org?.slug}/billing#invoices`,
    })
  }

  if (overdueInvoicesFromOtherOrgs?.length) {
    warnings.push({
      type: 'danger',
      title: RESTRICTION_MESSAGES.OVERDUE_INVOICES_FROM_OTHER_ORGS.title,
      message: RESTRICTION_MESSAGES.OVERDUE_INVOICES_FROM_OTHER_ORGS.message,
      link: `/org/${organizations ? organizations?.find((org) => org.id === overdueInvoicesFromOtherOrgs[0].organization_id)?.slug : org?.slug}/billing#invoices`,
    })
  }

  if (org?.restriction_status === 'grace_period') {
    warnings.push({
      type: 'warning',
      title: RESTRICTION_MESSAGES.GRACE_PERIOD.title,
      message: RESTRICTION_MESSAGES.GRACE_PERIOD.message(
        dayjs(org?.restriction_data?.['grace_period_end']).format('DD MMM, YYYY')
      ),
      link: `/org/${org?.slug}/billing`,
    })
  }

  if (org?.restriction_status === 'grace_period_over') {
    warnings.push({
      type: 'warning',
      title: RESTRICTION_MESSAGES.GRACE_PERIOD_OVER.title,
      message: RESTRICTION_MESSAGES.GRACE_PERIOD_OVER.message,
      link: `/org/${org?.slug}/billing`,
    })
  }

  if (org?.restriction_status === 'restricted') {
    warnings.push({
      type: 'danger',
      title: RESTRICTION_MESSAGES.RESTRICTED.title,
      message: RESTRICTION_MESSAGES.RESTRICTED.message,
      link: `/org/${org?.slug}/billing`,
    })
  }

  return { warnings, org }
}
