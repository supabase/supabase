export const docsKeys = {
  jsonSchema: (
    projectRef: string | undefined,
    swaggerUrl: string | undefined,
    apiKey: string | undefined
  ) => ['projects', projectRef, 'docs', { swaggerUrl, apiKey }] as const,
}
