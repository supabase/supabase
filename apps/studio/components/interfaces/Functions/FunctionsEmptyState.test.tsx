import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FunctionsEmptyState } from './FunctionsEmptyState'
import { customRender as render } from '@/tests/lib/custom-render'

const {
  mockIsPlatform,
  mockUseDeploymentMode,
  mockUseSelectedOrganizationQuery,
  mockUseSendEventMutation,
  mockUseIsFeatureEnabled,
} = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
  mockUseDeploymentMode: vi.fn(),
  mockUseSelectedOrganizationQuery: vi.fn(),
  mockUseSendEventMutation: vi.fn(),
  mockUseIsFeatureEnabled: vi.fn(),
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

vi.mock('@/hooks/misc/useDeploymentMode', () => ({
  useDeploymentMode: mockUseDeploymentMode,
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: mockUseSelectedOrganizationQuery,
}))

vi.mock('@/data/telemetry/send-event-mutation', () => ({
  useSendEventMutation: mockUseSendEventMutation,
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseIsFeatureEnabled,
}))

describe('FunctionsEmptyState', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: true,
      isCli: false,
      isSelfHosted: false,
    })
    mockUseSelectedOrganizationQuery.mockReturnValue({ data: { slug: 'org' } })
    mockUseSendEventMutation.mockReturnValue({ mutate: vi.fn() })
    mockUseIsFeatureEnabled.mockReturnValue(false)
  })

  it('renders the templates section on platform', () => {
    render(<FunctionsEmptyState />)

    expect(screen.getByText('Start with a template')).toBeInTheDocument()
  })

  it('hides the templates section on self-hosted (Docker mode)', () => {
    mockIsPlatform.value = false
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: false,
      isCli: false,
      isSelfHosted: true,
    })

    render(<FunctionsEmptyState />)

    expect(screen.queryByText('Start with a template')).not.toBeInTheDocument()
  })

  it('hides the templates section on CLI mode', () => {
    mockIsPlatform.value = false
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: false,
      isCli: true,
      isSelfHosted: false,
    })

    render(<FunctionsEmptyState />)

    expect(screen.queryByText('Start with a template')).not.toBeInTheDocument()
  })

  it('renders the self-hosted manual card when isSelfHosted', () => {
    mockIsPlatform.value = false
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: false,
      isCli: false,
      isSelfHosted: true,
    })

    render(<FunctionsEmptyState />)

    expect(screen.getByText('Self-Hosted')).toBeInTheDocument()
  })
})
