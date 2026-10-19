import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PublicationsAvailability } from './PublicationsAvailability'

const { mockUseIsRealtimeUnavailable } = vi.hoisted(() => ({
  mockUseIsRealtimeUnavailable: vi.fn(),
}))

vi.mock('@/hooks/misc/useHighAvailability', () => ({
  useIsRealtimeUnavailable: mockUseIsRealtimeUnavailable,
}))

describe('PublicationsAvailability', () => {
  it('shows the disabled empty state instead of page content when Realtime is unavailable', () => {
    mockUseIsRealtimeUnavailable.mockReturnValue({ isRealtimeUnavailable: true })

    render(
      <PublicationsAvailability>
        <div>Publications content</div>
      </PublicationsAvailability>
    )

    expect(
      screen.getByText('Publications unavailable on High Availability projects')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "We're working to bring publications to High Availability projects. Contact support if this is blocking your work."
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('Publications content')).not.toBeInTheDocument()
  })

  it('renders page content when Realtime is available', () => {
    mockUseIsRealtimeUnavailable.mockReturnValue({ isRealtimeUnavailable: false })

    render(
      <PublicationsAvailability>
        <div>Publications content</div>
      </PublicationsAvailability>
    )

    expect(screen.getByText('Publications content')).toBeInTheDocument()
    expect(
      screen.queryByText('Publications unavailable on High Availability projects')
    ).not.toBeInTheDocument()
  })
})
