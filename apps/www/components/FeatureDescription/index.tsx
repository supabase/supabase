'use client'

import ReactMarkdown from 'react-markdown'

import { StartYourProjectButton } from '@/components/StartYourProjectButton'
import { FEATURE_CTA_MARKER } from '@/data/features'

const DEFAULT_CTA_LABEL = 'Start your project'

interface Props {
  title: string
  description: string
  ctaLabel?: string
}

/**
 * Renders a feature description as markdown. If the description contains
 * FEATURE_CTA_MARKER, the shared StartYourProjectButton is rendered at the marker.
 */
export const FeatureDescription = ({ title, description, ctaLabel = DEFAULT_CTA_LABEL }: Props) => {
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
          buttonLocation={`Feature page - ${title}`}
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
