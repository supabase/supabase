import type { CSSProperties } from 'react'

export const DRAG_THRESHOLD_PX = 8
export const GAP_FROM_BOTTOM = 50
export const SHEET_OPEN_GAP_FRACTION = 0.15
export const DEFAULT_NAV_HEIGHT = 56

export function isMenuContent(content: unknown): boolean {
  return content !== null && typeof content !== 'string'
}

export function shouldShowMenuButton(pathname: string): boolean {
  return (
    pathname.startsWith('/project/') ||
    pathname.startsWith('/org/') ||
    pathname.startsWith('/account')
  )
}

export type Viewport = { width: number; height: number }
export type NavSize = { width: number; height: number }
export type Position = { x: number; y: number }

export function clampPosition(
  current: Position,
  delta: { dx: number; dy: number },
  viewport: Viewport,
  navSize: NavSize
): Position {
  const maxX = Math.max(0, viewport.width - navSize.width)
  const maxY = Math.max(0, viewport.height - navSize.height)
  return {
    x: Math.max(0, Math.min(maxX, current.x + delta.dx)),
    y: Math.max(0, Math.min(maxY, current.y + delta.dy)),
  }
}

export type DragStartState = {
  x: number
  y: number
  startX: number
  startY: number
}

export function getNextPosition(
  dragStart: DragStartState,
  clientX: number,
  clientY: number,
  viewport: Viewport,
  navSize: NavSize,
  threshold: number = DRAG_THRESHOLD_PX
): Position | null {
  const dist = Math.hypot(clientX - dragStart.startX, clientY - dragStart.startY)
  if (dist < threshold) return null
  const dx = clientX - dragStart.startX
  const dy = clientY - dragStart.startY
  return clampPosition({ x: dragStart.x, y: dragStart.y }, { dx, dy }, viewport, navSize)
}

export function getToolbarStyle(params: {
  position: Position | null
  navSize: NavSize
  isSheetOpen: boolean
  viewport: Viewport
  isDragging: boolean
}): CSSProperties {
  const { position, navSize, isSheetOpen, viewport, isDragging } = params
  const { width: navW, height: navH } = navSize
  const vw = viewport.width
  const vh = viewport.height
  const transition = isDragging
    ? 'transform 0ms, z-index 0s'
    : 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), z-index 0s'
  const base: CSSProperties = {
    zIndex: isSheetOpen ? 101 : 41,
    transition,
    touchAction: 'none',
  }

  const centerX = vw > 0 && navW > 0 ? vw / 2 - navW / 2 : 0
  const sheetOpenGapPx = vh * SHEET_OPEN_GAP_FRACTION
  const topWhenSheetOpen = vh > 0 ? sheetOpenGapPx / 2 - navH / 2 : 0
  const defaultYClosed = vh > 0 ? vh - GAP_FROM_BOTTOM - (navH > 0 ? navH : DEFAULT_NAV_HEIGHT) : 0

  if (position === null) {
    return {
      ...base,
      left: '50%',
      top: 0,
      transform: isSheetOpen
        ? `translate(-50%, ${topWhenSheetOpen}px)`
        : `translate(-50%, ${defaultYClosed}px)`,
    }
  }
  if (isSheetOpen) {
    return {
      ...base,
      left: 0,
      top: 0,
      transform: `translate(${centerX}px, ${topWhenSheetOpen}px)`,
    }
  }
  return {
    ...base,
    left: 0,
    top: 0,
    transform: `translate(${position.x}px, ${position.y}px)`,
  }
}
