export const permissionKeys = {
  list: (userId: string | undefined) => ['permissions', userId] as const,
}
