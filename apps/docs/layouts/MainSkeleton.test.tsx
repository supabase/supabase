// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import * as currentNavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { useDocsLayoutV2 } from '~/features/DocsLayout/useDocsLayoutV2'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SidebarSkeleton } from './MainSkeleton'
import { RightRailPortal } from './RightRail'

// common reads matchMedia on import, and the radix scroll area needs ResizeObserver. jsdom has neither
vi.hoisted(() => {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

const { TopNavBarStub, Passthrough } = vi.hoisted(() => ({
  TopNavBarStub: () => null,
  Passthrough: ({ children }: PropsWithChildren) => <>{children}</>,
}))

const railContent = <RightRailPortal>page toc</RightRailPortal>

vi.mock('~/features/DocsLayout/useDocsLayoutV2', () => ({ useDocsLayoutV2: vi.fn() }))
vi.mock('~/features/IaNav', () => ({
  useDocsPathname: () => '/',
  useNavItems: () => currentNavItems,
}))
vi.mock('next/navigation', () => ({ usePathname: () => '/' }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))
vi.mock('~/components/Navigation/NavigationMenu/TopNavBar', () => ({
  DesktopTopNavBar: TopNavBarStub,
  MobileTopNavBar: TopNavBarStub,
}))
vi.mock('~/components/Navigation/NavigationMenu/TopNavBar.legacy', () => ({
  LegacyTopNavBar: TopNavBarStub,
}))
vi.mock('~/components/Navigation/NavigationMenu/NavigationMenu', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: () => null,
}))
vi.mock('~/components/Navigation/NavigationMenu/DocsSidebarNav', () => ({
  DocsSidebarNav: Passthrough,
  DocsSidebarNavProvider: ({ menuId, children }: PropsWithChildren<{ menuId?: string }>) => (
    <div data-menu-id={menuId ?? 'none'}>{children}</div>
  ),
  DocsSidebarNavTop: () => null,
  DocsSidebarResources: () => null,
}))

describe('SidebarSkeleton', () => {
  afterEach(cleanup)

  it('opens the docs home sidebar on no product in the new layout', () => {
    vi.mocked(useDocsLayoutV2).mockReturnValue(true)

    const { container } = render(<SidebarSkeleton hideSideNav>home</SidebarSkeleton>)

    expect(container.querySelector('[data-menu-id]')?.getAttribute('data-menu-id')).toBe('none')
  })

  it('moves the rail content into the rail only in the new layout', () => {
    vi.mocked(useDocsLayoutV2).mockReturnValue(false)
    const { container, rerender } = render(
      <SidebarSkeleton hasRightRail>{railContent}</SidebarSkeleton>
    )
    expect(container.querySelector('[data-docs-right-rail]')?.textContent).toBe('')

    vi.mocked(useDocsLayoutV2).mockReturnValue(true)
    rerender(<SidebarSkeleton hasRightRail>{railContent}</SidebarSkeleton>)
    expect(container.querySelector('[data-docs-right-rail]')?.textContent).toBe('page toc')
  })
})
