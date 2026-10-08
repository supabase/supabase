import { describe, expect, it } from 'vitest'

import {
  getUrlSigningKeyAlgorithmLabel,
  getUrlSigningKeyStatusLabel,
  groupUrlSigningKeys,
} from './UrlSigningKeys.utils'

const signing = { kid: 'signing', kind: 'storage-url-signing-key', type: 'ES256', active: true }
const standby = { kid: 'standby', kind: 'storage-url-standby-key', type: 'HS512', active: true }
const revoked = { kid: 'revoked', kind: 'storage-url-standby-key', type: 'HS512', active: false }

describe('groupUrlSigningKeys', () => {
  it('groups keys by kind and active state', () => {
    expect(groupUrlSigningKeys([revoked, standby, signing])).toEqual({
      signingKey: signing,
      standbyKeys: [standby],
      revokedKeys: [revoked],
    })
  })

  it('ignores keys that are not URL signing keys', () => {
    const other = { kid: 'other', kind: 'something-else', type: 'ES256', active: false }
    expect(groupUrlSigningKeys([signing, other])).toEqual({
      signingKey: signing,
      standbyKeys: [],
      revokedKeys: [],
    })
  })

  it('returns empty groups when there are no keys', () => {
    expect(groupUrlSigningKeys([])).toEqual({
      signingKey: undefined,
      standbyKeys: [],
      revokedKeys: [],
    })
  })
})

describe('getUrlSigningKeyStatusLabel', () => {
  it('labels keys by kind and active state', () => {
    expect(getUrlSigningKeyStatusLabel(signing)).toBe('Signing')
    expect(getUrlSigningKeyStatusLabel(standby)).toBe('Standby')
    expect(getUrlSigningKeyStatusLabel(revoked)).toBe('Revoked')
  })
})

describe('getUrlSigningKeyAlgorithmLabel', () => {
  it('returns a readable label for known algorithms', () => {
    expect(getUrlSigningKeyAlgorithmLabel('ES256')).toBe('ES256 (ECC)')
    expect(getUrlSigningKeyAlgorithmLabel('HS512')).toBe('HS512 (Shared secret)')
  })

  it('falls back to the raw type for unknown algorithms', () => {
    expect(getUrlSigningKeyAlgorithmLabel('RS256')).toBe('RS256')
  })
})
