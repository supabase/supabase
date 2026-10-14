import { SupportCategories } from '@supabase/shared-types/out/constants'
import { PropsWithChildren, useEffect, useRef } from 'react'
import { Admonition } from 'ui-patterns/Admonition'

import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
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

const SUPPORT_PHRASE_REGEX = /(contact support)/i

// [Joshen] To standardize the language for all error UIs
export const AlertError = ({
  projectRef,
  orgSlug,
  subject,
  hideContactSupport = false,
  description = hideContactSupport
    ? 'Try refreshing your browser.'
    : 'Try refreshing your browser, but if the issue persists for more than a few minutes, contact support.',
  error,
  className,
  showIcon = true,
  layout,
  showInstructions = true,
  showErrorPrefix = true,
  children,
  additionalActions,
}: PropsWithChildren<AlertErrorProps>) => {
  const track = useTrack()
  const hasTrackedRef = useRef(false)

  const formattedErrorMessage = error?.message?.includes('503')
    ? '503 Service Temporarily Unavailable'
    : error?.message

  const hasInlineSupportLink =
    showInstructions && !hideContactSupport && SUPPORT_PHRASE_REGEX.test(description)
  const canShowSupportFallback = !hideContactSupport && !hasInlineSupportLink

  const renderSupportLink = (text: string, key?: number) => (
    <SupportLink
      key={key}
      className={InlineLinkClassName}
      queryParams={{
        category: SupportCategories.DASHBOARD_BUG,
        projectRef,
        orgSlug,
        subject,
        errorMessage: error?.message,
      }}
    >
      {text}
    </SupportLink>
  )

  // Splitting with a capture group keeps the matched text, so it can be swapped for a link
  const renderDescriptionWithSupportLink = (text: string) =>
    text
      .split(SUPPORT_PHRASE_REGEX)
      .map((part, index) =>
        SUPPORT_PHRASE_REGEX.test(part) ? renderSupportLink(part, index) : part
      )

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
              {hasInlineSupportLink ? renderDescriptionWithSupportLink(description) : description}
            </p>
          )}
          {canShowSupportFallback && <p>{renderSupportLink('Contact support')}</p>}
          {children}
        </>
      }
      actions={additionalActions}
      className={className}
    />
  )
}
