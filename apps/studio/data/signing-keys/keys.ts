export const signingKeysKeys = {
  all: ['signingKeys'] as const,
  lists: () => [...signingKeysKeys.all, 'list'] as const,
  list: (projectRef: string) => [...signingKeysKeys.lists(), { projectRef }] as const,
  details: () => [...signingKeysKeys.all, 'detail'] as const,
  detail: (projectRef: string, id: string) =>
    [...signingKeysKeys.details(), { projectRef, id }] as const,
}
