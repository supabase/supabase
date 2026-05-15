import dayjs from 'dayjs'
import { type ReactNode } from 'react'
import { TimestampInfo } from 'ui-patterns'

import { InlineLink } from '@/components/ui/InlineLink'

export const RESTRICTION_MESSAGES = {
  GRACE_PERIOD: {
    title: 'Organization exceeded its quota in the previous billing cycle',
    description: (date: string, slug: string): ReactNode => {
      const label = dayjs(date).format('DD MMM, YYYY')
      return (
        <>
          You have a grace period until{' '}
          <TimestampInfo className="text-sm" utcTimestamp={date} label={label} /> to bring usage
          back under quota. <InlineLink href={`/org/${slug}/usage`}>Review usage</InlineLink>
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
    title: 'Outstanding invoices in other organization',
    description: (slug: string): ReactNode => (
      <>
        Please <InlineLink href={`/org/${slug}/billing#invoices`}>pay invoices</InlineLink> for
        other organizations to avoid service disruption
      </>
    ),
  },
}
