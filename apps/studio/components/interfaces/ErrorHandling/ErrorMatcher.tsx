'use client'

import { ReactNode } from 'react'
import { ErrorDisplay, SupportFormParams } from 'ui-patterns/ErrorDisplay/ErrorDisplay'

import { getMappingForError } from './ErrorMatcher.utils'
import { isDashboardErrorSampled } from '@/lib/telemetry/error-sampling'
import { useTrack } from '@/lib/telemetry/track'

interface ErrorMatcherProps {
  title: string
  error: string | { message: string }
  supportFormParams?: SupportFormParams
  className?: string
  /** Shown when the error isn't classified with its own troubleshooting steps. */
  fallback?: ReactNode
}

export function ErrorMatcher({
  title,
  error,
  supportFormParams,
  className,
  fallback,
}: ErrorMatcherProps) {
  const track = useTrack()

  const message = typeof error === 'string' ? error : error.message
  const mapping = getMappingForError(error)
  const Troubleshooting = mapping?.Troubleshooting

  return (
    <ErrorDisplay
      title={title}
      errorMessage={message}
      supportFormParams={supportFormParams}
      className={className}
      onRender={() => {
        if (isDashboardErrorSampled()) {
          track('dashboard_error_created', {
            source: 'error_display',
            errorType: mapping?.id,
            hasTroubleshooting: !!mapping,
          })
        }
        if (mapping) {
          track('inline_error_troubleshooter_exposed', { errorType: mapping.id })
        }
      }}
      onSupportClick={
        mapping
          ? () =>
              track('inline_error_troubleshooter_action_clicked', {
                errorType: mapping.id,
                ctaType: 'contact_support',
              })
          : undefined
      }
    >
      {Troubleshooting ? <Troubleshooting /> : fallback}
    </ErrorDisplay>
  )
}
