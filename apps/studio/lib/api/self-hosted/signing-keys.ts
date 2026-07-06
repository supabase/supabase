import { components } from 'api-types'

import { assertSelfHosted } from './util'

type SigningKeyResponse = components['schemas']['SigningKeyResponse']

const LEGACY_KEY_ID = '00000000-0000-0000-0000-000000000000'
const LEGACY_KEY_CREATED_AT = '1970-01-01T00:00:00.000Z'

/**
 * Returns a synthetic legacy signing key entry representing the symmetric
 * `AUTH_JWT_SECRET` so the Legacy JWT Secret page can render with the
 * "secret has been migrated" state on self-hosted.
 *
 * The asymmetric signing-key lifecycle (create/rotate/revoke) is not
 * supported here — those endpoints remain unmocked, and the JWT Signing
 * Keys page renders a docs-pointing admonition instead of a table.
 *
 * _Only call this from server-side self-hosted code._
 */
export function getLegacySigningKey(): SigningKeyResponse {
  assertSelfHosted()

  return {
    id: LEGACY_KEY_ID,
    algorithm: 'HS256',
    status: 'in_use',
    created_at: LEGACY_KEY_CREATED_AT,
    updated_at: LEGACY_KEY_CREATED_AT,
  }
}
