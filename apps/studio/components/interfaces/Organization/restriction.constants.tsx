import { type ReactNode } from 'react'

import { InlineLink } from 'components/ui/InlineLink'

export const RESTRICTION_MESSAGES = {
  GRACE_PERIOD: {
    title: 'Organization plan has exceeded its quota',
    description: (date: string, slug: string): ReactNode => (
      <>
        You have been given a grace period until {date}.{' '}
        <InlineLink href={`/org/${slug}/usage`}>Review usage</InlineLink>
      </>
    ),
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
  MISSING_BILLING_INFO: {
    title: 'Missing billing information',
    description: (slug: string): ReactNode => (
      <>
        Please <InlineLink href={`/org/${slug}/billing#address`}>add a billing address</InlineLink>{' '}
        to avoid restrictions. If you are a registered business, please add a tax ID too
      </>
    ),
  },
}
