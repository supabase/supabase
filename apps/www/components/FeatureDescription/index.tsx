'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import ReactMarkdown from 'react-markdown'

import { StartYourProjectButton } from '@/components/StartYourProjectButton'
import { FEATURE_CTA_MARKER } from '@/data/features'

const DEFAULT_CTA_LABEL = 'Start your project'

interface Props {
  description: string
  ctaLabel?: string
}

/**
 * Renders a feature description as markdown. If the description contains
 * FEATURE_CTA_MARKER, the shared StartYourProjectButton is rendered at the marker.
 */
export const FeatureDescription = ({ description, ctaLabel = DEFAULT_CTA_LABEL }: Props) => {
  const sendTelemetryEvent = useSendTelemetryEvent()

  if (!description.includes(FEATURE_CTA_MARKER)) {
    return (
      <div className="prose prose-docs">
        <ReactMarkdown>{description.replace(FEATURE_CTA_MARKER, '')}</ReactMarkdown>
      </div>
    )
  }

  const [before, after] = description.split(FEATURE_CTA_MARKER)

  return (
    <>
      <div className="flex flex-col items-start gap-4">
        <div className="prose prose-docs">
          <ReactMarkdown>{before}</ReactMarkdown>
        </div>
        <StartYourProjectButton
          variant="primary"
          size="medium"
          onClick={() =>
            sendTelemetryEvent({
              action: 'start_project_button_clicked',
              properties: { buttonLocation: 'Feature page' },
            })
          }
        >
          {ctaLabel}
        </StartYourProjectButton>
      </div>
      <div className="prose prose-docs">
        <ReactMarkdown>{after}</ReactMarkdown>
      </div>
    </>
  )
}
