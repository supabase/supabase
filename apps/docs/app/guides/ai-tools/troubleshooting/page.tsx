import SectionTroubleshootingPage, {
  generateSectionTroubleshootingMetadata,
} from '~/features/docs/TroubleshootingSection.page'

export default async function AiToolsTroubleshootingPage() {
  return (
    <SectionTroubleshootingPage
      topic="ai-tools"
      sectionName="AI Tools"
      description="Search or browse troubleshooting guides for common AI tools issues, including configuration, usage, and integration problems."
    />
  )
}

export const metadata = generateSectionTroubleshootingMetadata('AI', 'AI Tools')
