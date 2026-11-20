import { SupportCategories } from '@supabase/shared-types/out/constants'
import { PropsWithChildren, useEffect, useRef } from 'react'
import { Admonition } from 'ui-patterns/Admonition'

import { EVENT_ID_LABEL, formatErrorDetails, getErrorPresentation } from './AlertError.utils'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import CopyButton from '@/components/ui/CopyButton'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { isStudioError } from '@/lib/errors/studio-errors'
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

// Quiet by design: the IDs are for support and Sentry lookups, not the main message
const ErrorIdentifiers = ({ requestId, eventId }: { requestId?: string; eventId?: string }) => {
  if (!requestId && !eventId) return null
  return (
    <dl className="mt-2 space-y-0.5 text-xs text-foreground-lighter">
      {requestId && (
        <div className="flex gap-x-1.5">
          <dt>Request ID:</dt>
          <dd className="font-mono">{requestId}</dd>
        </div>
      )}
      {eventId && (
        <div className="flex gap-x-1.5">
          <dt>{EVENT_ID_LABEL}:</dt>
          <dd className="font-mono">{eventId}</dd>
        </div>
      )}
    </dl>
  )
}

// [Joshen] To standardize the language for all error UIs
export const AlertError = ({
  projectRef,
  orgSlug,
  subject,
  hideContactSupport: hideContactSupportProp,
  description: descriptionProp,
  error,
  className,
  showIcon = true,
  layout,
  showInstructions: showInstructionsProp,
  showErrorPrefix = true,
  children,
  additionalActions,
}: PropsWithChildren<AlertErrorProps>) => {
  const track = useTrack()
  const hasTrackedRef = useRef(false)

  const studioError = isStudioError(error) ? error : undefined
  const presentation = studioError ? getErrorPresentation(studioError) : undefined

  // Props the caller passes win over the defaults for the error's tag
  const hideContactSupport = hideContactSupportProp ?? presentation?.hideContactSupport ?? false
  const showInstructions = showInstructionsProp ?? presentation?.showInstructions ?? true
  const description =
    descriptionProp ??
    presentation?.description ??
    (hideContactSupport
      ? 'Try refreshing your browser.'
      : 'Try refreshing your browser, but if the issue persists for more than a few minutes, contact support.')

  const message = presentation?.message ?? error?.message
  const formattedErrorMessage = message?.includes('503')
    ? '503 Service Temporarily Unavailable'
    : message
  const messagePrefix = showErrorPrefix && !presentation?.message ? 'Error: ' : ''

  const actions =
    studioError && presentation?.showDetails ? (
      <>
        {additionalActions}
        <CopyButton
          variant="default"
          copyLabel="Copy details"
          asyncText={() => formatErrorDetails(studioError, { subject, now: new Date() })}
        />
      </>
    ) : (
      additionalActions
    )

  const hasInlineSupportLink =
    showInstructions && !hideContactSupport && SUPPORT_PHRASE_REGEX.test(description)
  const canShowSupportFallback = !hideContactSupport && !hasInlineSupportLink
  // Without instructions there's no sentence to link, so the fallback continues the message
  const isSupportFallbackInline = canShowSupportFallback && !showInstructions && !!message

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
          {message && (
            <p>
              {`${messagePrefix}${formattedErrorMessage}`}
              {isSupportFallbackInline && (
                <>
                  {/[.!?]$/.test(formattedErrorMessage ?? '') ? ' ' : '. '}
                  <span>If the issue persists,</span> {renderSupportLink('contact support')}
                  <span>.</span>
                </>
              )}
            </p>
          )}
          {showInstructions && (
            <p>
              {hasInlineSupportLink ? renderDescriptionWithSupportLink(description) : description}
            </p>
          )}
          {canShowSupportFallback && !isSupportFallbackInline && (
            <p>{renderSupportLink('Contact support')}</p>
          )}
          {studioError && presentation?.showDetails && (
            <ErrorIdentifiers
              requestId={studioError.requestId}
              eventId={studioError.errorEventId}
            />
          )}
          {children}
        </>
      }
      actions={actions}
      className={className}
    />
  )
}
