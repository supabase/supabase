import type { KeyboardEvent, PointerEvent } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'

import type { BrushEdge, BrushMode, BrushRect, TimeWindow } from '../types'
import { brushRect, isFullWindow, panWindow, pxToMs, resizeWindow, windowFromDrag } from '../utils'

export interface UseBrushOptions {
  bounds: TimeWindow
  window: TimeWindow
  width: number
  onWindowChange: (window: TimeWindow) => void
  onReset?: () => void
  minDurationMs?: number
  clickThresholdPx?: number
  keyboardStepFraction?: number
}

interface DragState {
  mode: BrushMode
  pointerId: number
  originX: number
  trackLeft: number
  originWindow: TimeWindow
  moved: boolean
}

export interface BrushTrackProps {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onPointerUp: (event: PointerEvent<HTMLElement>) => void
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void
  onDoubleClick: () => void
}

export interface BrushBodyProps extends Omit<BrushTrackProps, 'onDoubleClick'> {
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  tabIndex: number
}

export interface BrushHandleProps extends Omit<BrushTrackProps, 'onDoubleClick'> {
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  role: 'slider'
  tabIndex: number
  'aria-valuemin': number
  'aria-valuemax': number
  'aria-valuenow': number
  'aria-orientation': 'horizontal'
}

export interface UseBrushResult {
  rect: BrushRect
  mode: BrushMode
  isDragging: boolean
  isFull: boolean
  getTrackProps: () => BrushTrackProps
  getBrushProps: () => BrushBodyProps
  getHandleProps: (edge: BrushEdge) => BrushHandleProps
}

export function useBrush(options: UseBrushOptions): UseBrushResult {
  const {
    bounds,
    window,
    width,
    onWindowChange,
    onReset,
    minDurationMs,
    clickThresholdPx = 3,
    keyboardStepFraction = 0.05,
  } = options

  const [mode, setMode] = useState<BrushMode>('idle')
  const drag = useRef<DragState | null>(null)

  const latest = useRef({ bounds, window, width, onWindowChange, onReset, minDurationMs })
  latest.current = { bounds, window, width, onWindowChange, onReset, minDurationMs }

  const reset = useCallback(() => {
    const { onReset: handleReset, onWindowChange: change, bounds: b } = latest.current
    if (handleReset) handleReset()
    else change([b[0], b[1]])
  }, [])

  const begin = useCallback((event: PointerEvent<HTMLElement>, nextMode: BrushMode) => {
    if (event.button !== 0) return
    const track = event.currentTarget.closest<HTMLElement>('[data-trace-brush-track]')
    const trackLeft = (track ?? event.currentTarget).getBoundingClientRect().left
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      mode: nextMode,
      pointerId: event.pointerId,
      originX: event.clientX - trackLeft,
      trackLeft,
      originWindow: latest.current.window,
      moved: false,
    }
    setMode(nextMode)
  }, [])

  const move = useCallback((event: PointerEvent<HTMLElement>) => {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return
    const { bounds: b, width: w, onWindowChange: change, minDurationMs: min } = latest.current
    const x = event.clientX - state.trackLeft
    const dx = x - state.originX
    if (Math.abs(dx) >= 1) state.moved = true
    if (!state.moved) return

    switch (state.mode) {
      case 'create':
        change(windowFromDrag(pxToMs(state.originX, b, w), pxToMs(x, b, w), b, min))
        break
      case 'move': {
        const deltaMs = pxToMs(dx, b, w) - b[0]
        change(panWindow(state.originWindow, deltaMs, b))
        break
      }
      case 'resize-start':
        change(resizeWindow(state.originWindow, 'start', pxToMs(x, b, w), b, min))
        break
      case 'resize-end':
        change(resizeWindow(state.originWindow, 'end', pxToMs(x, b, w), b, min))
        break
      default:
        break
    }
  }, [])

  const end = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const state = drag.current
      if (!state || state.pointerId !== event.pointerId) return
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      const { bounds: b, width: w, window: current, onWindowChange: change } = latest.current
      const x = event.clientX - state.trackLeft
      const isClick = Math.abs(x - state.originX) < clickThresholdPx
      if (state.mode === 'create' && isClick && !isFullWindow(current, b)) {
        const size = current[1] - current[0]
        change(panWindow(current, pxToMs(x, b, w) - size / 2 - current[0], b))
      }
      drag.current = null
      setMode('idle')
    },
    [clickThresholdPx]
  )

  const sharedPointerProps = useMemo(
    () => ({ onPointerMove: move, onPointerUp: end, onPointerCancel: end }),
    [move, end]
  )

  const getTrackProps = useCallback(
    (): BrushTrackProps => ({
      onPointerDown: (event) => {
        if (event.target !== event.currentTarget) return
        begin(event, 'create')
      },
      ...sharedPointerProps,
      onDoubleClick: reset,
    }),
    [begin, sharedPointerProps, reset]
  )

  const keyboardPan = useCallback(
    (direction: -1 | 1) => {
      const { bounds: b, window: current, onWindowChange: change } = latest.current
      const step = (current[1] - current[0]) * keyboardStepFraction * direction
      change(panWindow(current, step, b))
    },
    [keyboardStepFraction]
  )

  const keyboardResize = useCallback(
    (edge: BrushEdge, direction: -1 | 1) => {
      const {
        bounds: b,
        window: current,
        onWindowChange: change,
        minDurationMs: min,
      } = latest.current
      const step = (b[1] - b[0]) * keyboardStepFraction * direction
      const ms = (edge === 'start' ? current[0] : current[1]) + step
      change(resizeWindow(current, edge, ms, b, min))
    },
    [keyboardStepFraction]
  )

  const getBrushProps = useCallback(
    (): BrushBodyProps => ({
      onPointerDown: (event) => {
        if (event.target !== event.currentTarget) return
        event.stopPropagation()
        begin(event, 'move')
      },
      ...sharedPointerProps,
      onKeyDown: (event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          keyboardPan(-1)
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          keyboardPan(1)
        } else if (event.key === 'Escape' || event.key === 'Home') {
          event.preventDefault()
          reset()
        }
      },
      tabIndex: 0,
    }),
    [begin, sharedPointerProps, keyboardPan, reset]
  )

  const getHandleProps = useCallback(
    (edge: BrushEdge): BrushHandleProps => ({
      onPointerDown: (event) => {
        event.stopPropagation()
        begin(event, edge === 'start' ? 'resize-start' : 'resize-end')
      },
      ...sharedPointerProps,
      onKeyDown: (event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          keyboardResize(edge, -1)
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          keyboardResize(edge, 1)
        }
      },
      role: 'slider',
      tabIndex: 0,
      'aria-valuemin': bounds[0],
      'aria-valuemax': bounds[1],
      'aria-valuenow': edge === 'start' ? window[0] : window[1],
      'aria-orientation': 'horizontal',
    }),
    [begin, sharedPointerProps, keyboardResize, bounds, window]
  )

  return {
    rect: brushRect(window, bounds, width),
    mode,
    isDragging: mode !== 'idle',
    isFull: isFullWindow(window, bounds),
    getTrackProps,
    getBrushProps,
    getHandleProps,
  }
}
