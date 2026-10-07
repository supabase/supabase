export const openApiKeys = {
  apiSpec: (projectRef: string | undefined, schemas?: string[]) =>
    ['projects', projectRef, 'open-api-spec', schemas] as const,
}
