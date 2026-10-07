'use client'

import { ErrorDisplay } from 'ui-patterns/ErrorDisplay'
import type { SupportFormParams } from 'ui-patterns/ErrorDisplay'

import type { UseTroubleshooting } from './error-mappings'
import { getMappingForError } from './ErrorMatcher.utils'
import { isDashboardErrorSampled } from '@/lib/telemetry/error-sampling'
import { useTrack } from '@/lib/telemetry/track'

interface ErrorMatcherProps {
  title: string
  error: string | { message: string }
  supportFormParams?: SupportFormParams
  className?: string
  /** Troubleshooting to fall back on when the error isn't classified. */
  useFallbackTroubleshooting?: UseTroubleshooting
}

interface ErrorDisplayShellProps extends Omit<ErrorMatcherProps, 'useFallbackTroubleshooting'> {
  message: string
  errorType?: string
  hasTroubleshooting: boolean
}

function useErrorDisplayProps({
  title,
  message,
  supportFormParams,
  className,
  errorType,
  hasTroubleshooting,
}: Omit<ErrorDisplayShellProps, 'error'>) {
  const track = useTrack()

  return {
    type: 'warning' as const,
    title,
    error: { message },
    supportFormParams,
    className,
    onRender: () => {
      if (isDashboardErrorSampled()) {
        track('dashboard_error_created', {
          source: 'error_display',
          errorType,
          hasTroubleshooting,
        })
      }
      if (errorType) {
        track('inline_error_troubleshooter_exposed', { errorType })
      }
    },
    onContactSupport: errorType
      ? () =>
          track('inline_error_troubleshooter_action_clicked', {
            errorType,
            ctaType: 'contact_support' as const,
          })
      : undefined,
  }
}

function TroubleshootingErrorDisplay({
  useTroubleshooting,
  ...props
}: Omit<ErrorDisplayShellProps, 'error' | 'errorType'> & {
  useTroubleshooting: UseTroubleshooting
}) {
  const track = useTrack()
  const { errorType, steps, overlays } = useTroubleshooting()
  const displayProps = useErrorDisplayProps({ ...props, errorType })

  return (
    <ErrorDisplay
      {...displayProps}
      steps={steps}
      onStepOpenChange={(stepId) => {
        const index = steps.findIndex((step) => step.id === stepId)
        track('inline_error_troubleshooter_step_clicked', {
          errorType,
          step: index >= 0 ? index + 1 : null,
          stepTitle: index >= 0 ? steps[index].title : undefined,
          expanded: stepId !== null,
        })
      }}
    >
      {overlays}
    </ErrorDisplay>
  )
}

function PlainErrorDisplay(props: Omit<ErrorDisplayShellProps, 'error' | 'errorType'>) {
  const displayProps = useErrorDisplayProps(props)
  return <ErrorDisplay {...displayProps} />
}

export function ErrorMatcher({
  title,
  error,
  supportFormParams,
  className,
  useFallbackTroubleshooting,
}: ErrorMatcherProps) {
  const message = typeof error === 'string' ? error : error.message
  const mapping = getMappingForError(error)
  const useTroubleshooting = mapping?.useTroubleshooting ?? useFallbackTroubleshooting

  const shared = {
    title,
    message,
    supportFormParams,
    className,
    hasTroubleshooting: !!mapping,
  }

  if (!useTroubleshooting) return <PlainErrorDisplay {...shared} />

  return (
    <TroubleshootingErrorDisplay
      key={mapping?.id ?? 'fallback'}
      {...shared}
      useTroubleshooting={useTroubleshooting}
    />
  )
}
