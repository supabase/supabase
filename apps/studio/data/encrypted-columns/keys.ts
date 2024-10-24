export const encryptedColumnKeys = {
  list: (projectRef: string | undefined, tableName: string | undefined) =>
    ['projects', projectRef, 'encrypted-columns', tableName] as const,
}
