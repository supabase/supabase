import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { describe, expect, it, vi } from 'vitest'

import { SaveViewDialog } from './SaveViewDialog'
import { customRender } from '@/tests/lib/custom-render'

// SaveViewDialog renders a Radix dialog, which uses Web Animations.
mockAnimationsApi()

const filters = {
  logicalOperator: 'AND' as const,
  conditions: [
    { propertyName: 'level', operator: '=', value: 'error' },
    { propertyName: 'level', operator: '=', value: 'warning' },
  ],
}

const viewOptions = { show_connection_logs: false, user: 'user-123' }

const baseProps = {
  visible: true,
  onCancel: vi.fn(),
  onSave: vi.fn(),
  logSource: 'edge_logs',
  filters,
  viewOptions,
  existingNames: ['Existing view'],
  columnLabels: { level: 'Level' },
}

describe('SaveViewDialog', () => {
  it('shows the filter summary grouped by column and the options summary', async () => {
    customRender(<SaveViewDialog {...baseProps} />)

    expect(await screen.findByText('Level')).toBeInTheDocument()
    expect(screen.getByText('equals error, warning')).toBeInTheDocument()

    expect(screen.getByText('Connection logs')).toBeInTheDocument()
    expect(screen.getByText('Off')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('user-123')).toBeInTheDocument()
  })

  it("shows a note that the time range isn't saved", async () => {
    customRender(<SaveViewDialog {...baseProps} />)

    expect(
      await screen.findByText("The time range isn't saved with this view.")
    ).toBeInTheDocument()
  })

  it('shows an inline error and does not save when the name is empty', async () => {
    const onSave = vi.fn()
    customRender(<SaveViewDialog {...baseProps} onSave={onSave} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Save view' }))

    expect(await screen.findByText('Enter a name for this view')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows an inline error and does not save when the name is a duplicate (case/whitespace insensitive)', async () => {
    const onSave = vi.fn()
    customRender(<SaveViewDialog {...baseProps} onSave={onSave} />)

    const input = await screen.findByPlaceholderText('Enter a name for this view')
    fireEvent.change(input, { target: { value: ' existing view ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save view' }))

    expect(await screen.findByText("That name's already taken. Try another.")).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves and closes when the name is valid and unique', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()
    customRender(<SaveViewDialog {...baseProps} onSave={onSave} onCancel={onCancel} />)

    const input = await screen.findByPlaceholderText('Enter a name for this view')
    await userEvent.type(input, 'Errors only')
    fireEvent.click(screen.getByRole('button', { name: 'Save view' }))

    await vi.waitFor(() => expect(onSave).toHaveBeenCalledOnce())
    expect(onSave).toHaveBeenCalledWith({
      name: 'Errors only',
      logSource: 'edge_logs',
      filters,
      viewOptions,
    })
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
