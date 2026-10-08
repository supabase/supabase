import { URL_SIGNING_KEY_ALGORITHMS, URL_SIGNING_KEY_KIND } from './UrlSigningKeys.constants'
import type { UrlSigningKeyAlgorithm } from '@/data/storage/url-signing-key-create-mutation'
import type { UrlSigningKey } from '@/data/storage/url-signing-keys-query'

/**
 * Splits storage JWKs into the groups shown in the UI. Keys of other kinds are ignored.
 *
 * - `signingKey`: the one key used to sign new URLs
 * - `standbyKeys`: not used for signing, but still validate URLs they signed
 * - `revokedKeys`: no longer validate any URL
 */
export const groupUrlSigningKeys = (keys: UrlSigningKey[]) => {
  const urlSigningKeys = keys.filter(
    (key) => key.kind === URL_SIGNING_KEY_KIND.SIGNING || key.kind === URL_SIGNING_KEY_KIND.STANDBY
  )

  return {
    signingKey: urlSigningKeys.find(
      (key) => key.active && key.kind === URL_SIGNING_KEY_KIND.SIGNING
    ),
    standbyKeys: urlSigningKeys.filter(
      (key) => key.active && key.kind === URL_SIGNING_KEY_KIND.STANDBY
    ),
    revokedKeys: urlSigningKeys.filter((key) => !key.active),
  }
}

export const getUrlSigningKeyStatusLabel = (key: UrlSigningKey) => {
  if (!key.active) return 'Revoked'
  if (key.kind === URL_SIGNING_KEY_KIND.SIGNING) return 'Signing'
  return 'Standby'
}

const isUrlSigningKeyAlgorithm = (type: string): type is UrlSigningKeyAlgorithm =>
  Object.hasOwn(URL_SIGNING_KEY_ALGORITHMS, type)

export const getUrlSigningKeyAlgorithmLabel = (type: string) =>
  isUrlSigningKeyAlgorithm(type) ? URL_SIGNING_KEY_ALGORITHMS[type].label : type
