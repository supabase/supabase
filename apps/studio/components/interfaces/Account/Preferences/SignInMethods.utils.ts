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
 * Email unlink is temporarily blocked (control stays visible but disabled): Auth
 * leaves `encrypted_password` after unlinking the email identity, so the UI can
 * claim the password is gone while the old password still works and re-adding
 * fails with "Current password required". Re-enable once Auth clears the
 * password hash on email unlink.
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
