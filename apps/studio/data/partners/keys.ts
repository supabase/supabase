export const stripeProjectsKeys = {
  get: (arId: string | undefined) => ['stripe', 'projects', arId] as const,
}
