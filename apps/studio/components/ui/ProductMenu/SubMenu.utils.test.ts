import { describe, expect, it } from 'vitest'

import { convertSectionsToProductMenu } from './SubMenu.utils'

describe('convertSectionsToProductMenu', () => {
  it('converts sections with heading and links to ProductMenuGroup format', () => {
    const sections = [
      {
        key: 'configuration',
        heading: 'Configuration',
        links: [
          { key: 'general', label: 'General', href: '/org/foo/general' },
          { key: 'security', label: 'Security', href: '/org/foo/security' },
        ],
      },
    ]

    const result = convertSectionsToProductMenu(sections)

    expect(result).toEqual([
      {
        key: 'configuration',
        title: 'Configuration',
        items: [
          { key: 'general', name: 'General', url: '/org/foo/general' },
          { key: 'security', name: 'Security', url: '/org/foo/security' },
        ],
      },
    ])
  })

  it('uses # for undefined href', () => {
    const sections = [
      {
        key: 'config',
        links: [{ key: 'item', label: 'Item' }],
      },
    ]

    const result = convertSectionsToProductMenu(sections)

    expect(result[0].items[0].url).toBe('#')
  })

  it('handles empty sections array', () => {
    const result = convertSectionsToProductMenu([])
    expect(result).toEqual([])
  })

  it('handles section with empty links', () => {
    const sections = [
      {
        key: 'empty',
        heading: 'Empty',
        links: [],
      },
    ]

    const result = convertSectionsToProductMenu(sections)

    expect(result).toEqual([{ key: 'empty', title: 'Empty', items: [] }])
  })

  it('handles section without heading', () => {
    const sections = [
      {
        key: 'no-heading',
        links: [{ key: 'a', label: 'A', href: '/a' }],
      },
    ]

    const result = convertSectionsToProductMenu(sections)

    expect(result[0].title).toBeUndefined()
    expect(result[0].items).toHaveLength(1)
  })

  it('converts multiple sections', () => {
    const sections = [
      { key: 'a', heading: 'A', links: [{ key: 'a1', label: 'A1', href: '/a1' }] },
      { key: 'b', heading: 'B', links: [{ key: 'b1', label: 'B1', href: '/b1' }] },
    ]

    const result = convertSectionsToProductMenu(sections)

    expect(result).toHaveLength(2)
    expect(result[0].key).toBe('a')
    expect(result[1].key).toBe('b')
  })
})
