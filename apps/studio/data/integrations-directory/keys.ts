export const integrationsDirectoryKeys = {
  integrationsDirectoryList: (orgSlug?: string, integrationId?: string) =>
    // adding filter boolean so that invalidation works correctly (invalidating 'integrations-directory' will invalidate all subpaths)
    ['integrations-directory', { orgSlug, integrationId }].filter(Boolean),
}
