import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TableRealtimeToggle } from './TableEditor'

describe('TableRealtimeToggle', () => {
  it('disables Realtime and shows the HA-specific description for HA projects', () => {
    render(
      <TableRealtimeToggle
        checked={false}
        isHighAvailability
        isPending={false}
        onCheckedChange={vi.fn()}
      />
    )

    expect(screen.getByRole('checkbox', { name: 'Enable Realtime' })).toBeDisabled()
    expect(
      screen.getByText('Realtime is unavailable on High Availability projects.')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Broadcast changes on this table to authorized subscribers.')
    ).not.toBeInTheDocument()
  })

  it('keeps Realtime available with the standard description for non-HA projects', () => {
    render(
      <TableRealtimeToggle
        checked={false}
        isHighAvailability={false}
        isPending={false}
        onCheckedChange={vi.fn()}
      />
    )

    expect(screen.getByRole('checkbox', { name: 'Enable Realtime' })).toBeEnabled()
    expect(
      screen.getByText('Broadcast changes on this table to authorized subscribers.')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Realtime is unavailable on High Availability projects.')
    ).not.toBeInTheDocument()
  })

  it('prevents toggling until HA detection completes', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const { rerender } = render(
      <TableRealtimeToggle
        checked={false}
        isHighAvailability={false}
        isPending
        onCheckedChange={onCheckedChange}
      />
    )

    const checkbox = screen.getByRole('checkbox', { name: 'Enable Realtime' })
    expect(checkbox).toBeDisabled()
    await user.click(checkbox)
    expect(onCheckedChange).not.toHaveBeenCalled()

    rerender(
      <TableRealtimeToggle
        checked={false}
        isHighAvailability={false}
        isPending={false}
        onCheckedChange={onCheckedChange}
      />
    )

    expect(checkbox).toBeEnabled()
    await user.click(checkbox)
    expect(onCheckedChange).toHaveBeenCalledOnce()
  })
})
