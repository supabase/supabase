import type { CloudProvider } from 'shared-data'

export type CustomContentTypes = {
  appTitle: string

  dashboardAuthCustomProvider: string

  organizationLegalDocuments: {
    id: string
    name: string
    description: string
    action: { text: string; url: string }
  }[]

  projectHomepageClientLibraries: {
    language: string
    officialSupport: boolean
    releaseState?: string
    docsUrl: string
    gitUrl?: string
    altIconName?: string
  }[]
  projectHomepageExampleProjects: {
    title: string
    description: string
    iconUrl: string
    url: string
  }[]

  logsDefaultQuery: string

  infraCloudProviders: CloudProvider[]
  infraAwsNimbusLabel: string

  sslCertificateUrl: string
}
