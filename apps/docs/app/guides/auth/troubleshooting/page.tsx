import SectionTroubleshootingPage, {
  generateSectionTroubleshootingMetadata,
} from '~/features/docs/TroubleshootingSection.page'

export default async function AuthTroubleshootingPage() {
  return (
    <SectionTroubleshootingPage
      topic="auth"
      sectionName="Auth"
      description="Search or browse troubleshooting guides for common authentication issues, including login problems, session management, and provider configuration."
    />
  )
}

export const metadata = generateSectionTroubleshootingMetadata('auth', 'Auth')
