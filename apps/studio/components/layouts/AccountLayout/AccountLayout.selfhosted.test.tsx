import { screen, waitFor } from '@testing-library/react'
import type { PropsWithChildren, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AccountLayout from './AccountLayout'
import { customRender } from '@/tests/lib/custom-render'

const { mockRegisterOpenMenu, mockSetMobileSheetContent } = vi.hoisted(() => ({
  mockRegisterOpenMenu: vi.fn(),
  mockSetMobileSheetContent: vi.fn(),
}))

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return {
    ...actual,
    IS_PLATFORM: false,
  }
})

vi.mock('@/hooks/custom-content/useCustomContent', () => ({
  useCustomContent: () => ({ appTitle: 'Supabase' }),
}))

vi.mock('@/hooks/misc/useLocalStorage', () => ({
  useLocalStorageQuery: () => ['', vi.fn(), { isLoading: false, isSuccess: true }],
}))

vi.mock('@/hooks/misc/withAuth', () => ({
  withAuth: <T,>(Component: T) => Component,
}))

vi.mock('@/state/app-state', () => ({
  useAppStateSnapshot: () => ({
    lastRouteBeforeVisitingAccountPage: '',
  }),
}))

vi.mock('../Navigation/NavigationBar/MobileSheetContext', () => ({
  useMobileSheet: () => ({
    setContent: mockSetMobileSheetContent,
    registerOpenMenu: (callback: () => void) => {
      mockRegisterOpenMenu(callback)
      return () => {}
    },
  }),
}))

vi.mock('./WithSidebar', () => ({
  WithSidebar: ({
    sections,
    children,
  }: PropsWithChildren<{
    sections: Array<{
      key: string
      heading?: string
      links: Array<{ key: string; label: string }>
    }>
  }>) => (
    <div>
      <nav>
        {sections.map((section) => (
          <div key={section.key}>
            {section.heading ? <span>{section.heading}</span> : null}
            {section.links.map((link) => (
              <span key={link.key}>{link.label}</span>
            ))}
          </div>
        ))}
      </nav>
      {children}
    </div>
  ),
}))

const renderAccountLayout = (initialUrl: string, children: ReactNode) =>
  customRender(<AccountLayout title="Preferences">{children}</AccountLayout>, { initialUrl })

describe('AccountLayout (self-hosted)', () => {
  beforeEach(() => {
    mockRegisterOpenMenu.mockReset()
    mockSetMobileSheetContent.mockReset()
    document.title = ''
  })

  it('keeps /account/me available and shows only the Preferences link', async () => {
    const { router } = renderAccountLayout('/account/me', <div>Preferences page</div>)

    await waitFor(() => {
      expect(document.title).toBe('Preferences | Supabase')
    })

    expect(screen.getByText('Preferences')).toBeInTheDocument()
    expect(screen.queryByText('Access Tokens')).not.toBeInTheDocument()
    expect(screen.queryByText('Account Settings')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/account/me')
  })

  it('redirects unsupported account routes back to the project dashboard', async () => {
    const { router } = renderAccountLayout('/account/tokens', <div>Unsupported</div>)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/project/default')
    })
  })
})
