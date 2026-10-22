import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TableRealtimeToggle } from './TableEditor'

describe('TableRealtimeToggle', () => {
  it('shows the Realtime toggle with its description', () => {
    render(<TableRealtimeToggle checked={false} onCheckedChange={vi.fn()} />)

    expect(screen.getByRole('checkbox', { name: 'Enable Realtime' })).toBeEnabled()
    expect(
      screen.getByText('Broadcast changes on this table to authorized subscribers.')
    ).toBeInTheDocument()
  })

  it('calls onCheckedChange when toggled', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<TableRealtimeToggle checked={false} onCheckedChange={onCheckedChange} />)

    await user.click(screen.getByRole('checkbox', { name: 'Enable Realtime' }))

    expect(onCheckedChange).toHaveBeenCalledOnce()
  })
})
