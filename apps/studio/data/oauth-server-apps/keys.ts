export const oauthServerAppKeys = {
  // temporaryApiKey has to be added to reset the query when it changes
  list: (projectRef: string | undefined, temporaryApiKey: string | undefined) =>
    ['projects', projectRef, 'oauth-server-apps', temporaryApiKey] as const,
}
