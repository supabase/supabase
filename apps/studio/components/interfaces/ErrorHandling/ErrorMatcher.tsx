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

const useNoTroubleshooting: UseTroubleshooting = () => ({ errorType: undefined, steps: [] })

function TroubleshootingErrorDisplay({
  title,
  message,
  supportFormParams,
  className,
  hasMapping,
  useTroubleshooting,
}: {
  title: string
  message: string
  supportFormParams?: SupportFormParams
  className?: string
  hasMapping: boolean
  useTroubleshooting: UseTroubleshooting
}) {
  const track = useTrack()
  const { errorType, steps, overlays } = useTroubleshooting()

  return (
    <ErrorDisplay
      type="warning"
      title={title}
      error={{ message }}
      className={className}
      steps={steps}
      supportFormParams={supportFormParams}
      onRender={() => {
        if (isDashboardErrorSampled()) {
          track('dashboard_error_created', {
            source: 'error_display',
            errorType,
            hasTroubleshooting: hasMapping,
          })
        }
        if (errorType) track('inline_error_troubleshooter_exposed', { errorType })
      }}
      onContactSupport={
        errorType
          ? () =>
              track('inline_error_troubleshooter_action_clicked', {
                errorType,
                ctaType: 'contact_support',
              })
          : undefined
      }
      onStepOpenChange={(stepId) => {
        if (!errorType) return
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

export function ErrorMatcher({
  title,
  error,
  supportFormParams,
  className,
  useFallbackTroubleshooting,
}: ErrorMatcherProps) {
  const mapping = getMappingForError(error)
  const useTroubleshooting =
    mapping?.useTroubleshooting ?? useFallbackTroubleshooting ?? useNoTroubleshooting

  return (
    <TroubleshootingErrorDisplay
      key={mapping?.id ?? 'fallback'}
      title={title}
      message={typeof error === 'string' ? error : error.message}
      supportFormParams={supportFormParams}
      className={className}
      hasMapping={!!mapping}
      useTroubleshooting={useTroubleshooting}
    />
  )
}
