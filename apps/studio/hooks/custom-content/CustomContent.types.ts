export type CustomContentTypes = {
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
}
