import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router'
import { act, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ProductMenuGroup } from './ProductMenu.types'
import { ProductMenuShortcuts } from './ProductMenuShortcuts'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const { mockUseShortcut } = vi.hoisted(() => ({
  mockUseShortcut: vi.fn(),
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

const renderShortcuts = (items: ProductMenuGroup[]) => {
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ['/'] }),
    parseSearch,
    stringifySearch,
  })
  const view = render(
    <RouterContextProvider router={router}>
      <ProductMenuShortcuts menu={items} />
    </RouterContextProvider>
  )
  return { ...view, router }
}

describe('ProductMenuShortcuts', () => {
  it('registers visible enabled internal shortcut items', () => {
    renderShortcuts(menu)

    expect(mockUseShortcut).toHaveBeenCalledTimes(1)
    expect(mockUseShortcut).toHaveBeenCalledWith(
      SHORTCUT_IDS.NAV_DATABASE_TABLES,
      expect.any(Function),
      { label: undefined }
    )
  })

  it('navigates to the item url when the shortcut fires', async () => {
    const { router } = renderShortcuts(menu)

    const callback = mockUseShortcut.mock.calls[0][1]
    await act(async () => {
      callback()
    })

    await waitFor(() => {
      expect(router.state.location.href).toBe('/project/ref/database/tables')
    })
  })

  it('registers shortcut items nested under childItems', () => {
    renderShortcuts([
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
    ])

    expect(mockUseShortcut).toHaveBeenCalledWith(
      SHORTCUT_IDS.NAV_DATABASE_INDEXES,
      expect.any(Function),
      { label: undefined }
    )
  })
})
