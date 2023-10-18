export const enumeratedTypesKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'enumerated-types'] as const,
}
