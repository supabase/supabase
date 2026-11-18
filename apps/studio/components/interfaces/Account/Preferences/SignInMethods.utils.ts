export const parseRedirectMessage = (asPath: string) =>
  new URLSearchParams(asPath.split('#')[1] ?? '').get('message') ?? undefined

/**
 * Whether to offer creating a password (which creates an email identity) to a user
 * who signs in only through OAuth.
 */
export const shouldShowAddPasswordRow = ({
  identities,
  email,
}: {
  identities: { provider: string }[]
  email: string | undefined
}): boolean => {
  if (!email) return false

  const hasEmailIdentity = identities.some((identity) => identity.provider === 'email')
  const hasSsoIdentity = identities.some((identity) => identity.provider.startsWith('sso'))

  return !hasEmailIdentity && !hasSsoIdentity
}

/**
 * Whether unlinking a linked identity is allowed.
 *
 * Passwords can be changed but not removed. Keep email unlink blocked until
 * email identifiers can be managed independently of password status in Studio:
 * Auth retains the password after unlinking the email identity.
 */
export const canUnlinkIdentity = ({
  provider,
  identityCount,
}: {
  provider: string
  identityCount: number
}): boolean => {
  if (provider === 'email') return false
  return identityCount > 1
}
