import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from '@/pages/project/[ref]/settings/dashboard'

const { mockIsPlatform, mockRouter, mockUseFlag } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
  mockRouter: {
    replace: vi.fn(),
  },
  mockUseFlag: vi.fn(),
}))

vi.mock('common', () => ({
  useFlag: mockUseFlag,
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

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

vi.mock('@/components/layouts/DefaultLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/ProjectSettingsLayout/SettingsLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/interfaces/Settings/General/DashboardPreferences', () => ({
  DashboardPreferences: () => <div>DashboardPreferences</div>,
}))

describe('/project/[ref]/settings/dashboard', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockUseFlag.mockReturnValue(true)
    mockRouter.replace.mockReset()
  })

  it('renders only query preferences on platform', () => {
    render(<DashboardPage dehydratedState={{}} />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('DashboardPreferences')).toBeInTheDocument()
    expect(screen.queryByText('Edits')).not.toBeInTheDocument()
  })

  it('redirects self-hosted visits to account preferences', async () => {
    mockIsPlatform.value = false

    render(<DashboardPage dehydratedState={{}} />)

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/account/me#dashboard')
    })

    expect(screen.queryByText('DashboardPreferences')).not.toBeInTheDocument()
  })
})
