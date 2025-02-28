export const miscKeys = {
  dockerHubVersions: () => ['dockerHubVersions'] as const,
  defaultRegion: (cloudProvider: string | undefined, useRestrictedPool: boolean) =>
    ['defaultRegion', [cloudProvider, useRestrictedPool]] as const,
}
