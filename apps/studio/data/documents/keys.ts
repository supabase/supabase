export const documentKeys = {
  list: (orgSlug: string | undefined) => ['orgs', orgSlug, 'resources'] as const,
  resource: (orgSlug: string | undefined, docType: string | undefined) =>
    ['orgs', orgSlug, 'resources', docType] as const,
}
