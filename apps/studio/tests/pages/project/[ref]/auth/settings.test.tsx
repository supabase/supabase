import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AuthSettingsPage from '@/pages/project/[ref]/auth/settings'

const { mockIsPlatform, mockUseDeploymentMode } = vi.hoisted(() => ({
  mockIsPlatform: { value: false },
  mockUseDeploymentMode: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

vi.mock('@/hooks/misc/useDeploymentMode', () => ({
  useDeploymentMode: mockUseDeploymentMode,
}))

vi.mock('@/components/layouts/DefaultLayout', () => ({
  __esModule: true,
  DefaultLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/AuthLayout/AuthLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

describe('/project/[ref]/auth/settings', () => {
  beforeEach(() => {
    mockIsPlatform.value = false
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: false,
      isCli: false,
      isSelfHosted: false,
    })
  })

  it('renders null on platform', () => {
    mockIsPlatform.value = true
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: true,
      isCli: false,
      isSelfHosted: false,
    })

    const { container } = render(<AuthSettingsPage dehydratedState={{}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the CLI admonition when in CLI mode', () => {
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: false,
      isCli: true,
      isSelfHosted: false,
    })

    render(<AuthSettingsPage dehydratedState={{}} />)

    expect(screen.getByText('Local development with the Supabase CLI')).toBeInTheDocument()
    expect(screen.queryByText('Self-hosted Supabase')).not.toBeInTheDocument()
  })

  it('renders the self-hosted admonition when in self-hosted mode', () => {
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: false,
      isCli: false,
      isSelfHosted: true,
    })

    render(<AuthSettingsPage dehydratedState={{}} />)

    expect(screen.getByText('Self-hosted Supabase')).toBeInTheDocument()
    expect(screen.queryByText('Local development with the Supabase CLI')).not.toBeInTheDocument()
  })
})
