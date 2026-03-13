import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FilterBar } from './FilterBar'
import { FilterGroup, FilterProperty } from './types'

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

    expect(screen.getByPlaceholderText('Filter by Name, Status, Count')).toBeInTheDocument()
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

    const input = screen.getByPlaceholderText('Filter by Name, Status, Count')
    expect(input).toBeInTheDocument()
  })

  it('opens group popover and allows selecting a property', async () => {
    const user = userEvent.setup()
    let currentFilters = initialFilters
    const handleFilterChange = vi.fn((filters) => {
      currentFilters = filters
    })

    const { rerender } = render(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    const freeform = screen.getByPlaceholderText('Filter by Name, Status, Count')
    freeform.focus()
    await user.click(freeform)

    expect(await screen.findByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()

    await user.click(screen.getByText('Status'))

    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenCalled()
    })

    rerender(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Value for Status')).toBeInTheDocument()
    })
  })

  it('selects array option for value with keyboard', async () => {
    const user = userEvent.setup()
    let currentFilters = initialFilters
    const handleFilterChange = vi.fn((filters) => {
      currentFilters = filters
    })

    const { rerender } = render(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    const freeform = screen.getByPlaceholderText('Filter by Name, Status, Count')
    await user.click(freeform)
    await user.click(screen.getByText('Status'))

    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenCalled()
    })

    rerender(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    const valueInput = await waitFor(() => screen.getByLabelText('Value for Status'), {
      timeout: 3000,
    })
    valueInput.focus()

    expect(await screen.findByText('active')).toBeInTheDocument()

    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenCalledTimes(2) // Once for property, once for value
    })

    rerender(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    const updatedValueInput = await screen.findByLabelText('Value for Status')
    expect((updatedValueInput as HTMLInputElement).value).toBe('active')
  })

  it('shows an equals fallback and applies it on enter for non-operator input', async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()

    function Wrapper() {
      const [filters, setFilters] = useState(initialFilters)

      return (
        <FilterBar
          filterProperties={mockFilterProperties}
          filters={filters}
          onFilterChange={(next) => {
            onFilterChange(next)
            setFilters(next)
          }}
          freeformText=""
          onFreeformTextChange={mockOnFreeformTextChange}
        />
      )
    }

    render(<Wrapper />)

    await user.click(screen.getByPlaceholderText('Filter by Name, Status, Count'))
    await user.click(screen.getByText('Name'))

    const operatorInput = await screen.findByLabelText('Operator for Name')
    await user.click(operatorInput)
    await user.type(operatorInput, 'abc')

    expect(onFilterChange).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Equals: "abc"')).toBeInTheDocument()

    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenLastCalledWith({
        logicalOperator: 'AND',
        conditions: [{ propertyName: 'name', operator: '=', value: 'abc' }],
      })
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Add more filters...')).toHaveFocus()
    })
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

    let currentFilters = initialFilters
    const handleFilterChange = vi.fn((filters) => {
      currentFilters = filters
    })

    const { rerender } = render(
      <FilterBar
        filterProperties={customProps}
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    const freeform = screen.getByPlaceholderText('Filter by Name, Status, Count...')
    await user.click(freeform)
    await user.click(screen.getByText('Tag'))

    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenCalled()
    })

    rerender(
      <FilterBar
        filterProperties={customProps}
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    const valueInput = await waitFor(() => screen.getByLabelText('Value for Tag'), {
      timeout: 3000,
    })

    await user.click(valueInput)

    // When value options contain only a custom component, the popover renders it directly (no menu)
    const pickFoo = await screen.findByText('Pick Foo')
    await user.click(pickFoo)

    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenCalledTimes(2) // Once for property, once for value
    })

    rerender(
      <FilterBar
        filterProperties={customProps}
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    const updatedValueInput = await screen.findByLabelText('Value for Tag')
    expect((updatedValueInput as HTMLInputElement).value).toBe('foo')
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

    const freeform = screen.getByPlaceholderText('Filter by Name, Status, Count')
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

  it('allows switching filter property by clicking the label', async () => {
    const user = userEvent.setup()
    let currentFilters: FilterGroup = {
      logicalOperator: 'AND',
      conditions: [
        {
          propertyName: 'name',
          value: 'test',
          operator: '=',
        },
      ],
    }
    const handleFilterChange = vi.fn((filters) => {
      currentFilters = filters
    })

    const { rerender } = render(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test')).toBeInTheDocument()

    await user.click(screen.getByText('Name'))

    // Dropdown excludes current property ("Name" is visible as label but not in the picker list)
    expect(await screen.findByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Count')).toBeInTheDocument()

    await user.click(screen.getByText('Status'))

    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenCalled()
    })

    const updatedCondition = currentFilters.conditions[0] as {
      propertyName: string
      value: string
      operator: string
    }
    expect(updatedCondition.propertyName).toBe('status')
    expect(updatedCondition.operator).toBe('=')
  })

  it('resets operator when switching to property with incompatible operators', async () => {
    const user = userEvent.setup()
    // CONTAINS exists on Name but not Status, so switching should reset operator
    let currentFilters: FilterGroup = {
      logicalOperator: 'AND',
      conditions: [
        {
          propertyName: 'name',
          value: 'test',
          operator: 'CONTAINS',
        },
      ],
    }
    const handleFilterChange = vi.fn((filters) => {
      currentFilters = filters
    })

    render(
      <FilterBar
        filterProperties={mockFilterProperties}
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        freeformText=""
        onFreeformTextChange={mockOnFreeformTextChange}
      />
    )

    await user.click(screen.getByText('Name'))
    await user.click(await screen.findByText('Status'))

    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenCalled()
    })

    const updatedCondition = currentFilters.conditions[0] as {
      propertyName: string
      value: string
      operator: string
    }
    expect(updatedCondition.propertyName).toBe('status')
    expect(updatedCondition.operator).toBe('')
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
      />
    )

    expect(screen.getByDisplayValue('test1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('active')).toBeInTheDocument()
    expect(screen.queryByText('AND')).not.toBeInTheDocument()
  })
})
