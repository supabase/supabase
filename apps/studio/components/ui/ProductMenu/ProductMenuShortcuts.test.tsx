import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProductMenuGroup } from './ProductMenu.types'
import { ProductMenuShortcuts } from './ProductMenuShortcuts'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const { mockPush, mockUseShortcut } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUseShortcut: vi.fn(),
}))

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('@/state/shortcuts/useShortcut', () => ({
  useShortcut: mockUseShortcut,
}))

const menu: ProductMenuGroup[] = [
  {
    title: 'Visible',
    items: [
      {
        name: 'Tables',
        key: 'tables',
        url: '/project/ref/database/tables',
        shortcutId: SHORTCUT_IDS.NAV_DATABASE_TABLES,
      },
      {
        name: 'Functions',
        key: 'functions',
        url: '/project/ref/database/functions',
        shortcutId: SHORTCUT_IDS.NAV_DATABASE_FUNCTIONS,
        disabled: true,
      },
      {
        name: 'External',
        key: 'external',
        url: 'https://example.com',
        shortcutId: SHORTCUT_IDS.NAV_DATABASE_EXTENSIONS,
        isExternal: true,
      },
      {
        name: 'No shortcut',
        key: 'no-shortcut',
        url: '/project/ref/database/triggers',
      },
    ],
  },
]

describe('ProductMenuShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers visible enabled internal shortcut items', () => {
    render(<ProductMenuShortcuts menu={menu} />)

    expect(mockUseShortcut).toHaveBeenCalledTimes(1)
    expect(mockUseShortcut).toHaveBeenCalledWith(
      SHORTCUT_IDS.NAV_DATABASE_TABLES,
      expect.any(Function)
    )
  })

  it('navigates to the item url when the shortcut fires', () => {
    render(<ProductMenuShortcuts menu={menu} />)

    const callback = mockUseShortcut.mock.calls[0][1]
    callback()

    expect(mockPush).toHaveBeenCalledWith('/project/ref/database/tables')
  })

  it('registers shortcut items nested under childItems', () => {
    render(
      <ProductMenuShortcuts
        menu={[
          {
            title: 'Nested',
            items: [
              {
                name: 'Parent',
                key: 'parent',
                url: '/project/ref/database',
                childItems: [
                  {
                    name: 'Indexes',
                    key: 'indexes',
                    url: '/project/ref/database/indexes',
                    shortcutId: SHORTCUT_IDS.NAV_DATABASE_INDEXES,
                  },
                ],
              },
            ],
          },
        ]}
      />
    )

    expect(mockUseShortcut).toHaveBeenCalledWith(
      SHORTCUT_IDS.NAV_DATABASE_INDEXES,
      expect.any(Function)
    )
  })
})
