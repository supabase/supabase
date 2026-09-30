import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LiveButton } from './LiveButton'

const mocks = vi.hoisted(() => ({
  fetchPreviousPage: vi.fn(),
  setSearch: vi.fn(),
  table: {
    getColumn: vi.fn(() => ({ setFilterValue: vi.fn() })),
    resetSorting: vi.fn(),
  },
  search: { live: false, date: null, sort: null },
}))

vi.mock('nuqs', () => ({
  useQueryStates: () => [mocks.search, mocks.setSearch],
}))

vi.mock('./providers/DataTableProvider', () => ({
  useDataTable: () => ({ table: mocks.table }),
}))

vi.mock('@/state/shortcuts/useShortcut', () => ({
  useShortcut: vi.fn(),
}))

vi.mock('@/components/ui/ShortcutTooltip', () => ({
  ShortcutTooltip: ({ children }: { children: ReactNode }) => children,
}))

describe('LiveButton', () => {
  beforeEach(() => {
    mocks.fetchPreviousPage.mockReset().mockResolvedValue(undefined)
    mocks.setSearch.mockReset()
    mocks.table.getColumn.mockClear()
    mocks.table.resetSorting.mockClear()
    mocks.search.live = false
    mocks.search.date = null
    mocks.search.sort = null
  })

  it('enables live mode and clears date-based table controls', () => {
    render(<LiveButton fetchPreviousPage={mocks.fetchPreviousPage} searchParamsParser={{}} />)

    fireEvent.click(screen.getByRole('button', { name: 'Live' }))

    const update = mocks.setSearch.mock.calls[0][0]
    expect(update(mocks.search)).toEqual({ live: true, date: null, sort: null })
    expect(mocks.table.getColumn).toHaveBeenCalledWith('date')
    expect(mocks.table.resetSorting).toHaveBeenCalled()
  })

  it('stops polling after live mode is disabled', async () => {
    mocks.search.live = true
    const { rerender } = render(
      <LiveButton fetchPreviousPage={mocks.fetchPreviousPage} searchParamsParser={{}} />
    )

    await waitFor(() => expect(mocks.fetchPreviousPage).toHaveBeenCalledTimes(1))
    mocks.search.live = false
    rerender(<LiveButton fetchPreviousPage={mocks.fetchPreviousPage} searchParamsParser={{}} />)

    expect(mocks.fetchPreviousPage).toHaveBeenCalledTimes(1)
  })
})
