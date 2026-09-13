export const partnersKeys = {
  getIntegrations: (projectId?: string) => ['partners', 'integrations', projectId] as const,
  getStripeProjects: (arId: string | undefined) => ['stripe', 'projects', arId] as const,
}
