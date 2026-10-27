import type { Factor } from '@supabase/supabase-js'

export const MFA_SUPPORT_EMAIL_HREF = `mailto:support@supabase.com?subject=${encodeURIComponent('Unable to sign in via MFA')}`

type FactorWithName = Pick<Factor, 'friendly_name'> | null | undefined

/**
 * Returns the user-provided name of a TOTP factor, or `undefined` if it has none.
 *
 * The name is a free-text label chosen at enrollment time. It does not identify which
 * authenticator app actually generates the codes.
 */
export function getFactorFriendlyName(factor: FactorWithName): string | undefined {
  const name = factor?.friendly_name?.trim()
  return name && name.length > 0 ? name : undefined
}

export function getFactorDisplayName(factor: FactorWithName): string {
  return getFactorFriendlyName(factor) ?? 'your authenticator app'
}
