import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterBar } from './FilterBar'
import { FilterProperty, FilterGroup } from './types'

const mockFilterProperties: FilterProperty[] = [
  {
    label: 'Name',
    name: 'name',
    type: 'string',
    operators: ['=', '!=', 'CONTAINS'],
  },
  {
    label: 'Status',
    name: 'status',
    type: 'string',
    options: ['active', 'inactive', 'pending'],
    operators: ['=', '!='],
  },
  {
    label: 'Count',
    name: 'count',
    type: 'number',
    operators: ['=', '>', '<', '>=', '<='],
  },
]

const initialFilters: FilterGroup = {
  logicalOperator: 'AND',
  conditions: [],
}

describe('FilterBar', () => {
  const mockOnFilterChange = vi.fn()
  const mockOnFreeformTextChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with empty state', () => {
    render(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={initialFilters}
        onFilterChange={mockOnFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    expect(screen.getByPlaceholderText('Search or filter...')).toBeInTheDocument()
  })

  it('renders with search input', () => {
    render(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={initialFilters}
        onFilterChange={mockOnFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    const input = screen.getByPlaceholderText('Search or filter...')
    expect(input).toBeInTheDocument()
  })

  it('opens group popover and allows selecting a property', async () => {
    const user = userEvent.setup()
    render(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={initialFilters}
        onFilterChange={mockOnFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    const freeform = screen.getByPlaceholderText('Search or filter...')
    freeform.focus()
    await user.click(freeform)

    // Should show property items in popover
    expect(await screen.findByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()

    // Select a property
    await user.click(screen.getByText('Status'))

    // Value input should appear for selected property
    await waitFor(() => {
      expect(screen.getByLabelText('Value for Status')).toBeInTheDocument()
    })
  })

  it('selects array option for value with keyboard', async () => {
    const user = userEvent.setup()
    render(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={initialFilters}
        onFilterChange={mockOnFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    const freeform = screen.getByPlaceholderText('Search or filter...')
    await user.click(freeform)
    await user.click(screen.getByText('Status'))

    const valueInput = await screen.findByLabelText('Value for Status')
    valueInput.focus()

    // Popover should show value options
    expect(await screen.findByText('active')).toBeInTheDocument()

    // Arrow down and enter to select 'active'
    await user.keyboard('{ArrowDown}{Enter}')

    expect((valueInput as HTMLInputElement).value).toBe('active')
  })

  it('renders and applies custom value component inside popover', async () => {
    const user = userEvent.setup()
    const customProps: FilterProperty[] = [
      ...mockFilterProperties,
      {
        label: 'Tag',
        name: 'tag',
        type: 'string',
        operators: ['='],
        options: {
          label: 'Custom...',
          component: ({
            onChange,
            onCancel,
          }: {
            onChange: (v: string) => void
            onCancel: () => void
          }) => (
            <div>
              <button onClick={() => onChange('foo')}>Pick Foo</button>
              <button onClick={onCancel}>Cancel</button>
            </div>
          ),
        },
      },
    ]

    render(
      <FilterBar
        filterProperties={customProps}
        filters={initialFilters}
        onFilterChange={mockOnFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    const freeform = screen.getByPlaceholderText('Search or filter...')
    await user.click(freeform)
    await user.click(screen.getByText('Tag'))

    // The value list should include the custom entry
    expect(await screen.findByText('Custom...')).toBeInTheDocument()
    await user.click(screen.getByText('Custom...'))

    // Custom UI should render inside the popover
    const pickFoo = await screen.findByText('Pick Foo')
    await user.click(pickFoo)

    // Value should be applied
    const valueInput = await screen.findByLabelText('Value for Tag')
    expect((valueInput as HTMLInputElement).value).toBe('foo')
  })

  it('closes popover when clicking outside the filter bar', async () => {
    const user = userEvent.setup()
    render(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={initialFilters}
        onFilterChange={mockOnFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    const freeform = screen.getByPlaceholderText('Search or filter...')
    await user.click(freeform)
    expect(await screen.findByText('Name')).toBeInTheDocument()

    await user.click(document.body)
    await waitFor(() => {
      expect(screen.queryByText('Name')).not.toBeInTheDocument()
    })
  })

  it('handles existing filters in state', () => {
    const existingFilters: FilterGroup = {
      logicalOperator: 'AND',
      conditions: [
        {
          propertyName: 'name',
          value: 'test',
          operator: '=',
        },
      ],
    }

    render(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={existingFilters}
        onFilterChange={mockOnFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    expect(screen.getByDisplayValue('test')).toBeInTheDocument()
    expect(screen.getByDisplayValue('=')).toBeInTheDocument()
  })

  it('handles nested filter groups', () => {
    const nestedFilters: FilterGroup = {
      logicalOperator: 'AND',
      conditions: [
        {
          propertyName: 'name',
          value: 'test',
          operator: '=',
        },
        {
          logicalOperator: 'OR',
          conditions: [
            {
              propertyName: 'status',
              value: 'active',
              operator: '=',
            },
          ],
        },
      ],
    }

    render(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={nestedFilters}
        onFilterChange={mockOnFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    expect(screen.getByDisplayValue('test')).toBeInTheDocument()
    expect(screen.getByDisplayValue('active')).toBeInTheDocument()
    expect(screen.queryByText('AND')).not.toBeInTheDocument()
  })

  it('hides logical operators by default', () => {
    const multipleFilters: FilterGroup = {
      logicalOperator: 'AND',
      conditions: [
        {
          propertyName: 'name',
          value: 'test1',
          operator: '=',
        },
        {
          propertyName: 'status',
          value: 'active',
          operator: '=',
        },
      ],
    }

    render(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={multipleFilters}
        onFilterChange={mockOnFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
        // supportsOperators defaults to false
      />
    )

    expect(screen.getByDisplayValue('test1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('active')).toBeInTheDocument()
    expect(screen.queryByText('AND')).not.toBeInTheDocument()
  })
})
