import type { UrlSigningKeyAlgorithm } from '@/data/storage/url-signing-key-create-mutation'
import { DOCS_URL } from '@/lib/constants'

export const URL_SIGNING_KEY_KIND = {
  SIGNING: 'storage-url-signing-key',
  STANDBY: 'storage-url-standby-key',
} as const

export const URL_SIGNING_KEYS_PAGE = {
  displayName: 'URL Signing Keys',
  description: 'Keys that sign and validate signed URLs for private objects',
  // TODO: point to the dedicated URL signing keys guide once it's published
  docsUrl: `${DOCS_URL}/guides/storage/serving/downloads#signing-urls`,
}

export const URL_SIGNING_KEY_ALGORITHMS: Record<
  UrlSigningKeyAlgorithm,
  { label: string; description: string }
> = {
  ES256: {
    label: 'ES256 (ECC)',
    description: 'Asymmetric. Signed URLs can be verified with the public key.',
  },
  HS512: {
    label: 'HS512 (Shared secret)',
    description: 'Symmetric. Only Supabase Storage can verify signed URLs.',
  },
}

export const DEFAULT_URL_SIGNING_KEY_ALGORITHM: UrlSigningKeyAlgorithm = 'ES256'
