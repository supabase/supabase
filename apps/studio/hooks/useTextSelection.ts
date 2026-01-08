import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

export interface TextSelection {
  text: string
  position: { x: number; y: number }
}

const SELECTION_DELAY_MS = 500

export function useTextSelection(targetRef: RefObject<HTMLElement | null>) {
  const [selection, setSelection] = useState<TextSelection | null>(null)
  const [pendingSelection, setPendingSelection] = useState<TextSelection | null>(null)
  const delayTimerRef = useRef<NodeJS.Timeout | null>(null)
  const popupRef = useRef<HTMLElement | null>(null)

  const setPopupRef = useCallback((ref: HTMLElement | null) => {
    popupRef.current = ref
  }, [])

  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection()
      const text = sel?.toString().trim()

      if (!text || !sel || sel.rangeCount === 0) {
        setPendingSelection(null)
        if (delayTimerRef.current) {
          clearTimeout(delayTimerRef.current)
          delayTimerRef.current = null
        }
        return
      }

      const target = targetRef.current
      if (!target) return

      const range = sel.getRangeAt(0)
      const container = range.commonAncestorContainer

      const isWithinTarget =
        container === target || (container instanceof Node && target.contains(container))

      if (!isWithinTarget) {
        setPendingSelection(null)
        if (delayTimerRef.current) {
          clearTimeout(delayTimerRef.current)
          delayTimerRef.current = null
        }
        return
      }

      const rect = range.getBoundingClientRect()

      const newSelection: TextSelection = {
        text,
        position: {
          x: rect.right + window.scrollX,
          y: rect.top + window.scrollY,
        },
      }

      setPendingSelection(newSelection)

      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
      }

      delayTimerRef.current = setTimeout(() => {
        setSelection(newSelection)
        delayTimerRef.current = null
      }, SELECTION_DELAY_MS)
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (popupRef.current && popupRef.current.contains(event.target as Node)) {
        return
      }

      setPendingSelection(null)
      setSelection(null)
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
      }
    }
  }, [targetRef])

  const clearSelection = useCallback(() => {
    setSelection(null)
    setPendingSelection(null)
    window.getSelection()?.removeAllRanges()
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current)
      delayTimerRef.current = null
    }
  }, [])

  return { selection, clearSelection, setPopupRef }
}
