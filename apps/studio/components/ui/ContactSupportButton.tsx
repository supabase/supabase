import { Button, ButtonProps } from 'ui'
import { SupportCategories } from '@supabase/shared-types/out/constants'
import * as Sentry from '@sentry/nextjs'
import { useRouter } from 'next/router'
import { MailIcon } from 'lucide-react'
import { useEffect } from 'react'

// [Jordi] Map so we dont have to import the enum every time we want to pass it to this component
const SUPPORT_CATEGORY_VALUES = {
  PROBLEM: SupportCategories.PROBLEM,
  DASHBOARD_BUG: SupportCategories.DASHBOARD_BUG,
  DATABASE_UNRESPONSIVE: SupportCategories.DATABASE_UNRESPONSIVE,
  PERFORMANCE_ISSUES: SupportCategories.PERFORMANCE_ISSUES,
  SALES_ENQUIRY: SupportCategories.SALES_ENQUIRY,
}

type SupportCategory = keyof typeof SUPPORT_CATEGORY_VALUES

export const ContactSupportButton = ({
  category,
  subject,
  message,
  variant = 'default',
  errorContext,
}: {
  category: SupportCategory
  subject: string
  message: string
  errorContext: Record<string, unknown>
  variant?: ButtonProps['type']
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

  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'contact-support',
      message: 'Contact support button rendered',
      level: 'info',
      data: sentryData,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleClick() {
    Sentry.addBreadcrumb({
      category: 'contact-support',
      message: 'Contact support button clicked',
      data: sentryData,
      level: 'info',
    })

    const supportUrl = `/support/new?category=${category}&subject=${subject}&message=${encodeURI(message)}`

    window.open(supportUrl, '_blank')
  }

  return (
    <Button type={variant} onClick={handleClick} iconRight={<MailIcon className="size-4" />}>
      Contact support
    </Button>
  )
}
