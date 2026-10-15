import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { UsersSearch } from './UsersSearch'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/lib/telemetry/track', () => ({
  useTrack: () => vi.fn(),
}))

describe('UsersSearch', () => {
  const defaultTelemetryProps = {
    sort_column: 'created_at',
    sort_order: 'desc',
    providers: [],
    keywords: '',
  }

  it('renders input placeholder based on specificFilterColumn', () => {
    const { rerender } = customRender(
      <UsersSearch
        search=""
        setSearch={vi.fn()}
        specificFilterColumn="email"
        telemetryProps={defaultTelemetryProps}
        onSelectFilterColumn={vi.fn()}
      />
    )

    expect(screen.getByPlaceholderText('Search by email')).toBeInTheDocument()

    rerender(
      <UsersSearch
        search=""
        setSearch={vi.fn()}
        specificFilterColumn="phone"
        telemetryProps={defaultTelemetryProps}
        onSelectFilterColumn={vi.fn()}
      />
    )

    expect(screen.getByPlaceholderText('Search by phone')).toBeInTheDocument()

    rerender(
      <UsersSearch
        search=""
        setSearch={vi.fn()}
        specificFilterColumn="id"
        telemetryProps={defaultTelemetryProps}
        onSelectFilterColumn={vi.fn()}
      />
    )

    expect(screen.getByPlaceholderText('Search by user ID')).toBeInTheDocument()

    rerender(
      <UsersSearch
        search=""
        setSearch={vi.fn()}
        specificFilterColumn="freeform"
        telemetryProps={defaultTelemetryProps}
        onSelectFilterColumn={vi.fn()}
      />
    )

    expect(
      screen.getByPlaceholderText('Search by user ID, email, phone or name')
    ).toBeInTheDocument()
  })

  it('clears search input when clear button is clicked', () => {
    const setSearch = vi.fn()

    customRender(
      <UsersSearch
        search="test-query"
        setSearch={setSearch}
        specificFilterColumn="email"
        telemetryProps={defaultTelemetryProps}
        onSelectFilterColumn={vi.fn()}
      />
    )

    const clearButton = screen.getByRole('button')
    fireEvent.click(clearButton)

    expect(setSearch).toHaveBeenCalledWith('')
  })
})
