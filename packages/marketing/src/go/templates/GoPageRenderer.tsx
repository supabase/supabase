import type { GoPage } from '../schemas'
import type { CustomSectionRenderers } from '../sections/SectionRenderer'
import LeadGenTemplate from './LeadGenTemplate'
import LegalTemplate from './LegalTemplate'
import ThankYouTemplate from './ThankYouTemplate'

interface GoPageRendererProps {
  page: GoPage
  customRenderers?: CustomSectionRenderers
}

function TemplateSwitch({ page, customRenderers }: GoPageRendererProps) {
  switch (page.template) {
    case 'lead-gen':
      return <LeadGenTemplate page={page} customRenderers={customRenderers} />
    case 'thank-you':
      return <ThankYouTemplate page={page} customRenderers={customRenderers} />
    case 'legal':
      return <LegalTemplate page={page} customRenderers={customRenderers} />
    default: {
      const _exhaustive: never = page
      return null
    }
  }
}

export default function GoPageRenderer({ page, customRenderers }: GoPageRendererProps) {
  return <TemplateSwitch page={page} customRenderers={customRenderers} />
}
