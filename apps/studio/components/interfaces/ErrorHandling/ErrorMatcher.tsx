'use client'

import { ErrorDisplay, SupportFormParams } from 'ui-patterns/ErrorDisplay/ErrorDisplay'

import { getMappingForError } from './ErrorMatcher.utils'
import { useTrack } from '@/lib/telemetry/track'

interface ErrorMatcherProps {
  title: string
  error: string | { message: string }
  supportFormParams?: SupportFormParams
  className?: string
}

export function ErrorMatcher({ title, error, supportFormParams, className }: ErrorMatcherProps) {
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
        track('dashboard_error_created', {
          source: 'error_display',
          errorType: mapping?.id,
          hasTroubleshooting: !!mapping,
        })
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
      {Troubleshooting && <Troubleshooting />}
    </ErrorDisplay>
  )
}
