export const miscKeys = {
  cliReleaseVersion: () => ['cliReleaseVersion'] as const,
  defaultRegion: (cloudProvider: string | undefined, useRestrictedPool: boolean) =>
    ['defaultRegion', [cloudProvider, useRestrictedPool]] as const,
  ipAddress: () => ['ip-address'] as const,
}
