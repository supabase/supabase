export const oauthServerAppKeys = {
  // temporaryApiKey has to be added to reset the query when it changes
  list: (projectRef: string | undefined, clientEndpoint: string | undefined) =>
    ['projects', projectRef, 'oauth-server-apps', clientEndpoint] as const,
  openidConfiguration: (projectRef: string | undefined) =>
    ['projects', projectRef, 'oauth-server-openid-configuration'] as const,
}
