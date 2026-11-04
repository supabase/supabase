// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import * as currentNavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { useDocsLayoutV2 } from '~/features/DocsLayout/useDocsLayoutV2'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SidebarSkeleton, TopNavSkeleton } from './MainSkeleton'

interface TopNavBarStubProps {
  onMenuToggle?: () => void
}

// common reads matchMedia on import, and jsdom has none
vi.hoisted(() => {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

const { TopNavBarStub, LegacyTopNavBarStub, Passthrough } = vi.hoisted(() => ({
  TopNavBarStub: ({ onMenuToggle }: TopNavBarStubProps) => (
    <p data-top-bar="v2">{onMenuToggle ? 'sidebar menu' : 'global menu'}</p>
  ),
  LegacyTopNavBarStub: ({ onMenuToggle }: TopNavBarStubProps) => (
    <p data-top-bar="legacy">{onMenuToggle ? 'sidebar menu' : 'global menu'}</p>
  ),
  Passthrough: ({ children }: PropsWithChildren) => <>{children}</>,
}))

vi.mock('~/features/DocsLayout/useDocsLayoutV2', () => ({ useDocsLayoutV2: vi.fn() }))
vi.mock('~/features/IaNav', () => ({ useNavItems: () => currentNavItems }))
vi.mock('next/navigation', () => ({ usePathname: () => '/' }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))
vi.mock('~/components/Navigation/NavigationMenu/TopNavBar', () => ({
  default: TopNavBarStub,
}))
vi.mock('~/components/Navigation/NavigationMenu/TopNavBar.legacy', () => ({
  LegacyTopNavBar: LegacyTopNavBarStub,
}))
vi.mock('~/components/Navigation/NavigationMenu/NavigationMenu', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: () => null,
}))
vi.mock('~/components/Navigation/NavigationMenu/DocsSidebarNav', () => ({
  DocsSidebarNav: Passthrough,
  DocsSidebarNavProvider: Passthrough,
  DocsSidebarNavTop: () => null,
  DocsSidebarResources: () => null,
}))

describe('SidebarSkeleton', () => {
  afterEach(cleanup)

  it.each([false, true])(
    'hides the docs home sidebar and opens the global menu (layout v2: %s)',
    (isLayoutV2) => {
      vi.mocked(useDocsLayoutV2).mockReturnValue(isLayoutV2)

      const { container } = render(<SidebarSkeleton hideSideNav>home</SidebarSkeleton>)

      expect(container.querySelector('[aria-labelledby="main-nav-title"]')).toBeNull()
      expect(screen.getByText('global menu')).toBeTruthy()
    }
  )

  it('renders the right rail only in the new layout', () => {
    vi.mocked(useDocsLayoutV2).mockReturnValue(false)
    const { container, rerender } = render(<SidebarSkeleton hasRightRail>page</SidebarSkeleton>)
    expect(container.querySelector('[data-docs-right-rail]')).toBeNull()

    vi.mocked(useDocsLayoutV2).mockReturnValue(true)
    rerender(<SidebarSkeleton hasRightRail>page</SidebarSkeleton>)
    expect(container.querySelector('[data-docs-right-rail]')).not.toBeNull()
  })
})

describe('TopNavSkeleton', () => {
  afterEach(cleanup)

  it('keeps the legacy top bar on the docs home in the new layout', () => {
    vi.mocked(useDocsLayoutV2).mockReturnValue(true)

    const { container } = render(<TopNavSkeleton>home</TopNavSkeleton>)

    expect(container.querySelector('[data-top-bar="legacy"]')).not.toBeNull()
    expect(container.querySelector('[data-top-bar="v2"]')).toBeNull()
  })
})
