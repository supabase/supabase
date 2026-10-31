import {
  URL_SIGNING_KEY_ALGORITHMS,
  URL_SIGNING_KEY_KIND,
  URL_SIGNING_KEY_TYPE_ALGORITHMS,
} from './UrlSigningKeys.constants'
import type { UrlSigningKey } from '@/data/storage/url-signing-keys-query'

/**
 * Splits storage JWKs into the groups shown in the UI. Keys of other kinds are ignored.
 *
 * - `activeKey`: the one key that signs new URLs (the API guarantees exactly one)
 * - `standbyKeys`: don't sign new URLs, but still validate the URLs they signed
 * - `revokedKeys`: no longer validate any URL
 *
 * Note that the API's `active` flag means "not revoked", so standby keys are `active: true` too.
 */
export const groupUrlSigningKeys = (keys: UrlSigningKey[]) => {
  const urlSigningKeys = keys.filter(
    (key) => key.kind === URL_SIGNING_KEY_KIND.SIGNING || key.kind === URL_SIGNING_KEY_KIND.STANDBY
  )

  return {
    activeKey: urlSigningKeys.find(
      (key) => key.active && key.kind === URL_SIGNING_KEY_KIND.SIGNING
    ),
    standbyKeys: urlSigningKeys.filter(
      (key) => key.active && key.kind === URL_SIGNING_KEY_KIND.STANDBY
    ),
    revokedKeys: urlSigningKeys.filter((key) => !key.active),
  }
}

/** `type` is the JWK type reported by the API (`EC`, `oct`), not the algorithm name. */
export const getUrlSigningKeyAlgorithmLabel = (type: string) => {
  const algorithm = Object.hasOwn(URL_SIGNING_KEY_TYPE_ALGORITHMS, type)
    ? URL_SIGNING_KEY_TYPE_ALGORITHMS[type]
    : undefined
  return algorithm ? URL_SIGNING_KEY_ALGORITHMS[algorithm].label : type
}
