import { describe, expect, it } from 'vitest'

import type { GlobalMenuItems } from '../Navigation.types'
import { getMenuGroupLabelByPath } from './NavigationMenu.utils'

const MENU: GlobalMenuItems = [
  [{ label: 'Start', href: '/guides/getting-started' }],
  [
    {
      label: 'Products',
      menuItems: [
        [
          { label: 'Database', href: '/guides/database/overview' },
          { label: 'Auth', href: '/guides/auth' },
        ],
      ],
    },
  ],
  [{ label: 'Hidden', href: '/guides/hidden', enabled: false }],
]

describe('getMenuGroupLabelByPath', () => {
  it('finds the group whose link is the page', () => {
    expect(getMenuGroupLabelByPath({ menu: MENU, pathname: '/guides/getting-started' })).toBe(
      'Start'
    )
  })

  it('finds the group of a page under one of its item links', () => {
    expect(getMenuGroupLabelByPath({ menu: MENU, pathname: '/guides/auth/users' })).toBe('Products')
  })

  it('finds the group of a page that holds one of its item links', () => {
    expect(getMenuGroupLabelByPath({ menu: MENU, pathname: '/guides/database' })).toBe('Products')
  })

  it('does not match a link that only shares a prefix with the page', () => {
    expect(getMenuGroupLabelByPath({ menu: MENU, pathname: '/guides/authx' })).toBeUndefined()
  })

  it('skips a disabled group', () => {
    expect(getMenuGroupLabelByPath({ menu: MENU, pathname: '/guides/hidden' })).toBeUndefined()
  })
})
