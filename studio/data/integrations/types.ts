export type IntegrationConnectionsCreateVariables = {
  organizationIntegrationId: string
  connection: {
    foreign_project_id: string
    supabase_project_ref: string
    metadata: any
  }
  orgSlug: string | undefined
}
