'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { useIsLoggedIn } from 'common'
import ReactMarkdown from 'react-markdown'
import { Button } from 'ui'

import { FEATURE_CTA_MARKER } from '@/data/features'
import { getDashboardCtaHref } from '@/lib/dashboard-links'

const DEFAULT_CTA_LABEL = 'Start your project'

interface Props {
  description: string
  ctaLabel?: string
}

/**
 * Renders a feature description as markdown. If the description contains
 * FEATURE_CTA_MARKER, a CTA button is rendered at the marker.
 */
export const FeatureDescription = ({ description, ctaLabel = DEFAULT_CTA_LABEL }: Props) => {
  const isLoggedIn = useIsLoggedIn()
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
        <Button variant="primary" size="medium" asChild>
          <a
            href={getDashboardCtaHref(isLoggedIn)}
            onClick={() =>
              sendTelemetryEvent({
                action: 'start_project_button_clicked',
                properties: { buttonLocation: 'Feature page' },
              })
            }
          >
            {ctaLabel}
          </a>
        </Button>
      </div>
      <div className="prose prose-docs">
        <ReactMarkdown>{after}</ReactMarkdown>
      </div>
    </>
  )
}
