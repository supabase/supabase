import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/project/$ref/settings/dashboard'
import { renderRoute } from '@/tests/lib/route-render'

const { mockIsPlatform, mockUseFlag } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
  mockUseFlag: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    useFlag: mockUseFlag,
  }
})

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

vi.mock('@/components/interfaces/Settings/General/DashboardPreferences', () => ({
  DashboardPreferences: () => <div>DashboardPreferences</div>,
}))

const renderDashboardSettings = () =>
  renderRoute(Route, {
    routeId: '/project/$ref/settings/dashboard',
    url: '/project/default/settings/dashboard',
  })

describe('/project/$ref/settings/dashboard', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockUseFlag.mockReturnValue(true)
  })

  it('renders only query preferences on platform', async () => {
    await renderDashboardSettings()

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('DashboardPreferences')).toBeInTheDocument()
    expect(screen.queryByText('Edits')).not.toBeInTheDocument()
  })

  it('redirects self-hosted visits to account preferences', async () => {
    mockIsPlatform.value = false

    const { router } = await renderDashboardSettings()

    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/account/me'))
    expect(router.state.location.hash).toBe('dashboard')

    expect(screen.queryByText('DashboardPreferences')).not.toBeInTheDocument()
  })
})
