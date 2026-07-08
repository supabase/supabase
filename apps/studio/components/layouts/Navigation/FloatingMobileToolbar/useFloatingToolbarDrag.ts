import { useCallback, useRef, useState } from 'react'

import {
  DRAG_THRESHOLD_PX,
  getNextPosition,
  type NavSize,
  type Position,
  type Viewport,
} from './FloatingMobileToolbar.utils'

type DragStartState = {
  x: number
  y: number
  startX: number
  startY: number
  pointerId: number
}

export function useFloatingToolbarDrag(navRef: React.RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState<Position | null>(null)
  const dragStartRef = useRef<DragStartState | null>(null)

  const applyMove = useCallback(
    (clientX: number, clientY: number) => {
      const state = dragStartRef.current
      if (!state) return
      const rect = navRef.current?.getBoundingClientRect()
      const viewport: Viewport = {
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
      }
      const navSize: NavSize = {
        width: rect?.width ?? 200,
        height: rect?.height ?? 48,
      }
      const next = getNextPosition(state, clientX, clientY, viewport, navSize, DRAG_THRESHOLD_PX)
      if (next) setPosition(next)
    },
    [navRef]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const rect = navRef.current?.getBoundingClientRect()
      if (!rect) return
      const currentX = position?.x ?? rect.left
      const currentY = position?.y ?? rect.top
      dragStartRef.current = {
        x: currentX,
        y: currentY,
        startX: e.clientX,
        startY: e.clientY,
        pointerId: e.pointerId,
      }

      const onMove = (moveEvent: PointerEvent) => {
        if (dragStartRef.current?.pointerId !== moveEvent.pointerId) return
        const dist = Math.hypot(
          moveEvent.clientX - dragStartRef.current.startX,
          moveEvent.clientY - dragStartRef.current.startY
        )
        if (dist >= DRAG_THRESHOLD_PX) {
          navRef.current?.setPointerCapture?.(moveEvent.pointerId)
        }
        applyMove(moveEvent.clientX, moveEvent.clientY)
      }
      const onUpOrCancel = (upEvent: PointerEvent) => {
        if (dragStartRef.current?.pointerId !== upEvent.pointerId) return
        ;(upEvent.target as HTMLElement)?.releasePointerCapture?.(upEvent.pointerId)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUpOrCancel)
        window.removeEventListener('pointercancel', onUpOrCancel)
        dragStartRef.current = null
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUpOrCancel)
      window.addEventListener('pointercancel', onUpOrCancel)
    },
    [navRef, position, applyMove]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      applyMove(e.clientX, e.clientY)
    },
    [applyMove]
  )

  return {
    position,
    dragStartRef,
    handlePointerDown,
    handlePointerMove,
  }
}
