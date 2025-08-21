import dayjs from 'dayjs'

import { RESTRICTION_MESSAGES } from 'components/interfaces/Organization/restriction.constants'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'

export type WarningBannerProps = {
  type: 'danger' | 'warning' | 'note'
  title: string
  message: string
  link: string
}

export function useOrganizationRestrictions() {
  const { data: org } = useSelectedOrganizationQuery()

  const { data: organizations } = useOrganizationsQuery()

  const warnings: WarningBannerProps[] = []

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
