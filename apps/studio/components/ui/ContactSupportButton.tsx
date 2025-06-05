import { Button, ButtonProps } from 'ui'
import { SupportCategories } from '@supabase/shared-types/out/constants'
import * as Sentry from '@sentry/nextjs'
import { useRouter } from 'next/router'
import { MailIcon } from 'lucide-react'

// [Jordi] Map so we dont have to import the enum every time we want to pass it to this component
const SUPPORT_CATEGORY_VALUES = {
  PROBLEM: SupportCategories.PROBLEM,
  DASHBOARD_BUG: SupportCategories.DASHBOARD_BUG,
  DATABASE_UNRESPONSIVE: SupportCategories.DATABASE_UNRESPONSIVE,
  PERFORMANCE_ISSUES: SupportCategories.PERFORMANCE_ISSUES,
  SALES_ENQUIRY: SupportCategories.SALES_ENQUIRY,
  BILLING: SupportCategories.BILLING,
  REFUND: SupportCategories.REFUND,
  ABUSE: SupportCategories.ABUSE,
  LOGIN_ISSUES: SupportCategories.LOGIN_ISSUES,
  ACCOUNT_DELETION: SupportCategories.ACCOUNT_DELETION,
}

type SupportCategory = keyof typeof SUPPORT_CATEGORY_VALUES

export const ContactSupportButton = ({
  unstyled = false,
  category,
  subject,
  message,
  variant = 'default',
  errorContext,
  className,
  projectRef,
}: {
  unstyled?: boolean
  category: SupportCategory
  subject: string
  message: string
  errorContext?: Record<string, unknown>
  projectRef?: string
  variant?: ButtonProps['type']
  className?: string
}) => {
  const router = useRouter()
  const currentUrl = router.asPath

  const sentryData = {
    category,
    subject,
    message,
    url: currentUrl,
    errorContext,
  }

  function getSupportUrl() {
    const url = new URL('/support/new', window.location.origin)
    url.searchParams.set('category', category)
    url.searchParams.set('subject', subject)
    url.searchParams.set('message', message)
    if (projectRef) {
      url.searchParams.set('projectRef', projectRef)
    }
    return url.toString()
  }

  const supportUrl = getSupportUrl()

  async function handleClick() {
    Sentry.addBreadcrumb({
      category: 'contact-support',
      message: 'Contact support button clicked',
      data: sentryData,
      level: 'info',
    })

    window.open(supportUrl, '_blank')
  }

  if (unstyled) {
    return (
      <a href={supportUrl} target="_blank" rel="noreferrer" className={className}>
        Contact support
      </a>
    )
  }

  return (
    <Button
      type={variant}
      onClick={handleClick}
      iconRight={<MailIcon className="size-4" />}
      className={className}
    >
      Contact support
    </Button>
  )
}
