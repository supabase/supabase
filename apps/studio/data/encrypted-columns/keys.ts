export const encryptedColumnKeys = {
  list: (
    projectRef: string | undefined,
    schema: string | undefined,
    tableName: string | undefined
  ) => ['projects', projectRef, 'encrypted-columns', schema, tableName] as const,
}
