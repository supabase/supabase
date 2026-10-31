import dayjs from 'dayjs'
import { type ReactNode } from 'react'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { InlineLink } from '@/components/ui/InlineLink'

export const RESTRICTION_MESSAGES = {
  GRACE_PERIOD: {
    title: 'Organization exceeded its quota in the previous billing cycle',
    description: (date: string, slug: string): ReactNode => {
      const label = dayjs(date).format('DD MMM, YYYY')
      return (
        <>
          Projects will be restricted from{' '}
          <TimestampInfo className="text-sm" utcTimestamp={date} label={label} /> if your
          organization remains over quota.{' '}
          <InlineLink href={`/org/${slug}/usage`}>Review usage</InlineLink> or{' '}
          <InlineLink href={`/org/${slug}/billing`}>billing</InlineLink>.
        </>
      )
    },
  },
  GRACE_PERIOD_OVER: {
    title: 'Grace period is over',
    description: (slug: string): ReactNode => (
      <>
        Your projects will not be able to serve requests when you use up your quota.{' '}
        <InlineLink href={`/org/${slug}/billing`}>Review billing</InlineLink>
      </>
    ),
  },
  RESTRICTED: {
    title: 'Services restricted',
    description: (slug: string): ReactNode => (
      <>
        Your projects are unable to serve requests as your organization has used up its quota.{' '}
        <InlineLink href={`/org/${slug}/billing`}>Resolve billing issues</InlineLink>
      </>
    ),
  },
  OVERDUE_INVOICES: {
    title: 'Outstanding invoices',
    description: (slug: string): ReactNode => (
      <>
        Please <InlineLink href={`/org/${slug}/billing#invoices`}>pay your invoices</InlineLink> to
        avoid service disruption
      </>
    ),
  },
  OVERDUE_INVOICES_FROM_OTHER_ORGS: {
    title: 'Outstanding invoices in other organizations',
    description: (orgs: { name: string; slug: string }[]): ReactNode => {
      const [firstOrg, ...remainingOrgs] = orgs

      if (!firstOrg) {
        return (
          <>
            <InlineLink href="/organizations">Pay outstanding invoices</InlineLink> to avoid service
            disruption
          </>
        )
      }

      return (
        <>
          Pay invoices for{' '}
          <InlineLink href={`/org/${firstOrg.slug}/billing#invoices`}>{firstOrg.name}</InlineLink>
          {remainingOrgs.length > 0 &&
            ` and ${remainingOrgs.length} other${remainingOrgs.length === 1 ? '' : 's'}`}{' '}
          to avoid service disruption
        </>
      )
    },
  },
}
