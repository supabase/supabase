import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PreferencesPage from '@/pages/account/me'

const { mockIsPlatform, mockUseIsFeatureEnabled, mockUseProfile, mockRouter } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
  mockUseIsFeatureEnabled: vi.fn(),
  mockUseProfile: vi.fn(),
  mockRouter: { asPath: '/account/me', query: {}, replace: vi.fn() },
}))

vi.mock('next/router', () => ({ useRouter: () => mockRouter }))

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseIsFeatureEnabled,
}))

vi.mock('@/lib/profile', () => ({
  useProfile: mockUseProfile,
}))

vi.mock('@/components/layouts/AccountLayout/AccountLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/AppLayout/AppLayout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/DefaultLayout', () => ({
  DefaultLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/interfaces/Account/Preferences/ProfileInformation', () => ({
  ProfileInformation: () => <div>ProfileInformation</div>,
}))

vi.mock('@/components/interfaces/Account/Preferences/AccountConnections', () => ({
  AccountConnections: () => <div>AccountConnections</div>,
}))

vi.mock('@/components/interfaces/Account/Preferences/ThemeSettings', () => ({
  ThemeSettings: () => <div>ThemeSettings</div>,
}))

vi.mock('@/components/interfaces/Account/Preferences/TimezoneSettings', () => ({
  TimezoneSettings: () => <div>TimezoneSettings</div>,
}))

vi.mock('@/components/interfaces/Account/Preferences/HotkeySettings', () => ({
  HotkeySettings: () => <div>HotkeySettings</div>,
}))

vi.mock('@/components/interfaces/Account/Preferences/DashboardSettings', () => ({
  DashboardSettings: () => <div>DashboardSettings</div>,
}))

vi.mock('@/components/interfaces/Account/Preferences/AnalyticsSettings', () => ({
  AnalyticsSettings: () => <div>AnalyticsSettings</div>,
}))

vi.mock('@/components/interfaces/Account/Preferences/AccountDeletion', () => ({
  AccountDeletion: () => <div>AccountDeletion</div>,
}))

vi.mock('@/components/ui/AlertError', () => ({
  AlertError: () => <div>AlertError</div>,
}))

describe('/account/me', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockRouter.asPath = '/account/me'
    mockRouter.query = {}
    mockRouter.replace.mockReset()
    mockRouter.replace.mockResolvedValue(true)
    mockUseIsFeatureEnabled.mockClear()
    mockUseProfile.mockClear()
    mockUseIsFeatureEnabled.mockReturnValue({
      profileShowInformation: true,
      profileShowAnalyticsAndMarketing: true,
      profileShowAccountDeletion: true,
    })
    mockUseProfile.mockReturnValue({
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
    })
  })

  it('renders hosted account sections on platform', () => {
    mockIsPlatform.value = true

    render(<PreferencesPage dehydratedState={{}} />)

    expect(screen.getByText('ProfileInformation')).toBeInTheDocument()
    expect(screen.getByText('AccountConnections')).toBeInTheDocument()
    expect(screen.getByText('ThemeSettings')).toBeInTheDocument()
    expect(screen.getByText('TimezoneSettings')).toBeInTheDocument()
    expect(screen.getByText('HotkeySettings')).toBeInTheDocument()
    expect(screen.getByText('DashboardSettings')).toBeInTheDocument()
    expect(screen.getByText('AnalyticsSettings')).toBeInTheDocument()
    expect(screen.getByText('AccountDeletion')).toBeInTheDocument()
  })

  it('forwards a legacy confirmation message to Security with its query and fragment intact', () => {
    const hash = 'message=Confirmation+link+accepted.+Confirm+the+other+email&sb='
    mockRouter.asPath = `/account/me?keep=yes#${hash}`
    mockRouter.query = { keep: 'yes' }

    render(<PreferencesPage dehydratedState={{}} />)

    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/account/security',
      query: { keep: 'yes' },
      hash,
    })
  })

  it('handles a confirmation message that arrives after the first render', () => {
    const { rerender } = render(<PreferencesPage dehydratedState={{}} />)
    expect(mockRouter.replace).not.toHaveBeenCalled()

    mockRouter.asPath = '/account/me#message=Confirmation+link+accepted&sb='
    rerender(<PreferencesPage dehydratedState={{}} />)

    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/account/security',
      query: {},
      hash: 'message=Confirmation+link+accepted&sb=',
    })
  })

  it.each([
    '/account/me',
    '/account/me#dashboard',
    '/account/me#type=recovery',
    '/account/me#access_token=test-access&refresh_token=test-refresh&type=email_change',
  ])('keeps an ordinary Preferences visit at %s', (asPath) => {
    mockRouter.asPath = asPath
    render(<PreferencesPage dehydratedState={{}} />)
    expect(mockRouter.replace).not.toHaveBeenCalled()
  })

  it('renders only local preferences on self-hosted', () => {
    mockIsPlatform.value = false

    render(<PreferencesPage dehydratedState={{}} />)

    expect(screen.getByText('ThemeSettings')).toBeInTheDocument()
    expect(screen.getByText('TimezoneSettings')).toBeInTheDocument()
    expect(screen.getByText('HotkeySettings')).toBeInTheDocument()
    expect(screen.getByText('DashboardSettings')).toBeInTheDocument()
    expect(screen.queryByText('ProfileInformation')).not.toBeInTheDocument()
    expect(screen.queryByText('AccountConnections')).not.toBeInTheDocument()
    expect(screen.queryByText('AnalyticsSettings')).not.toBeInTheDocument()
    expect(screen.queryByText('AccountDeletion')).not.toBeInTheDocument()
    expect(mockUseProfile).not.toHaveBeenCalled()
  })
})
