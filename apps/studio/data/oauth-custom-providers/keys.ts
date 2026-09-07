export const oAuthCustomProvidersKeys = {
  // temporaryApiKey has to be added to reset the query when it changes
  list: (projectRef: string | undefined, clientEndpoint: string | undefined) =>
    ['projects', projectRef, 'oauth-custom-providers', clientEndpoint] as const,
}
