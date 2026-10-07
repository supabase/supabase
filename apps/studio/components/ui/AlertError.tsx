import { SupportCategories } from '@supabase/shared-types/out/constants'
import { PropsWithChildren, useEffect, useRef } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { createSupportFormUrl } from '@/components/interfaces/Support/SupportForm.utils'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { InlineLink } from '@/components/ui/InlineLink'
import { takeBreadcrumbSnapshot } from '@/lib/breadcrumbs'
import { isDashboardErrorSampled } from '@/lib/telemetry/error-sampling'
import { useTrack } from '@/lib/telemetry/track'

export interface AlertErrorProps {
  projectRef?: string
  orgSlug?: string
  subject?: string
  description?: string
  error?: { message: string } | null
  layout?: 'vertical' | 'horizontal' | 'responsive'
  className?: string
  showIcon?: boolean
  showInstructions?: boolean
  showErrorPrefix?: boolean
  additionalActions?: React.ReactNode
  hideContactSupport?: boolean
}

export const ContactSupportButton = ({
  projectRef,
  orgSlug,
  subject,
  error,
}: {
  projectRef?: string
  orgSlug?: string
  subject?: string
  error?: { message: string } | null
}) => {
  return (
    <Button asChild className="w-min">
      <SupportLink
        queryParams={{
          category: SupportCategories.DASHBOARD_BUG,
          projectRef,
          orgSlug,
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
  orgSlug,
  subject,
  description = 'Try refreshing your browser, but if the issue persists for more than a few minutes, contact support.',
  error,
  className,
  showIcon = true,
  layout,
  showInstructions = true,
  showErrorPrefix = true,
  children,
  additionalActions,
  hideContactSupport = false,
}: PropsWithChildren<AlertErrorProps>) => {
  const track = useTrack()
  const hasTrackedRef = useRef(false)

  const formattedErrorMessage = error?.message?.includes('503')
    ? '503 Service Temporarily Unavailable'
    : error?.message

  useEffect(() => {
    if (!hasTrackedRef.current) {
      hasTrackedRef.current = true
      if (isDashboardErrorSampled()) {
        track('dashboard_error_created', {
          source: 'admonition',
        })
      }
    }
  }, [track])

  const renderSupportLink = (text: string, key?: number) => (
    <InlineLink
      key={key}
      href={createSupportFormUrl({
        category: SupportCategories.DASHBOARD_BUG,
        projectRef,
        orgSlug,
        subject,
        error: error?.message,
      })}
      onClick={() => takeBreadcrumbSnapshot()}
    >
      {text}
    </InlineLink>
  )

  return (
    <Admonition
      type="warning"
      layout={layout ?? (additionalActions ? 'vertical' : 'responsive')}
      showIcon={showIcon}
      title={subject}
      description={
        <>
          {error?.message && (
            <p>
              {showErrorPrefix && 'Error: '}
              {formattedErrorMessage}
            </p>
          )}
          {showInstructions && (
            <p>
              {description
                .split(/(contact support)/i)
                .map((part, index) =>
                  !hideContactSupport && part.toLowerCase() === 'contact support'
                    ? renderSupportLink(part, index)
                    : part
                )}
            </p>
          )}
          {!hideContactSupport && (!showInstructions || !/contact support/i.test(description)) && (
            <p>{renderSupportLink('Contact support')}</p>
          )}
          {children}
        </>
      }
      actions={additionalActions}
      className={className}
    />
  )
}
