import Link from 'next/link'
import React, { type ReactNode } from 'react'

export const RESTRICTION_MESSAGES = {
  GRACE_PERIOD: {
    title: 'Organization plan has exceeded its quota',
    description: (date: string, href: string): ReactNode => (
      <>
        You have been given a grace period until {date}. <Link href={href}>Review usage</Link>
      </>
    ),
  },
  GRACE_PERIOD_OVER: {
    title: 'Grace period is over',
    description: (href: string): ReactNode => (
      <>
        Your projects will not be able to serve requests when you use up your quota.{' '}
        <Link href={href}>Review billing</Link>
      </>
    ),
  },
  RESTRICTED: {
    title: 'Services restricted',
    description: (href: string): ReactNode => (
      <>
        Your projects are unable to serve requests as your organization has used up its quota.{' '}
        <Link href={href}>Resolve billing issues</Link>
      </>
    ),
  },
  OVERDUE_INVOICES: {
    title: 'Outstanding invoices',
    description: (href: string): ReactNode => (
      <>
        Please <Link href={href}>pay your invoices</Link> to avoid service disruption
      </>
    ),
  },
  OVERDUE_INVOICES_FROM_OTHER_ORGS: {
    title: 'Outstanding invoices in other organization',
    description: (href: string): ReactNode => (
      <>
        Please <Link href={href}>pay invoices</Link> for other organizations to avoid service
        disruption
      </>
    ),
  },
  MISSING_BILLING_INFO: {
    title: 'Missing billing information',
    description: (href: string): ReactNode => (
      <>
        Please <Link href={href}>add a billing address</Link> to avoid restrictions. If you are a
        registered business, please add a tax ID too
      </>
    ),
  },
}
