import { cn } from 'ui'

import type { GoSection } from '../schemas'
import CodeBlockSection from './CodeBlockSection'
import FaqSection from './FaqSection'
import FeatureGridSection from './FeatureGridSection'
import FormSection from './FormSection'
import HubSpotMeetingSection from './HubSpotMeetingSection'
import MetricsSection from './MetricsSection'
import QuoteSection from './QuoteSection'
import SingleColumnSection from './SingleColumnSection'
import StepsSection from './StepsSection'
import ThreeColumnSection from './ThreeColumnSection'
import TwoColumnSection from './TwoColumnSection'

export type CustomSectionRenderers = {
  [K in GoSection['type']]?: React.ComponentType<{
    section: Extract<GoSection, { type: K }>
  }>
}

interface SectionRendererProps {
  section: GoSection
  customRenderers?: CustomSectionRenderers
}

export default function SectionRenderer({ section, customRenderers }: SectionRendererProps) {
  // Check for a custom renderer first
  const CustomRenderer = customRenderers?.[section.type] as
    | React.ComponentType<{ section: typeof section }>
    | undefined

  let content: React.ReactNode = null

  if (CustomRenderer) {
    content = <CustomRenderer section={section} />
  } else {
    switch (section.type) {
      case 'single-column':
        content = <SingleColumnSection section={section} />
        break
      case 'two-column':
        content = <TwoColumnSection section={section} />
        break
      case 'three-column':
        content = <ThreeColumnSection section={section} />
        break
      case 'form':
        content = <FormSection section={section} />
        break
      case 'feature-grid':
        content = <FeatureGridSection section={section} />
        break
      case 'metrics':
        content = <MetricsSection section={section} />
        break
      case 'tweets':
        // Tweets requires app-specific dependencies — must be provided via customRenderers
        break
      case 'faq':
        content = <FaqSection section={section} />
        break
      case 'code-block':
        content = <CodeBlockSection section={section} />
        break
      case 'steps':
        content = <StepsSection section={section} />
        break
      case 'quote':
        content = <QuoteSection section={section} />
        break
      case 'hubspot-meeting':
        content = <HubSpotMeetingSection section={section} />
        break
      default: {
        const _exhaustive: never = section
        break
      }
    }
  }

  if (!content) return null

  if (section.id || section.className) {
    return (
      <div id={section.id} className={cn(section.className)}>
        {content}
      </div>
    )
  }

  return content
}
