import SectionTroubleshootingPage, {
  generateSectionTroubleshootingMetadata,
} from '~/features/docs/TroubleshootingSection.page'

export default async function RealtimeTroubleshootingPage() {
  return (
    <SectionTroubleshootingPage
      topic="realtime"
      sectionName="Realtime"
      description="Search or browse troubleshooting guides for common realtime issues, including connection problems, subscription management, and message delivery."
    />
  )
}

export const metadata = generateSectionTroubleshootingMetadata('realtime', 'Realtime')
