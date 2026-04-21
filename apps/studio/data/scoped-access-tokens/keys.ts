export const scopedAccessTokenKeys = {
  list: () => ['scoped-access-tokens'] as const,
  detail: (id: string) => ['scoped-access-tokens', id] as const,
}
