export const partnersKeys = {
  getIntegrations: (projectId?: string) => ['partners', 'integrations', projectId] as const,
  getStripeProjects: (arId: string | undefined) => ['stripe', 'projects', arId] as const,
  getStripeAtlasApplication: (stripeAtlasToken: string | undefined) =>
    ['stripe', 'atlas', 'application', stripeAtlasToken] as const,
}
