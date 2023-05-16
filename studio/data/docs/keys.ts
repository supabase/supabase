export const docsKeys = {
  jsonSchema: (projectRef: string | undefined) => ['projects', projectRef, 'docs'] as const,
}
