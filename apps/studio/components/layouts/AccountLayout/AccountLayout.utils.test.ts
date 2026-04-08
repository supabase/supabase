import { describe, expect, it } from 'vitest'

import { getActiveKey, toSubMenuSections } from './AccountLayout.utils'

describe('toSubMenuSections', () => {
  it('converts sections to SubMenuSection format', () => {
    const sections = [
      {
        key: 'account-settings',
        heading: 'Account Settings',
        links: [
          { key: 'preferences', label: 'Preferences', href: '/account/me', isActive: true },
          {
            key: 'access-tokens',
            label: 'Access Tokens',
            href: '/account/tokens',
            isActive: false,
          },
        ],
      },
    ]
    const result = toSubMenuSections(sections)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      key: 'account-settings',
      heading: 'Account Settings',
      links: [
        { key: 'preferences', label: 'Preferences', href: '/account/me' },
        { key: 'access-tokens', label: 'Access Tokens', href: '/account/tokens' },
      ],
    })
  })

  it('returns empty array for non-array input', () => {
    expect(toSubMenuSections(null as any)).toEqual([])
    expect(toSubMenuSections(undefined as any)).toEqual([])
  })

  it('filters out invalid links', () => {
    const sections = [
      {
        key: 's1',
        links: [
          { key: 'a', label: 'A', href: '/a' },
          null,
          { key: '', label: 'B', href: '/b' },
          { key: 'c', label: null, href: '/c' } as any,
        ],
      },
    ]
    const result = toSubMenuSections(sections)
    expect(result[0].links).toHaveLength(1)
    expect(result[0].links[0]).toEqual({ key: 'a', label: 'A', href: '/a' })
  })

  it('handles missing optional fields', () => {
    const sections = [{ key: 's1', links: [{ key: 'a', label: 'A' }] }]
    const result = toSubMenuSections(sections)
    expect(result[0].links[0].href).toBeUndefined()
    expect(result[0].heading).toBeUndefined()
  })
})

describe('getActiveKey', () => {
  it('returns key of first active link', () => {
    const sections = [
      {
        key: 's1',
        links: [
          { key: 'a', label: 'A', isActive: false },
          { key: 'b', label: 'B', isActive: true },
        ],
      },
    ]
    expect(getActiveKey(sections)).toBe('b')
  })

  it('returns first active across sections', () => {
    const sections = [
      { key: 's1', links: [{ key: 'a', label: 'A', isActive: false }] },
      { key: 's2', links: [{ key: 'b', label: 'B', isActive: true }] },
    ]
    expect(getActiveKey(sections)).toBe('b')
  })

  it('returns undefined when no active link', () => {
    const sections = [{ key: 's1', links: [{ key: 'a', label: 'A', isActive: false }] }]
    expect(getActiveKey(sections)).toBeUndefined()
  })

  it('returns undefined for invalid input', () => {
    expect(getActiveKey(null as any)).toBeUndefined()
    expect(getActiveKey(undefined as any)).toBeUndefined()
    expect(getActiveKey([])).toBeUndefined()
  })

  it('handles missing links array', () => {
    const sections = [{ key: 's1', links: undefined }]
    expect(getActiveKey(sections as any)).toBeUndefined()
  })
})
