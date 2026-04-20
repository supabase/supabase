import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PreferencesPage from '@/pages/account/me'

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

vi.mock('@/components/interfaces/Account/Preferences/AccountIdentities', () => ({
  AccountIdentities: () => <div>AccountIdentities</div>,
}))

vi.mock('@/components/interfaces/Account/Preferences/AccountConnections', () => ({
  AccountConnections: () => <div>AccountConnections</div>,
}))

vi.mock('@/components/interfaces/Account/Preferences/ThemeSettings', () => ({
  ThemeSettings: () => <div>ThemeSettings</div>,
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
    expect(screen.getByText('AccountIdentities')).toBeInTheDocument()
    expect(screen.getByText('AccountConnections')).toBeInTheDocument()
    expect(screen.getByText('ThemeSettings')).toBeInTheDocument()
    expect(screen.getByText('HotkeySettings')).toBeInTheDocument()
    expect(screen.getByText('DashboardSettings')).toBeInTheDocument()
    expect(screen.getByText('AnalyticsSettings')).toBeInTheDocument()
    expect(screen.getByText('AccountDeletion')).toBeInTheDocument()
  })

  it('renders only local preferences on self-hosted', () => {
    mockIsPlatform.value = false

    render(<PreferencesPage dehydratedState={{}} />)

    expect(screen.getByText('ThemeSettings')).toBeInTheDocument()
    expect(screen.getByText('HotkeySettings')).toBeInTheDocument()
    expect(screen.getByText('DashboardSettings')).toBeInTheDocument()
    expect(screen.queryByText('ProfileInformation')).not.toBeInTheDocument()
    expect(screen.queryByText('AccountIdentities')).not.toBeInTheDocument()
    expect(screen.queryByText('AccountConnections')).not.toBeInTheDocument()
    expect(screen.queryByText('AnalyticsSettings')).not.toBeInTheDocument()
    expect(screen.queryByText('AccountDeletion')).not.toBeInTheDocument()
    expect(mockUseProfile).not.toHaveBeenCalled()
  })
})
