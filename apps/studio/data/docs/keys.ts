export const docsKeys = {
  jsonSchema: (projectRef: string | undefined, schemas?: string[]) =>
    ['projects', projectRef, 'docs', schemas] as const,
}
