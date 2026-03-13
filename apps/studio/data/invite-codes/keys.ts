export const inviteCodeKeys = {
  list: (projectRef: string | undefined, clientEndpoint: string | undefined, projectId?: string | undefined) =>
    ['projects', projectRef, 'invite-codes', clientEndpoint, projectId] as const,
}
