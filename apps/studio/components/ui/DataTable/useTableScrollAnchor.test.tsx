import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TableScrollPreservation, useTableScrollAnchor } from './useTableScrollAnchor'

function setup({ scrollTop = 0, rowCount = 20 } = {}) {
  const container = document.createElement('div')
  const table = document.createElement('table')
  container.append(table)
  document.body.append(container)
  const header = table.createTHead()
  const body = table.createTBody()
  let rowIds = Array.from({ length: rowCount }, (_, index) => `row-${index}`)
  let separatorHeight = 0
  container.scrollTop = scrollTop
  container.scrollLeft = 70
  vi.spyOn(container, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 100, 500, 300)
  )
  vi.spyOn(header, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, 100, 500, 36))

  const updateRows = (ids: string[], decorationHeight = 0) => {
    rowIds = ids
    separatorHeight = decorationHeight
    body.replaceChildren()
    ids.forEach((id) => {
      const row = body.insertRow()
      row.dataset.rowId = id
      vi.spyOn(row, 'getBoundingClientRect').mockImplementation(
        () =>
          new DOMRect(
            0,
            136 + rowIds.indexOf(id) * 30 + separatorHeight - container.scrollTop,
            500,
            30
          )
      )
    })
  }
  updateRows(rowIds)
  const onScrollToTop = vi.fn()
  const initialProps: { scrollPreservation?: TableScrollPreservation } = {
    scrollPreservation: { key: Symbol(), onScrollToTop },
  }
  const hook = renderHook(
    ({ scrollPreservation }) =>
      useTableScrollAnchor({ tableRef: { current: table }, scrollPreservation }),
    { initialProps }
  )
  return {
    ...hook,
    rerender: (props = initialProps) => hook.rerender(props),
    container,
    rowIds,
    updateRows,
    onScrollToTop,
  }
}

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('useTableScrollAnchor', () => {
  it.each([0, 137])(
    'preserves the visible row across arrivals and later separators at %s',
    (top) => {
      const { container, rowIds, updateRows, rerender, result, onScrollToTop } = setup({
        scrollTop: top,
      })
      updateRows(['new-1', 'new-2', ...rowIds])
      rerender()
      expect(container.scrollTop).toBe(top + 60)
      updateRows(['new-1', 'new-2', ...rowIds], 24)
      rerender()
      expect(container.scrollTop).toBe(top + 84)
      act(() => result.current.handleScroll())
      expect(onScrollToTop).not.toHaveBeenCalled()
      expect(container.scrollLeft).toBe(70)
    }
  )

  it('tracks scrolling during a pending fetch and leaves older-page appends in place', () => {
    const { container, rowIds, updateRows, rerender, result } = setup()
    container.scrollTop = 125
    act(() => result.current.handleScroll())
    updateRows(['new', ...rowIds])
    rerender()
    expect(container.scrollTop).toBe(155)
    updateRows(['new', ...rowIds, 'older'])
    rerender()
    expect(container.scrollTop).toBe(155)
  })

  it('acknowledges manual scrolling to the top and captures the new anchor', () => {
    const { container, rowIds, updateRows, rerender, result, onScrollToTop } = setup({
      scrollTop: 120,
    })
    container.scrollTop = 0
    act(() => result.current.handleScroll())
    expect(onScrollToTop).toHaveBeenCalledOnce()
    updateRows(['new', ...rowIds])
    rerender()
    expect(container.scrollTop).toBe(30)
  })

  it('jumps to the newest rows explicitly and acknowledges without changing horizontal scroll', () => {
    const { container, rowIds, updateRows, rerender, result, onScrollToTop } = setup({
      scrollTop: 150,
    })
    act(() => result.current.scrollToTop())
    expect(container.scrollTop).toBe(0)
    expect(container.scrollLeft).toBe(70)
    expect(onScrollToTop).toHaveBeenCalledOnce()
    updateRows(['new', ...rowIds])
    rerender()
    expect(container.scrollTop).toBe(30)
  })

  it('does not undo explicit selection navigation before a scroll event is delivered', () => {
    const { container, rerender } = setup({ scrollTop: 150 })
    container.scrollTop = 300
    rerender()
    expect(container.scrollTop).toBe(300)
  })

  it('discards anchors when the session resets or preservation is disabled', () => {
    const { container, rowIds, updateRows, rerender, onScrollToTop } = setup({ scrollTop: 120 })
    updateRows(['new', ...rowIds])
    rerender({ scrollPreservation: { key: Symbol(), onScrollToTop } })
    expect(container.scrollTop).toBe(120)
    updateRows(['newer', 'new', ...rowIds])
    rerender({ scrollPreservation: undefined })
    expect(container.scrollTop).toBe(120)
  })

  it('does not invent an anchor for an empty table', () => {
    const { container, updateRows, rerender } = setup({ rowCount: 0 })
    updateRows(['first'])
    rerender()
    expect(container.scrollTop).toBe(0)
  })

  it('acknowledges scrolling to the top when only the pagination footer was visible', () => {
    const { container, result, onScrollToTop } = setup({ rowCount: 1, scrollTop: 100 })
    container.scrollTop = 0
    act(() => result.current.handleScroll())
    expect(onScrollToTop).toHaveBeenCalledOnce()
  })
})
