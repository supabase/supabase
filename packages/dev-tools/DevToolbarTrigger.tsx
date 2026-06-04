'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { Button, cn } from 'ui'

import { useDevToolbar } from './DevToolbarContext'

// Duplicated for tree-shaking — bundler must see literal process.env reference.
// Keep in sync: index.ts, DevToolbarContext.tsx, DevToolbar.tsx, feature-flags.tsx
const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const IS_TOOLBAR_ENABLED = env === 'local' || env === 'staging'
const POSITION_STORAGE_KEY = 'dev-telemetry-toolbar-position'
const DRAG_THRESHOLD = 4
const MARGIN = 24
const BUTTON_SIZE = 40 // h-10 w-10

// Spring easing: slight overshoot then settle
const SNAP_TRANSITION =
  'top 380ms cubic-bezier(0.34, 1.56, 0.64, 1), left 380ms cubic-bezier(0.34, 1.56, 0.64, 1)'

type SnapPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

// All positions expressed as pixel top+left so transitions interpolate cleanly
function getSnapCoords(
  position: SnapPosition,
  vw: number,
  vh: number
): { top: number; left: number } {
  const [row, col] = position.split('-')
  const top =
    row === 'top'
      ? MARGIN
      : row === 'bottom'
        ? vh - MARGIN - BUTTON_SIZE
        : Math.round(vh / 2 - BUTTON_SIZE / 2)
  const left =
    col === 'left'
      ? MARGIN
      : col === 'right'
        ? vw - MARGIN - BUTTON_SIZE
        : Math.round(vw / 2 - BUTTON_SIZE / 2)
  return { top, left }
}

function getNearestSnapPosition(cx: number, cy: number): SnapPosition {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const row = cy < vh / 3 ? 'top' : cy > (2 * vh) / 3 ? 'bottom' : 'middle'
  const col = cx < vw / 3 ? 'left' : cx > (2 * vw) / 3 ? 'right' : 'center'
  return `${row}-${col}` as SnapPosition
}

function readStoredPosition(): SnapPosition {
  if (typeof window === 'undefined') return 'bottom-right'
  return (localStorage.getItem(POSITION_STORAGE_KEY) as SnapPosition) ?? 'bottom-right'
}

export function DevToolbarTrigger() {
  const { isEnabled, isOpen, setIsOpen, events } = useDevToolbar()
  const [snapPosition, setSnapPosition] = useState<SnapPosition>('bottom-right')
  const [hasHydrated, setHasHydrated] = useState(false)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  // Holds the last drag pixel position for one RAF to prime the CSS transition
  const [releasedAt, setReleasedAt] = useState<{ x: number; y: number } | null>(null)
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1920,
    h: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }))

  const dragRef = useRef<{
    startPointerX: number
    startPointerY: number
    startButtonX: number
    startButtonY: number
    hasDragged: boolean
  } | null>(null)
  const wasDraggingRef = useRef(false)

  // Restore persisted position after mount to avoid SSR hydration mismatch.
  // hasHydrated is set via RAF so the correct position is painted before transitions are enabled,
  // preventing the spring animation from firing on initial load.
  useEffect(() => {
    const stored = readStoredPosition()
    if (stored !== 'bottom-right') setSnapPosition(stored)
    const id = requestAnimationFrame(() => setHasHydrated(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Keep snap coords accurate on resize
  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Two-phase snap: hold last drag position for one frame (primes the transition),
  // then clear it so the spring fires from that position to the snap target
  useEffect(() => {
    if (releasedAt === null) return
    const id = requestAnimationFrame(() => setReleasedAt(null))
    return () => cancelAnimationFrame(id)
  }, [releasedAt])

  const handlePointerDown = useCallback((e: PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    dragRef.current = {
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startButtonX: rect.left,
      startButtonY: rect.top,
      hasDragged: false,
    }
    wasDraggingRef.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startPointerX
    const dy = e.clientY - dragRef.current.startPointerY
    if (!dragRef.current.hasDragged && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    dragRef.current.hasDragged = true
    setDragPos({
      x: dragRef.current.startButtonX + dx,
      y: dragRef.current.startButtonY + dy,
    })
  }, [])

  const handlePointerUp = useCallback((e: PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return
    const { hasDragged } = dragRef.current
    dragRef.current = null
    wasDraggingRef.current = hasDragged
    if (!hasDragged) return
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const newPosition = getNearestSnapPosition(cx, cy)
    setSnapPosition(newPosition)
    localStorage.setItem(POSITION_STORAGE_KEY, newPosition)
    // Phase 1: park at last drag position with transition primed
    setReleasedAt({ x: rect.left, y: rect.top })
    setDragPos(null)
  }, [])

  const handlePointerCancel = useCallback(() => {
    dragRef.current = null
    wasDraggingRef.current = false
    setDragPos(null)
    setReleasedAt(null)
  }, [])

  if (!IS_TOOLBAR_ENABLED || !isEnabled) return null

  const eventCount = events.length
  const isDragging = dragPos !== null
  const snapCoords = getSnapCoords(snapPosition, viewport.w, viewport.h)
  const FULL_TRANSITION = `${SNAP_TRANSITION}, opacity 200ms ease`

  const containerStyle: CSSProperties =
    dragPos !== null
      ? {
          position: 'fixed',
          zIndex: 50,
          left: dragPos.x,
          top: dragPos.y,
          transition: 'none',
          opacity: 1,
        }
      : releasedAt !== null
        ? // Phase 1: same pixel position as drag end, transition now defined
          {
            position: 'fixed',
            zIndex: 50,
            left: releasedAt.x,
            top: releasedAt.y,
            transition: FULL_TRANSITION,
            opacity: isOpen ? 0 : 1,
            pointerEvents: isOpen ? 'none' : undefined,
          }
        : // Phase 2: spring fires from releasedAt → snapCoords
          {
            position: 'fixed',
            zIndex: 50,
            ...snapCoords,
            transition: hasHydrated ? FULL_TRANSITION : 'none',
            opacity: isOpen ? 0 : 1,
            pointerEvents: isOpen ? 'none' : undefined,
          }

  const handleClick = () => {
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false
      return
    }
    setIsOpen(true)
  }

  return (
    <div style={containerStyle}>
      <Button
        type="text"
        className={cn(
          'relative rounded-full h-10 w-10 p-0',
          'bg-surface-100 border border-overlay shadow-md',
          'text-foreground-light hover:text-foreground hover:bg-surface-200',
          'focus-visible:outline-0 focus-visible:outline-transparent focus-visible:outline-offset-0',
          'select-none touch-none',
          isDragging ? 'cursor-grabbing' : 'cursor-pointer'
        )}
        aria-label="Open dev toolbar"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        title="Dev Toolbar"
      >
        <Image
          src="/img/logo-pixel-small-light.png"
          alt="Dev Toolbar"
          width={16}
          height={16}
          style={{
            filter:
              'brightness(0) saturate(100%) invert(72%) sepia(57%) saturate(431%) hue-rotate(108deg) brightness(95%) contrast(91%)',
          }}
          aria-hidden="true"
          className="pointer-events-none"
        />
        {eventCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1',
              'h-4 min-w-4 px-0.5',
              'inline-flex items-center justify-center',
              'rounded-full bg-destructive text-foreground',
              'text-[10px] font-medium leading-none'
            )}
          >
            {eventCount > 99 ? '99+' : eventCount}
          </span>
        )}
      </Button>
    </div>
  )
}
