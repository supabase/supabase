/** Whether the user's only way to sign in is a single OAuth provider (no email, phone or SSO). */
export const isSingleOAuthIdentity = ({
  identities,
  email,
}: {
  identities: { provider: string }[]
  email: string | undefined
}): boolean => {
  if (!email || identities.length !== 1) return false

  const { provider } = identities[0]
  return provider !== 'email' && provider !== 'phone' && !provider.startsWith('sso')
}
