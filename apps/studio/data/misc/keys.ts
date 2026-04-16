export const miscKeys = {
  changelogRecent: (pathPrefix: string) => ['changelog-recent', pathPrefix] as const,
  cliReleaseVersion: () => ['cliReleaseVersion'] as const,
  defaultRegion: (cloudProvider: string | undefined, useRestrictedPool: boolean) =>
    ['defaultRegion', [cloudProvider, useRestrictedPool]] as const,
  ipAddress: () => ['ip-address'] as const,
  clockSkew: () => ['clock-skew'] as const,
}
