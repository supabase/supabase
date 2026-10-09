import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TableScrollPreservation, useTableScrollAnchor } from './useTableScrollAnchor'

const reducedMotionQuery: MediaQueryList = vi.mocked(window.matchMedia).mock.results[
  vi
    .mocked(window.matchMedia)
    .mock.calls.findIndex(([query]) => query === '(prefers-reduced-motion: reduce)')
].value

function setup({ scrollTop = 0, rowCount = 20, prefersReducedMotion = false } = {}) {
  Object.defineProperty(reducedMotionQuery, 'matches', {
    configurable: true,
    value: prefersReducedMotion,
  })
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
  const scrollTo = vi.fn((options: ScrollToOptions) => {
    if (options.behavior !== 'smooth') container.scrollTop = options.top ?? container.scrollTop
  })
  Object.defineProperty(container, 'scrollTo', { value: scrollTo })
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
    scrollTo,
  }
}

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
  vi.useRealTimers()
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

  it('scrolls smoothly to the newest rows and preserves horizontal scroll through arrivals', () => {
    const { container, rowIds, updateRows, rerender, result, onScrollToTop, scrollTo } = setup({
      scrollTop: 150,
    })
    act(() => result.current.scrollToTop())
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 70, behavior: 'smooth' })
    expect(container.scrollTop).toBe(150)
    expect(container.scrollLeft).toBe(70)
    expect(onScrollToTop).toHaveBeenCalledOnce()

    updateRows(['new', ...rowIds])
    rerender()
    expect(container.scrollTop).toBe(150)
    container.scrollTop = 80
    act(() => {
      container.dispatchEvent(new Event('scroll'))
      result.current.handleScroll()
    })
    updateRows(['newer', 'new', ...rowIds], 24)
    rerender()
    expect(container.scrollTop).toBe(80)
    rerender()
    expect(container.scrollTop).toBe(80)

    container.scrollTop = 0
    act(() => {
      container.dispatchEvent(new Event('scroll'))
      result.current.handleScroll()
    })
    expect(onScrollToTop).toHaveBeenCalledTimes(2)
    updateRows(['newest', 'newer', 'new', ...rowIds], 24)
    rerender()
    expect(container.scrollTop).toBe(30)
    expect(container.scrollLeft).toBe(70)
  })

  it('jumps immediately when reduced motion is preferred and restores anchoring', () => {
    const { container, rowIds, updateRows, rerender, result, onScrollToTop, scrollTo } = setup({
      scrollTop: 150,
      prefersReducedMotion: true,
    })
    act(() => result.current.scrollToTop())
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 70, behavior: 'instant' })
    expect(container.scrollTop).toBe(0)
    expect(onScrollToTop).toHaveBeenCalledOnce()
    updateRows(['new', ...rowIds])
    rerender()
    expect(container.scrollTop).toBe(30)
  })

  it('acknowledges rows arriving during smooth scrolling when the newest rows become visible', () => {
    const { container, rowIds, updateRows, rerender, result, onScrollToTop } = setup({
      scrollTop: 150,
    })
    let unseenRows = 1
    onScrollToTop.mockImplementation(() => {
      unseenRows = 0
    })
    act(() => result.current.scrollToTop())
    expect(unseenRows).toBe(0)

    unseenRows += 1
    updateRows(['new', ...rowIds])
    rerender()
    expect(unseenRows).toBe(1)

    container.scrollTop = 0
    act(() => {
      container.dispatchEvent(new Event('scroll'))
      result.current.handleScroll()
      container.dispatchEvent(new Event('scrollend'))
    })
    expect(unseenRows).toBe(0)
    expect(onScrollToTop).toHaveBeenCalledTimes(2)
  })

  it.each(['scrollend', 'idle'])(
    'restores anchoring after an interrupted smooth scroll via %s',
    (end) => {
      vi.useFakeTimers()
      const { container, rowIds, updateRows, rerender, result, onScrollToTop } = setup({
        scrollTop: 150,
      })
      act(() => result.current.scrollToTop())
      container.scrollTop = 100
      act(() => {
        container.dispatchEvent(new Event('scroll'))
        result.current.handleScroll()
      })
      act(() => {
        if (end === 'scrollend') container.dispatchEvent(new Event('scrollend'))
        else vi.advanceTimersByTime(150)
      })
      updateRows(['new', ...rowIds])
      rerender()
      expect(container.scrollTop).toBe(130)
      expect(onScrollToTop).toHaveBeenCalledOnce()
      expect(vi.getTimerCount()).toBe(0)
    }
  )

  it('cleans up pending smooth scrolling when the preservation session changes or unmounts', () => {
    vi.useFakeTimers()
    const { container, rowIds, updateRows, rerender, result, onScrollToTop, scrollTo, unmount } =
      setup({
        scrollTop: 150,
      })
    act(() => result.current.scrollToTop())
    const nextProps = { scrollPreservation: { key: Symbol(), onScrollToTop } }
    rerender(nextProps)
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 150, left: 70, behavior: 'instant' })
    expect(onScrollToTop).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    updateRows(['new', ...rowIds])
    rerender(nextProps)
    expect(container.scrollTop).toBe(180)
    act(() => result.current.scrollToTop())
    unmount()
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 180, left: 70, behavior: 'instant' })
    expect(onScrollToTop).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
    container.dispatchEvent(new Event('scroll'))
    expect(vi.getTimerCount()).toBe(0)
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
