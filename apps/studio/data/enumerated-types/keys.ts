export const enumeratedTypesKeys = {
  list: (projectRef: string | undefined, schemas?: string[]) =>
    ['projects', projectRef, 'enumerated-types', schemas].filter(Boolean),
}
