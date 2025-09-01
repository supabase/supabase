import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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