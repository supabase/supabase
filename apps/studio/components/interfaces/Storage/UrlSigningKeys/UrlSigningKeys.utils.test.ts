import { describe, expect, it } from 'vitest'

import { getUrlSigningKeyAlgorithmLabel, groupUrlSigningKeys } from './UrlSigningKeys.utils'

const active = { kid: 'active', kind: 'storage-url-signing-key', type: 'ES256', active: true }
const standby = { kid: 'standby', kind: 'storage-url-standby-key', type: 'HS512', active: true }
const revoked = { kid: 'revoked', kind: 'storage-url-standby-key', type: 'HS512', active: false }

describe('groupUrlSigningKeys', () => {
  it('separates the active key from standby and revoked keys', () => {
    expect(groupUrlSigningKeys([revoked, standby, active])).toEqual({
      activeKey: active,
      standbyKeys: [standby],
      revokedKeys: [revoked],
    })
  })

  it('does not treat non-revoked standby keys as the active key', () => {
    expect(groupUrlSigningKeys([standby]).activeKey).toBeUndefined()
  })

  it('ignores keys that are not URL signing keys', () => {
    const other = { kid: 'other', kind: 'something-else', type: 'ES256', active: false }
    expect(groupUrlSigningKeys([active, other])).toEqual({
      activeKey: active,
      standbyKeys: [],
      revokedKeys: [],
    })
  })

  it('returns empty groups when there are no keys', () => {
    expect(groupUrlSigningKeys([])).toEqual({
      activeKey: undefined,
      standbyKeys: [],
      revokedKeys: [],
    })
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
