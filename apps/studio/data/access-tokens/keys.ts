export const accessTokenKeys = {
  list: () => ['access-tokens'] as const,
  detail: (id: string) => ['access-tokens', id] as const,
}
