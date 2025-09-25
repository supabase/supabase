import { Button } from 'ui'
import Link from 'next/link'
import { useCallback } from 'react'
import { useParams } from 'common'
import * as Sentry from '@sentry/nextjs'

export const SUPPORT_CATEGORIES = {
  PROBLEM: 'problem',
  DASHBOARD_BUG: 'dashboard_bug',
  DATABASE_UNRESPONSIVE: 'database_unresponsive',
  PERFORMANCE_ISSUES: 'performance_issues',
  SALES_ENQUIRY: 'sales_enquiry',
  BILLING: 'billing',
  ABUSE: 'abuse',
  REFUND: 'refund',
  LOGIN_ISSUES: 'login_issues',
} as const

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[keyof typeof SUPPORT_CATEGORIES]

export interface ContactSupportProps {
  category: SupportCategory
  subject?: string
  message?: string
  error?: string
  projectRef?: string
  organizationSlug?: string
  variant?: 'default' | 'warning' | 'primary' | 'secondary' | 'outline' | 'text' | 'link' | 'danger'
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  className?: string
  children?: React.ReactNode
  eventProperties?: Record<string, any>
}

export function ContactSupport({
  category,
  subject,
  message,
  error,
  variant = 'default',
  size = 'small',
  className,
  children = 'Contact support',
  eventProperties = {},
}: ContactSupportProps) {
  const { ref } = useParams()

  const buildSupportUrl = useCallback(() => {
    const params = new URLSearchParams()

    if (ref) {
      params.set('projectRef', ref)
    }

    params.set('category', category)

    if (subject) {
      params.set('subject', subject)
    }

    if (message) {
      params.set('message', message)
    }

    if (error) {
      params.set('error', error)
    }

    return `/support/new?${params.toString()}`
  }, [ref, category, subject, message, error])

  const handleClick = useCallback(() => {
    const url = buildSupportUrl()

    Sentry.captureMessage('Contact support clicked', {
      extra: {
        url,
        category,
        subject,
        message,
        error,
        eventProperties,
      },
    })

    window.open(url, '_blank')
  }, [buildSupportUrl, category, subject, message, error, eventProperties])

  return (
    <Button asChild type={variant} size={size} className={className} onClick={handleClick}>
      <Link href={buildSupportUrl()}>{children}</Link>
    </Button>
  )
}
