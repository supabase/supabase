import { SupportCategories } from '@supabase/shared-types/out/constants'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { PropsWithChildren } from 'react'

import { Admonition } from 'ui-patterns/admonition'

import { Button } from 'ui'

export interface AlertErrorProps {
  projectRef?: string
  subject?: string
  error?: { message: string } | null
  layout?: 'vertical' | 'horizontal'
  className?: string
  showIcon?: boolean
  additionalActions?: React.ReactNode
}

const ContactSupportButton = ({
  projectRef,
  subject,
  error,
}: {
  projectRef?: string
  subject?: string
  error?: { message: string } | null
}) => {
  return (
    <Button asChild type="default" className="w-min">
      <SupportLink
        queryParams={{
          category: SupportCategories.DASHBOARD_BUG,
          projectRef,
          subject,
          error: error?.message,
        }}
      >
        Contact support
      </SupportLink>
    </Button>
  )
}

// [Joshen] To standardize the language for all error UIs

export const AlertError = ({
  projectRef,
  subject,
  error,
  className,
  showIcon = true,
  layout = 'horizontal',
  children,
  additionalActions,
}: PropsWithChildren<AlertErrorProps>) => {
  const formattedErrorMessage = error?.message?.includes('503')
    ? '503 Service Temporarily Unavailable'
    : error?.message

  return (
    <Admonition
      type="warning"
      layout={additionalActions ? 'vertical' : layout}
      showIcon={showIcon}
      title={subject}
      description={
        <>
          {error?.message && <p>Error: {formattedErrorMessage}</p>}
          <p>
            Try refreshing your browser. If the issue persists for more than a few minutes, please
            reach out to us via support.
          </p>
          {children}
        </>
      }
      actions={
        additionalActions ? (
          <>
            {additionalActions}
            <ContactSupportButton projectRef={projectRef} subject={subject} error={error} />
          </>
        ) : (
          <ContactSupportButton projectRef={projectRef} subject={subject} error={error} />
        )
      }
      className={className}
    />
  )
}

export default AlertError
