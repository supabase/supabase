import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/_app/account/me'
import { renderRoute } from '@/tests/lib/route-render'

const { mockIsPlatform, mockUseIsFeatureEnabled, mockUseProfile } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
  mockUseIsFeatureEnabled: vi.fn(),
  mockUseProfile: vi.fn(),
}))

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

const renderPreferences = (url = '/account/me') =>
  renderRoute(Route, { routeId: '/_app/account/me', url })

describe('/account/me', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
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

  it('renders hosted account sections on platform', async () => {
    mockIsPlatform.value = true

    await renderPreferences()

    expect(screen.getByText('ProfileInformation')).toBeInTheDocument()
    expect(screen.getByText('AccountConnections')).toBeInTheDocument()
    expect(screen.getByText('ThemeSettings')).toBeInTheDocument()
    expect(screen.getByText('TimezoneSettings')).toBeInTheDocument()
    expect(screen.getByText('HotkeySettings')).toBeInTheDocument()
    expect(screen.getByText('DashboardSettings')).toBeInTheDocument()
    expect(screen.getByText('AnalyticsSettings')).toBeInTheDocument()
    expect(screen.getByText('AccountDeletion')).toBeInTheDocument()
  })

  it.each([
    '/account/me',
    '/account/me#dashboard',
    '/account/me#type=recovery',
    '/account/me#access_token=test-access&refresh_token=test-refresh&type=email_change',
  ])('keeps an ordinary Preferences visit at %s', async (url) => {
    const { router } = await renderPreferences(url)
    expect(router.state.location.pathname).toBe('/account/me')
  })

  it('renders only local preferences on self-hosted', async () => {
    mockIsPlatform.value = false

    await renderPreferences()

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
