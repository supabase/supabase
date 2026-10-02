import { JWK_KIND_STORAGE_URL_SIGNING } from './constants'

export const JWK_KID_SEPARATOR = '_'

const LEGACY_URL_SIGNING_KID_PREFIX = `${JWK_KIND_STORAGE_URL_SIGNING}${JWK_KID_SEPARATOR}`

/**
 * Strips a legacy "<kind>_" prefix, but only for the (pre-existing) signing kind - other kids
 * (custom addJwk kinds, standby kids, or the current bare-id format) are returned unchanged.
 */
export function normalizeUrlSigningKid(kid: string): string {
  return kid.startsWith(LEGACY_URL_SIGNING_KID_PREFIX)
    ? kid.slice(LEGACY_URL_SIGNING_KID_PREFIX.length)
    : kid
}
