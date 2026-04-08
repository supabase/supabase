import { render, screen, waitFor } from '@testing-library/react'
import type { PropsWithChildren, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AccountLayout from './AccountLayout'

const { mockRouter, mockRegisterOpenMenu, mockSetMobileSheetContent } = vi.hoisted(() => ({
  mockRouter: {
    pathname: '/account/me',
    push: vi.fn(),
  },
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

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

vi.mock('next/head', async () => {
  const React = await import('react')

  const Head = ({ children }: { children?: ReactNode }) => {
    React.useEffect(() => {
      const titleElement = React.Children.toArray(children).find(
        (child) => React.isValidElement(child) && child.type === 'title'
      )

      if (!React.isValidElement(titleElement)) return

      const titleText = React.Children.toArray(titleElement.props.children).join('')
      document.title = titleText
    }, [children])

    return null
  }

  return { default: Head }
})

vi.mock('@/hooks/custom-content/useCustomContent', () => ({
  useCustomContent: () => ({ appTitle: 'Supabase' }),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => false,
}))

vi.mock('@/hooks/misc/useLocalStorage', () => ({
  useLocalStorageQuery: () => [''],
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

vi.mock('ui', () => ({
  cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' '),
}))

describe('AccountLayout (self-hosted)', () => {
  beforeEach(() => {
    mockRouter.pathname = '/account/me'
    mockRouter.push.mockReset()
    mockRegisterOpenMenu.mockReset()
    mockSetMobileSheetContent.mockReset()
    document.title = ''
  })

  it('keeps /account/me available and shows only the Preferences link', async () => {
    render(
      <AccountLayout title="Preferences">
        <div>Preferences page</div>
      </AccountLayout>
    )

    await waitFor(() => {
      expect(document.title).toBe('Preferences | Supabase')
    })

    expect(screen.getByText('Preferences')).toBeInTheDocument()
    expect(screen.queryByText('Access Tokens')).not.toBeInTheDocument()
    expect(screen.queryByText('Account Settings')).not.toBeInTheDocument()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('redirects unsupported account routes back to the project dashboard', async () => {
    mockRouter.pathname = '/account/tokens'

    render(
      <AccountLayout title="Preferences">
        <div>Unsupported</div>
      </AccountLayout>
    )

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/project/default')
    })
  })
})
