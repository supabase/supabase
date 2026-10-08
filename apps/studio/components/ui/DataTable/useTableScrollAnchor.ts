import { RefObject, useLayoutEffect, useRef } from 'react'

export type TableScrollPreservation = {
  key: symbol
  onScrollToTop: () => void
  scrollToTopLabel?: string
}

type ScrollAnchor = {
  key: symbol
  rowId: string
  offset: number
  scrollTop: number
}

export function useTableScrollAnchor({
  tableRef,
  scrollPreservation,
}: {
  tableRef: RefObject<HTMLTableElement | null>
  scrollPreservation?: TableScrollPreservation
}) {
  const anchor = useRef<ScrollAnchor | undefined>(undefined)
  const scrollPosition = useRef<{ key: symbol; top: number } | undefined>(undefined)

  const captureAnchor = () => {
    const table = tableRef.current
    const container = table?.parentElement
    const canCaptureAnchor = table && container && scrollPreservation
    if (!canCaptureAnchor) {
      anchor.current = undefined
      scrollPosition.current = undefined
      return
    }

    scrollPosition.current = { key: scrollPreservation.key, top: container.scrollTop }

    const viewport = container.getBoundingClientRect()
    const visibleTop = Math.max(viewport.top, table.tHead?.getBoundingClientRect().bottom ?? 0)
    const row = Array.from(
      table.querySelectorAll<HTMLTableRowElement>('tbody tr[data-row-id]')
    ).find((row) => {
      const bounds = row.getBoundingClientRect()
      return bounds.bottom > visibleTop && bounds.top < viewport.bottom
    })
    const rowId = row?.dataset.rowId
    anchor.current =
      row && rowId !== undefined
        ? {
            key: scrollPreservation.key,
            rowId,
            offset: row.getBoundingClientRect().top - viewport.top,
            scrollTop: container.scrollTop,
          }
        : undefined
  }

  useLayoutEffect(() => {
    const table = tableRef.current
    const container = table?.parentElement
    const previous = anchor.current
    const canRestoreAnchor =
      table &&
      container &&
      scrollPreservation &&
      previous?.key === scrollPreservation.key &&
      previous.scrollTop === container.scrollTop
    if (canRestoreAnchor) {
      const row = Array.from(
        table.querySelectorAll<HTMLTableRowElement>('tbody tr[data-row-id]')
      ).find((row) => row.dataset.rowId === previous.rowId)
      if (row) {
        const displacement =
          row.getBoundingClientRect().top - container.getBoundingClientRect().top - previous.offset
        if (displacement !== 0) container.scrollTop += displacement
      }
    }
    captureAnchor()
  })

  const handleScroll = () => {
    const container = tableRef.current?.parentElement
    const previous = scrollPosition.current
    const hasScrolledToTop =
      container &&
      previous &&
      previous.key === scrollPreservation?.key &&
      container.scrollTop < previous.top &&
      container.scrollTop <= 1
    if (hasScrolledToTop) {
      scrollPreservation.onScrollToTop()
    }
    captureAnchor()
  }

  const scrollToTop = () => {
    const container = tableRef.current?.parentElement
    if (!container) return
    container.scrollTop = 0
    captureAnchor()
    scrollPreservation?.onScrollToTop()
  }

  return { handleScroll, scrollToTop }
}
