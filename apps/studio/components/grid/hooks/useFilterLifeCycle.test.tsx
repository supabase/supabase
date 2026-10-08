import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSyncFiltersToUrl } from './useFilterLifeCycle'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { ForeignTable } from '@/data/table-editor/table-editor-types'
import {
  TableEditorTableStateContextProvider,
  useTableEditorTableStateSnapshot,
} from '@/state/table-editor-table'

// Router-agnostic: the hook only sees what useTableEditorFiltersSort reads from the URL.
const url = vi.hoisted(() => ({
  path: '/project/default/editor/1',
  filters: [] as string[],
  sorts: [] as string[],
  setParams: vi.fn(),
}))
vi.mock('@/hooks/misc/useTableEditorFiltersSort', () => ({
  // Like the real hook, setParams changes identity whenever the URL params do.
  useTableEditorFiltersSort: () => ({
    path: url.path,
    filters: url.filters,
    sorts: url.sorts,
    setParams: (...args: unknown[]) => url.setParams(...args),
  }),
}))

const table: ForeignTable = {
  entity_type: ENTITY_TYPE.FOREIGN_TABLE,
  id: 1,
  // Empty schema skips the index advisor provider and its project queries.
  schema: '',
  name: 'colors',
  comment: null,
  foreign_server_name: '',
  foreign_data_wrapper_name: '',
  foreign_data_wrapper_handler: '',
  columns: [],
}

let snap: ReturnType<typeof useTableEditorTableStateSnapshot>

function Probe() {
  snap = useTableEditorTableStateSnapshot()
  useSyncFiltersToUrl()
  return <output data-testid="filters">{snap.filters.map((f) => f.value).join(',')}</output>
}

// A fresh element each time, so a rerender re-reads the mocked URL.
const getUi = () => (
  <TableEditorTableStateContextProvider projectRef="default" table={table}>
    <Probe />
  </TableEditorTableStateContextProvider>
)

const renderProbe = () => {
  const view = render(getUi())
  // valtio notifies subscribers in a microtask, so flush it with an async act
  return { rerender: () => act(async () => view.rerender(getUi())) }
}

const red = { column: 'name', operator: '=' as const, value: 'Red' }

describe('useSyncFiltersToUrl', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    url.path = '/project/default/editor/1'
    url.filters = []
    url.sorts = []
    url.setParams.mockClear()
  })
  afterEach(() => vi.useRealTimers())

  it('adopts an external URL change without pushing it back', async () => {
    const { rerender } = renderProbe()
    act(() => vi.runAllTimers())
    url.setParams.mockClear()

    url.filters = ['name:eq:Red']
    await rerender()
    expect(screen.getByTestId('filters')).toHaveTextContent('Red')

    act(() => vi.advanceTimersByTime(1000))
    expect(url.setParams).not.toHaveBeenCalled()
  })

  it('lets the URL win over a pending state → URL update', async () => {
    const { rerender } = renderProbe()
    await act(async () => snap.setFilters([red]))

    url.filters = ['name:eq:Blue']
    await rerender()
    act(() => vi.advanceTimersByTime(1000))

    expect(screen.getByTestId('filters')).toHaveTextContent('Blue')
    expect(url.setParams).not.toHaveBeenCalled()
  })

  it('ignores the echo of its own push even if state moved on', async () => {
    const { rerender } = renderProbe()
    await act(async () => snap.setFilters([red]))
    act(() => vi.advanceTimersByTime(500))
    expect(url.setParams).toHaveBeenCalledTimes(1)

    await act(async () => snap.setFilters([{ ...red, value: 'Green' }]))
    url.filters = ['name:eq:Red']
    await rerender()

    expect(screen.getByTestId('filters')).toHaveTextContent('Green')
    // The newer edit is still pushed once its debounce elapses
    act(() => vi.advanceTimersByTime(500))
    expect(url.setParams).toHaveBeenCalledTimes(2)
    expect(url.setParams.mock.lastCall?.[0]({})).toEqual({ filter: ['name:eq:Green'] })
  })

  it('discards a pending edit on Back to an entry with the same filters', async () => {
    url.sorts = ['name:asc']
    const { rerender } = renderProbe()
    await act(async () => snap.setFilters([red]))

    // Back to the pre-sort entry: `filter` is unchanged, only `sort` differs
    window.dispatchEvent(new PopStateEvent('popstate'))
    url.sorts = []
    await rerender()
    act(() => vi.advanceTimersByTime(1000))

    expect(screen.getByTestId('filters')).toBeEmptyDOMElement()
    expect(url.setParams).not.toHaveBeenCalled()
  })

  it('cancels a pending push on Back to an entry that already has the edited filters', async () => {
    const { rerender } = renderProbe()
    await act(async () => snap.setFilters([red]))

    window.dispatchEvent(new PopStateEvent('popstate'))
    url.filters = ['name:eq:Red']
    await rerender()
    act(() => vi.advanceTimersByTime(1000))

    expect(screen.getByTestId('filters')).toHaveTextContent('Red')
    expect(url.setParams).not.toHaveBeenCalled()
  })

  it('keeps a pending filter edit when a sort changes the URL', async () => {
    const { rerender } = renderProbe()
    await act(async () => snap.setFilters([red]))

    url.sorts = ['name:asc']
    await rerender()
    act(() => vi.advanceTimersByTime(500))

    expect(screen.getByTestId('filters')).toHaveTextContent('Red')
    expect(url.setParams).toHaveBeenCalledTimes(1)
  })

  it('still pushes when identical filters are re-applied before the debounce fires', async () => {
    const { rerender } = renderProbe()
    await act(async () => snap.setFilters([red]))
    act(() => vi.advanceTimersByTime(300))

    // The filter bar re-applies the same filters on blur/Escape as a new array. valtio alone
    // doesn't re-render for equal contents; the blur's own UI state update does.
    await act(async () => snap.setFilters([{ ...red }]))
    await rerender()
    act(() => vi.advanceTimersByTime(500))

    expect(url.setParams).toHaveBeenCalledTimes(1)
    expect(url.setParams.mock.lastCall?.[0]({})).toEqual({ filter: ['name:eq:Red'] })
  })

  it('cancels a pending push on unmount', async () => {
    const view = render(getUi())
    await act(async () => snap.setFilters([red]))
    view.unmount()
    act(() => vi.advanceTimersByTime(1000))

    expect(url.setParams).not.toHaveBeenCalled()
  })

  it("ignores another table's URL while navigation is pending", async () => {
    const { rerender } = renderProbe()

    url.path = '/project/default/editor/2'
    url.filters = ['name:eq:Red']
    await rerender()

    expect(screen.getByTestId('filters')).toBeEmptyDOMElement()
  })
})
