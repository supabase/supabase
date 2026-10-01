import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
    vi.useFakeTimers()
    mocks.fetchPreviousPage.mockReset().mockResolvedValue(undefined)
    mocks.setSearch.mockReset()
    mocks.table.getColumn.mockClear()
    mocks.table.resetSorting.mockClear()
    mocks.search.live = false
    mocks.search.date = null
    mocks.search.sort = null
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
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

    await act(async () => {})
    expect(mocks.fetchPreviousPage).toHaveBeenCalledTimes(1)
    mocks.search.live = false
    rerender(<LiveButton fetchPreviousPage={mocks.fetchPreviousPage} searchParamsParser={{}} />)

    await act(() => vi.advanceTimersByTimeAsync(30_000))
    expect(mocks.fetchPreviousPage).toHaveBeenCalledTimes(1)
  })

  it('does not resume polling when a pending request settles after disabling live mode', async () => {
    const pendingRequest = Promise.withResolvers<unknown>()
    mocks.fetchPreviousPage.mockReturnValueOnce(pendingRequest.promise)
    mocks.search.live = true
    const { rerender } = render(
      <LiveButton fetchPreviousPage={mocks.fetchPreviousPage} searchParamsParser={{}} />
    )

    mocks.search.live = false
    rerender(<LiveButton fetchPreviousPage={mocks.fetchPreviousPage} searchParamsParser={{}} />)
    await act(async () => pendingRequest.resolve(undefined))
    await act(() => vi.advanceTimersByTimeAsync(30_000))

    expect(mocks.fetchPreviousPage).toHaveBeenCalledTimes(1)
  })

  it('does not resume polling when a pending request settles after unmounting', async () => {
    const pendingRequest = Promise.withResolvers<unknown>()
    mocks.fetchPreviousPage.mockReturnValueOnce(pendingRequest.promise)
    mocks.search.live = true
    const { unmount } = render(
      <LiveButton fetchPreviousPage={mocks.fetchPreviousPage} searchParamsParser={{}} />
    )

    unmount()
    await act(async () => pendingRequest.resolve(undefined))
    await act(() => vi.advanceTimersByTimeAsync(30_000))

    expect(mocks.fetchPreviousPage).toHaveBeenCalledTimes(1)
  })

  it('starts only one polling loop when live mode is re-enabled during a pending request', async () => {
    const pendingRequest = Promise.withResolvers<unknown>()
    mocks.fetchPreviousPage.mockReturnValueOnce(pendingRequest.promise)
    mocks.search.live = true
    const { rerender } = render(
      <LiveButton fetchPreviousPage={mocks.fetchPreviousPage} searchParamsParser={{}} />
    )

    mocks.search.live = false
    rerender(<LiveButton fetchPreviousPage={mocks.fetchPreviousPage} searchParamsParser={{}} />)
    mocks.search.live = true
    rerender(<LiveButton fetchPreviousPage={mocks.fetchPreviousPage} searchParamsParser={{}} />)
    await act(async () => pendingRequest.resolve(undefined))

    expect(mocks.fetchPreviousPage).toHaveBeenCalledTimes(2)
    await act(() => vi.advanceTimersByTimeAsync(30_000))
    expect(mocks.fetchPreviousPage).toHaveBeenCalledTimes(5)
  })

  it('retries after a rejected poll at the next interval', async () => {
    const pendingRequest = Promise.withResolvers<unknown>()
    mocks.fetchPreviousPage.mockReturnValueOnce(pendingRequest.promise)
    mocks.search.live = true
    render(<LiveButton fetchPreviousPage={mocks.fetchPreviousPage} searchParamsParser={{}} />)

    await act(async () => pendingRequest.reject(new Error('Request failed')))
    await act(() => vi.advanceTimersByTimeAsync(9_999))
    expect(mocks.fetchPreviousPage).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(mocks.fetchPreviousPage).toHaveBeenCalledTimes(2)
  })
})
