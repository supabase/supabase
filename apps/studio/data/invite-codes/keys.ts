export const inviteCodeKeys = {
  list: (projectRef: string | undefined, clientEndpoint: string | undefined) =>
    ['projects', projectRef, 'invite-codes', clientEndpoint] as const,
}
