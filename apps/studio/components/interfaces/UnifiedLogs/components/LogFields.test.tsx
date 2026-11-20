import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LogFields } from './LogFields'

describe('LogFields', () => {
  it('renders scalars, empty values, and dates without losing false or zero', () => {
    render(
      <LogFields
        data={{
          count: 0,
          enabled: false,
          absent: null,
          emptyArray: [],
          emptyObject: {},
          timestamp: new Date('2026-09-22T00:00:00Z'),
          omitted: undefined,
        }}
      />
    )
    expect(screen.getByRole('button', { name: 'count 0' })).toBeVisible()
    expect(screen.getByText('false')).toBeInTheDocument()
    expect(screen.getByText('null')).toBeInTheDocument()
    expect(screen.getByText('2026-09-22T00:00:00.000Z')).toBeInTheDocument()
    expect(screen.queryByText('omitted')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Expand emptyArray' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Expand emptyObject' }))
    expect(screen.getByText('[]')).toBeInTheDocument()
    expect(screen.getByText('{}')).toBeInTheDocument()
  })

  it('expands nested objects and displays arrays inline with their full value available to copy', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    const headers = [{ authorization: 'example' }]
    render(<LogFields data={{ request: { headers } }} />)
    expect(screen.queryByText(JSON.stringify(headers))).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Expand request' }))
    expect(screen.queryByRole('button', { name: 'Expand headers' })).not.toBeInTheDocument()
    expect(screen.getByText(JSON.stringify(headers))).toBeVisible()
    await user.click(screen.getByText('headers'))
    await user.click(screen.getByRole('menuitem', { name: 'Copy headers' }))
    expect(copy).toHaveBeenCalledWith(JSON.stringify(headers, null, 2))
  })
  it('opens a copy menu from a scalar row without a separate action button', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    render(<LogFields data={{ enabled: false }} />)
    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument()
    await user.click(screen.getByText('enabled'))
    expect(screen.queryByRole('menuitem', { name: /filter/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Copy enabled' }))
    expect(copy).toHaveBeenCalledWith('false')
  })

  it('opens a menu for a nested object independently of expanding it', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    render(<LogFields data={{ request: { status: 200 } }} />)
    await user.click(screen.getByText('request'))
    await user.click(screen.getByRole('menuitem', { name: 'Copy request' }))
    expect(copy).toHaveBeenCalledWith(JSON.stringify({ status: 200 }, null, 2))
    expect(screen.queryByText('200')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Expand request' }))
    expect(screen.getByText('200')).toBeVisible()
  })
})
