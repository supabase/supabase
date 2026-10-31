import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import LogsFilterPopover from '@/components/interfaces/Settings/Logs/LogsFilterPopover'

describe('LogsFilterPopover', () => {
  const mockOptions = {
    key: 'severity',
    label: 'Severity',
    options: [
      {
        key: 'error',
        label: 'Error',
        description: 'Error level logs',
      },
      {
        key: 'warn',
        label: 'Warning',
        description: 'Warning level logs',
      },
    ],
  }

  const mockFilters = {
    severity: {
      error: true,
      warn: false,
    },
  }

  const renderPopover = () => {
    const onFiltersChange = vi.fn()
    render(
      <LogsFilterPopover
        options={mockOptions}
        filters={mockFilters}
        onFiltersChange={onFiltersChange}
        buttonClassName=""
      />
    )
    return { onFiltersChange }
  }

  it('starts closed, then opens to show options reflecting the initial filter values', async () => {
    renderPopover()

    expect(screen.queryByText('Error level logs')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Severity'))

    expect(await screen.findByText('Error level logs')).toBeInTheDocument()
    expect(screen.getByText('Warning level logs')).toBeInTheDocument()
    expect(document.getElementById('severity.error')).toHaveAttribute('aria-checked', 'true')
    expect(document.getElementById('severity.warn')).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onFiltersChange when applying filters', async () => {
    const { onFiltersChange } = renderPopover()

    fireEvent.click(screen.getByText('Severity'))
    fireEvent.click(await screen.findByText('Warning'))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(onFiltersChange).toHaveBeenCalledWith({
      severity: {
        error: true,
        warn: true,
      },
    })
  })

  it('clears filters when clicking clear button', async () => {
    const { onFiltersChange } = renderPopover()

    fireEvent.click(screen.getByText('Severity'))
    fireEvent.click(await screen.findByText('Clear'))

    expect(onFiltersChange).toHaveBeenCalledWith({
      severity: {},
    })
  })
})
