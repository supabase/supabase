// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import * as currentNavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { useDocsLayoutV2 } from '~/features/DocsLayout/useDocsLayoutV2'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SidebarSkeleton } from './MainSkeleton'

interface TopNavBarStubProps {
  onMenuToggle?: () => void
}

interface SidebarNavProviderStubProps extends PropsWithChildren {
  hasSectionMenu: boolean
}

// common reads matchMedia on import, and jsdom has none
vi.hoisted(() => {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

const { TopNavBarStub, Passthrough, SidebarNavProviderStub } = vi.hoisted(() => ({
  TopNavBarStub: ({ onMenuToggle }: TopNavBarStubProps) => (
    <p>{onMenuToggle ? 'sidebar menu' : 'global menu'}</p>
  ),
  Passthrough: ({ children }: PropsWithChildren) => <>{children}</>,
  SidebarNavProviderStub: ({ hasSectionMenu, children }: SidebarNavProviderStubProps) => (
    <div data-has-section-menu={hasSectionMenu}>{children}</div>
  ),
}))

vi.mock('~/features/DocsLayout/useDocsLayoutV2', () => ({ useDocsLayoutV2: vi.fn() }))
vi.mock('~/features/IaNav', () => ({ useNavItems: () => currentNavItems }))
vi.mock('next/navigation', () => ({ usePathname: () => '/' }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))
vi.mock('~/components/Navigation/NavigationMenu/TopNavBar', () => ({
  default: TopNavBarStub,
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
  DocsSidebarNavProvider: SidebarNavProviderStub,
  DocsSidebarNavTop: () => null,
  DocsSidebarResources: () => null,
}))

describe('SidebarSkeleton', () => {
  afterEach(cleanup)

  it.each([false, true])('hides the docs home sidebar and opens the global menu', (isLayoutV2) => {
    vi.mocked(useDocsLayoutV2).mockReturnValue(isLayoutV2)

    const { container } = render(<SidebarSkeleton hideSideNav>home</SidebarSkeleton>)

    expect(container.querySelector('[aria-labelledby="main-nav-title"]')).toBeNull()
    expect(screen.getByText('global menu')).toBeTruthy()
  })

  it('opens the sidebar on the section list for a page with a right rail', () => {
    vi.mocked(useDocsLayoutV2).mockReturnValue(true)

    const { container } = render(<SidebarSkeleton rightRail="on this page">page</SidebarSkeleton>)

    expect(container.querySelector('[data-has-section-menu="false"]')).not.toBeNull()
  })

  it('renders the right rail only in the new layout', () => {
    vi.mocked(useDocsLayoutV2).mockReturnValue(false)
    const { rerender } = render(<SidebarSkeleton rightRail="on this page">page</SidebarSkeleton>)
    expect(screen.queryByText('on this page')).toBeNull()

    vi.mocked(useDocsLayoutV2).mockReturnValue(true)
    rerender(<SidebarSkeleton rightRail="on this page">page</SidebarSkeleton>)
    expect(screen.getByText('on this page')).toBeTruthy()
  })
})
