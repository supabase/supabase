import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PipelineDestinationSelection } from './PipelineDestinationSelection'

const destinations = ['BigQuery', 'DuckLake', 'Snowflake', 'ClickHouse'] satisfies Parameters<
  typeof PipelineDestinationSelection
>[0]['availableDestinations']

describe('PipelineDestinationSelection', () => {
  it('shows only available destinations in the intended order', () => {
    render(
      <PipelineDestinationSelection
        availableDestinations={['ClickHouse', 'BigQuery']}
        value="BigQuery"
        onChange={vi.fn()}
      />
    )
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual([
      'BigQuery',
      'ClickHouse',
    ])
    expect(screen.getByRole('radio', { name: /BigQuery/ })).toBeChecked()
    expect(screen.queryByText('Analytics Bucket')).not.toBeInTheDocument()
  })

  it('supports pointer and keyboard selection', async () => {
    const onChange = vi.fn()
    render(
      <PipelineDestinationSelection
        availableDestinations={destinations}
        value="BigQuery"
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('radio', { name: /BigQuery/ }))
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(screen.getByRole('radio', { name: /DuckLake/ })).toHaveFocus())
    await userEvent.keyboard(' ')
    expect(onChange).toHaveBeenLastCalledWith('DuckLake')
    fireEvent.click(screen.getByRole('radio', { name: /Snowflake/ }))
    expect(onChange).toHaveBeenLastCalledWith('Snowflake')
  })

  it('blocks changes while disabled', () => {
    const onChange = vi.fn()
    render(
      <PipelineDestinationSelection
        availableDestinations={destinations}
        value="BigQuery"
        onChange={onChange}
        disabled
      />
    )
    fireEvent.click(screen.getByRole('radio', { name: /DuckLake/ }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('gives Analytics Bucket an accessible label without whitespace in its ID', () => {
    render(
      <PipelineDestinationSelection
        availableDestinations={['Analytics Bucket']}
        value="Analytics Bucket"
        onChange={vi.fn()}
      />
    )
    const radio = screen.getByRole('radio', { name: /Analytics Bucket/ })
    expect(radio.id).not.toMatch(/\s/)
    expect(radio).toHaveAccessibleName(/Analytics Bucket/)
    expect(radio).toBeChecked()
  })

  it('handles no available destinations without selecting one', () => {
    const onChange = vi.fn()
    render(
      <PipelineDestinationSelection availableDestinations={[]} value={null} onChange={onChange} />
    )
    expect(screen.getByText('No destinations are available.')).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })
})
