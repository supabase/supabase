import { SupportCategories } from '@supabase/shared-types/out/constants'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { PropsWithChildren } from 'react'

import { Admonition } from 'ui-patterns/admonition'

import { Button } from 'ui'

export interface AlertErrorProps {
  projectRef?: string
  subject?: string
  error?: { message: string } | null
  className?: string
  showIcon?: boolean
  additionalActions?: React.ReactNode
}

/**
 * @deprecated Use `import { Admonition } from "ui-patterns/admonition"` instead
 */

// [Joshen] To standardize the language for all error UIs

export const AlertError = ({
  projectRef,
  subject,
  error,
  className,
  showIcon = true,
  children,
  additionalActions,
}: PropsWithChildren<AlertErrorProps>) => {
  const formattedErrorMessage = error?.message?.includes('503')
    ? '503 Service Temporarily Unavailable'
    : error?.message

  return (
    <Admonition
      type="warning"
      layout="horizontal"
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
        <>
          {additionalActions}
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
        </>
      }
      className={className ? className : undefined}
    />
  )
}

export default AlertError
