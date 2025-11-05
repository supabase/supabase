import SectionTroubleshootingPage, {
  generateSectionTroubleshootingMetadata,
} from '~/features/docs/TroubleshootingSection.page'

export default async function StorageTroubleshootingPage() {
  return (
    <SectionTroubleshootingPage
      topic="storage"
      sectionName="Storage"
      description="Search or browse troubleshooting guides for common storage issues, including file upload problems, bucket configuration, and security policies."
    />
  )
}

export const metadata = generateSectionTroubleshootingMetadata('storage', 'Storage')
