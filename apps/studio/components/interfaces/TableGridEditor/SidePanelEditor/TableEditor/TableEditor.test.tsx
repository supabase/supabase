import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TableRealtimeToggle } from './TableEditor'

describe('TableRealtimeToggle', () => {
  it('reports the new checked state when toggled', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<TableRealtimeToggle checked={false} onCheckedChange={onCheckedChange} />)

    await user.click(screen.getByRole('checkbox', { name: 'Enable Realtime' }))

    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})
