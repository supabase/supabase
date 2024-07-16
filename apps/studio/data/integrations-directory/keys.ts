export const integrationsDirectoryKeys = {
  integrationsDirectoryList: (orgId?: number, integrationId?: string) =>
    // adding filter boolean so that invalidation works correctly (invalidating 'integrations-directory' will invalidate all subpaths)
    ['integrations-directory', { orgId, integrationId }].filter(Boolean),
}
