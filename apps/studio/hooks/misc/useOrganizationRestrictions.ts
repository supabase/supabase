import { useOverdueInvoicesQuery } from 'data/invoices/invoices-overdue-query'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { RESTRICTION_MESSAGES } from 'components/interfaces/Organization/restriction.constants'
import dayjs from 'dayjs'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'

export type WarningBannerProps = {
  type: 'danger' | 'warning' | 'note'
  title: string
  message: string
  link: string
}

export function useOrganizationRestrictions() {
  const { data: resourceWarnings } = useResourceWarningsQuery()
  const { data: overdueInvoices } = useOverdueInvoicesQuery()
  const { data: organizations } = useOrganizationsQuery()
  const org = useSelectedOrganization()

  const warnings: WarningBannerProps[] = []

  const overdueInvoicesFromOtherOrgs = overdueInvoices?.filter(
    (invoice) => invoice.organization_id !== org?.id
  )
  const thisOrgHasOverdueInvoices = overdueInvoices?.filter(
    (invoice) => invoice.organization_id === org?.id
  )

  if (thisOrgHasOverdueInvoices?.length) {
    warnings.push({
      type: 'danger',
      title: RESTRICTION_MESSAGES.OVERDUE_INVOICES.title,
      message: RESTRICTION_MESSAGES.OVERDUE_INVOICES.message,
      link: `/org/${org?.slug}/settings/invoices`,
    })
  }

  if (overdueInvoicesFromOtherOrgs?.length) {
    warnings.push({
      type: 'danger',
      title: RESTRICTION_MESSAGES.OVERDUE_INVOICES_FROM_OTHER_ORGS.title,
      message: RESTRICTION_MESSAGES.OVERDUE_INVOICES_FROM_OTHER_ORGS.message,
      link: `/org/${organizations ? organizations?.find((org) => org.id === overdueInvoicesFromOtherOrgs[0].organization_id)?.slug : org?.slug}/settings/invoices`,
    })
  }

  if (org?.restriction_status === 'grace_period') {
    warnings.push({
      type: 'warning',
      title: RESTRICTION_MESSAGES.GRACE_PERIOD.title,
      message: RESTRICTION_MESSAGES.GRACE_PERIOD.message(
        dayjs(org?.restriction_data?.['grace_period_end']).format('DD MMM, YYYY')
      ),
      link: `/org/${org?.slug}/settings/billing`,
    })
  }

  if (org?.restriction_status === 'grace_period_over') {
    warnings.push({
      type: 'warning',
      title: RESTRICTION_MESSAGES.GRACE_PERIOD_OVER.title,
      message: RESTRICTION_MESSAGES.GRACE_PERIOD_OVER.message,
      link: `/org/${org?.slug}/settings/billing`,
    })
  }

  if (org?.restriction_status === 'restricted') {
    warnings.push({
      type: 'danger',
      title: RESTRICTION_MESSAGES.RESTRICTED.title,
      message: RESTRICTION_MESSAGES.RESTRICTED.message,
      link: `/org/${org?.slug}/settings/billing`,
    })
  }

  return { warnings, org }
}
