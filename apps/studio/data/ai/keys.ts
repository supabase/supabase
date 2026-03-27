export const aiKeys = {
  apiKey: () => ['api-key'] as const,
  homeSummary: (projectRef: string | undefined, inputDigest: string) =>
    ['ai', 'home-summary', projectRef ?? '', inputDigest] as const,
}
