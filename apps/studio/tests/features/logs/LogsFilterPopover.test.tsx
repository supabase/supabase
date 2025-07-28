import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LogsFilterPopover from 'components/interfaces/Settings/Logs/LogsFilterPopover'
import { describe, it, expect, vi } from 'vitest'

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

  it('renders with initial props and stays closed', () => {
    const onFiltersChange = vi.fn()
    render(
      <LogsFilterPopover
        options={mockOptions}
        filters={mockFilters}
        onFiltersChange={onFiltersChange}
        buttonClassName=""
      />
    )

    expect(screen.getByText('Severity')).toBeInTheDocument()
    expect(screen.queryByText('Error level logs')).not.toBeInTheDocument()
  })

  it('opens when clicked and shows options', async () => {
    const onFiltersChange = vi.fn()
    render(
      <LogsFilterPopover
        options={mockOptions}
        filters={mockFilters}
        onFiltersChange={onFiltersChange}
        buttonClassName=""
      />
    )

    fireEvent.click(screen.getByText('Severity'))

    await waitFor(() => {
      expect(screen.getByText('Error level logs')).toBeInTheDocument()
      expect(screen.getByText('Warning level logs')).toBeInTheDocument()
    })
  })

  it('reflects initial filter values correctly', async () => {
    const onFiltersChange = vi.fn()
    render(
      <LogsFilterPopover
        options={mockOptions}
        filters={mockFilters}
        onFiltersChange={onFiltersChange}
        buttonClassName=""
      />
    )

    fireEvent.click(screen.getByText('Severity'))

    await waitFor(() => {
      const errorButton = screen.getByRole('checkbox', {
        name: /error error level logs/i,
      })
      const warningButton = screen.getByRole('checkbox', {
        name: /warning warning level logs/i,
      })

      //   screen.logTestingPlaygroundURL()

      expect(errorButton).toHaveAttribute('aria-checked', 'true')
      expect(warningButton).toHaveAttribute('aria-checked', 'false')
    })
  })

  it('calls onFiltersChange when applying filters', async () => {
    const onFiltersChange = vi.fn()
    render(
      <LogsFilterPopover
        options={mockOptions}
        filters={mockFilters}
        onFiltersChange={onFiltersChange}
        buttonClassName=""
      />
    )

    fireEvent.click(screen.getByText('Severity'))

    await waitFor(() => {
      const warningButton = screen.getByText('Warning')
      fireEvent.click(warningButton)
      fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    })

    expect(onFiltersChange).toHaveBeenCalledWith({
      severity: {
        error: true,
        warn: true,
      },
    })
  })

  it('clears filters when clicking clear button', async () => {
    const onFiltersChange = vi.fn()
    render(
      <LogsFilterPopover
        options={mockOptions}
        filters={mockFilters}
        onFiltersChange={onFiltersChange}
        buttonClassName=""
      />
    )

    fireEvent.click(screen.getByText('Severity'))

    await waitFor(() => {
      fireEvent.click(screen.getByText('Clear'))
    })

    expect(onFiltersChange).toHaveBeenCalledWith({
      severity: {},
    })
  })

  it('closes popover when clicking outside', async () => {
    const onFiltersChange = vi.fn()
    render(
      <LogsFilterPopover
        options={mockOptions}
        filters={mockFilters}
        onFiltersChange={onFiltersChange}
        buttonClassName=""
      />
    )

    fireEvent.click(screen.getByText('Severity'))

    await waitFor(() => {
      expect(screen.getByText('Error level logs')).toBeInTheDocument()
    })

    // Simulate clicking outside by triggering a change in open state
    fireEvent.keyDown(document.body, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByText('Error level logs')).not.toBeInTheDocument()
    })
  })
})
