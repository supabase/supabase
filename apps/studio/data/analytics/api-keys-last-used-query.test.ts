import { describe, expect, test } from 'vitest'

import { apiKeysLastUsedSchema, getJWTSigningKeyLastUsedAt } from './api-keys-last-used-query'

describe('apiKeysLastUsedSchema', () => {
  test('normalizes legacy API key and JWT signing key fields from the live endpoint', () => {
    const rows = apiKeysLastUsedSchema.parse([
      {
        request_sb_apikey_apikey_hash: '',
        request_sb_apikey_apikey_prefix: '',
        request_sb_jwt_authorization_payload_algorithm: 'HS256',
        request_sb_jwt_authorization_payload_key_id: '',
        request_sb_jwt_authorization_payload_role: 'anon',
        request_sb_jwt_authorization_payload_signature_prefix: 'legacy-signature',
        timestamp: 100,
      },
      {
        request_sb_apikey_apikey_hash: '',
        request_sb_apikey_apikey_prefix: '',
        request_sb_jwt_authorization_payload_algorithm: 'RS256',
        request_sb_jwt_authorization_payload_key_id: 'signing-key-id',
        request_sb_jwt_authorization_payload_role: 'authenticated',
        request_sb_jwt_authorization_payload_signature_prefix: '',
        timestamp: 200,
      },
      {
        request_sb_jwt_authorization_payload_key_id: 'signing-key-id',
        request_sb_jwt_authorization_payload_role: 'service_role',
        timestamp: 300,
      },
    ])

    expect(rows).toEqual([
      {
        role: 'anon',
        signaturePrefix: 'legacy-signature',
        timestamp: 100,
      },
      {
        keyId: 'signing-key-id',
        role: 'authenticated',
        timestamp: 200,
      },
      {
        keyId: 'signing-key-id',
        role: 'service_role',
        timestamp: 300,
      },
    ])

    expect(getJWTSigningKeyLastUsedAt(rows, 'signing-key-id')).toBe(300)
  })
})
