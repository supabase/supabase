import SectionTroubleshootingPage, {
  generateSectionTroubleshootingMetadata,
} from '~/features/docs/TroubleshootingSection.page'

export default async function FunctionsTroubleshootingPage() {
  return (
    <SectionTroubleshootingPage
      topic="functions"
      sectionName="Edge Functions"
      description="Search or browse troubleshooting guides for common Edge Functions issues, including deployment problems, runtime errors, and environment configuration."
    />
  )
}

export const metadata = generateSectionTroubleshootingMetadata('functions', 'Edge Functions')
