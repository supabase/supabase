import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PauseProjectButton } from './PauseProjectButton'
import { customRender } from '@/tests/lib/custom-render'

const {
  mockUseAsyncCheckPermissions,
  mockUseCheckEntitlements,
  mockUseIsHighAvailability,
  mockUseSelectedOrganizationQuery,
  mockUseSelectedProjectQuery,
} = vi.hoisted(() => ({
  mockUseAsyncCheckPermissions: vi.fn(),
  mockUseCheckEntitlements: vi.fn(),
  mockUseIsHighAvailability: vi.fn(),
  mockUseSelectedOrganizationQuery: vi.fn(),
  mockUseSelectedProjectQuery: vi.fn(),
}))

vi.mock('@/hooks/misc/useCheckEntitlements', () => ({
  useCheckEntitlements: mockUseCheckEntitlements,
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: mockUseSelectedOrganizationQuery,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useIsHighAvailability: mockUseIsHighAvailability,
  useIsProjectActive: () => true,
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

describe('PauseProjectButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true })
    mockUseCheckEntitlements.mockReturnValue({ hasAccess: true })
    mockUseSelectedOrganizationQuery.mockReturnValue({ data: { plan: { id: 'free' } } })
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { ref: 'default', status: 'ACTIVE_HEALTHY' },
    })
    mockUseIsHighAvailability.mockReturnValue(false)
  })

  it('enables pausing for an active project that is not High Availability', () => {
    customRender(<PauseProjectButton />)

    expect(screen.getByRole('button', { name: 'Pause project' })).toBeEnabled()
  })

  it('disables pausing with a tooltip on High Availability projects', async () => {
    mockUseIsHighAvailability.mockReturnValue(true)
    customRender(<PauseProjectButton />)

    const button = screen.getByRole('button', { name: 'Pause project' })
    expect(button).toBeDisabled()

    // Radix opens the tooltip on pointermove; userEvent does not synthesize
    // pointer events on disabled buttons
    fireEvent.pointerMove(button)
    expect(
      await screen.findAllByText(
        'Pausing is unavailable on High Availability projects',
        {},
        { timeout: 2000 }
      )
    ).not.toHaveLength(0)
  })
})
