export const openApiKeys = {
  apiSpec: (projectRef: string | undefined) => ['projects', projectRef, 'open-api-spec'] as const,
}
