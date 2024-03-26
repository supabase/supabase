export const miscKeys = {
  defaultRegion: (cloudProvider: string | undefined, useRestrictedPool: boolean) =>
    ['defaultRegion', [cloudProvider, useRestrictedPool]] as const,
}
