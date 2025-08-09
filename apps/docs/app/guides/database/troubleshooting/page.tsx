import SectionTroubleshootingPage, {
  generateSectionTroubleshootingMetadata,
} from '~/features/docs/TroubleshootingSection.page'

export default async function DatabaseTroubleshootingPage() {
  return (
    <SectionTroubleshootingPage
      topic="database"
      sectionName="Database"
      description="Search or browse troubleshooting guides for common database issues, including connection problems, query optimization, and configuration."
    />
  )
}

export const metadata = generateSectionTroubleshootingMetadata('database', 'Database')
