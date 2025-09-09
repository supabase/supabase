import { CONNECTION_TYPES } from 'components/interfaces/Connect/Connect.constants'
import type { CloudProvider } from 'shared-data'

export type CustomContentTypes = {
  dashboardAuthCustomProvider: string

  organizationLegalDocuments: {
    id: string
    name: string
    description: string
    action: { text: string; url: string }
  }[]

  projectHomepageExampleProjects: {
    title: string
    description: string
    iconUrl: string
    url: string
  }[]

  logsDefaultQuery: string

  /**
   * When declaring files for each framework, there are 3 properties that can be dynamically rendered into the file content using handlebar notation:
   * - {{apiUrl}}: The API URL of the project
   * - {{anonKey}}: The anonymous key of the project (if still using legacy API keys)
   * - {{publishableKey}}: The publishable API key of the project (if using new API keys)
   *
   * These could be helpful in rendering, for e.g an environment file like `.env`
   */
  connectFrameworks: (typeof CONNECTION_TYPES)[number]

  infraCloudProviders: CloudProvider[]

  sslCertificateUrl: string
}
