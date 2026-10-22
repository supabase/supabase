import { describe, expect, it } from 'vitest'

import { getUrlSigningKeyAlgorithmLabel, groupUrlSigningKeys } from './UrlSigningKeys.utils'

const active = { kid: 'active', kind: 'storage-url-signing-key', type: 'EC', active: true }
const standby = { kid: 'standby', kind: 'storage-url-standby-key', type: 'oct', active: true }
const revoked = { kid: 'revoked', kind: 'storage-url-standby-key', type: 'oct', active: false }

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
    const other = { kid: 'other', kind: 'something-else', type: 'EC', active: false }
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
    expect(getUrlSigningKeyAlgorithmLabel('EC')).toBe('ES256 (ECC)')
    expect(getUrlSigningKeyAlgorithmLabel('oct')).toBe('HS512 (Shared secret)')
  })

  it('falls back to the raw type for unknown algorithms', () => {
    expect(getUrlSigningKeyAlgorithmLabel('RSA')).toBe('RSA')
  })
})
