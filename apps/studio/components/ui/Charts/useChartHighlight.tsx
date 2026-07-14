import dayjs from 'dayjs'
import { useState } from 'react'

type ChartHighlightMouseEvent = {
  activeLabel?: string
  coordinates?: string
  chartX?: number
  chartY?: number
}

type Pixel = { x: number; y: number }

export interface ChartHighlight {
  left: string | undefined
  right: string | undefined
  coordinates: { left?: string; right?: string }
  isSelecting: boolean
  popoverPosition: { x: number; y: number } | null
  handleMouseDown: (e: ChartHighlightMouseEvent) => void
  handleMouseMove: (e: ChartHighlightMouseEvent) => void
  handleMouseUp: (
    e: { chartX?: number; chartY?: number },
    options?: { fallbackRight?: string }
  ) => void
  clearHighlight: () => void
}

export function useChartHighlight(): ChartHighlight {
  const [left, setLeft] = useState<string | undefined>(undefined)
  const [right, setRight] = useState<string | undefined>(undefined)
  const [coordinates, setCoordinates] = useState<{ left?: string; right?: string }>({
    left: undefined,
    right: undefined,
  })
  const [isSelecting, setIsSelecting] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null)
  const [initialPoint, setInitialPoint] = useState<string | undefined>(undefined)
  const [startPixel, setStartPixel] = useState<Pixel | undefined>(undefined)
  const [currentPixel, setCurrentPixel] = useState<Pixel | undefined>(undefined)

  const handleMouseDown = (e: ChartHighlightMouseEvent) => {
    clearHighlight()
    if (!e || !e.activeLabel) return
    setIsSelecting(true)
    setLeft(e.activeLabel)
    setRight(e.activeLabel)
    setInitialPoint(e.activeLabel)
    setCoordinates({ left: e.coordinates, right: e.coordinates })
    if (typeof e.chartX === 'number' && typeof e.chartY === 'number') {
      setStartPixel({ x: e.chartX, y: e.chartY })
    }
  }

  const handleMouseMove = (e: ChartHighlightMouseEvent) => {
    if (!isSelecting || !e || !e.activeLabel) return

    if (typeof e.chartX === 'number' && typeof e.chartY === 'number') {
      setCurrentPixel({ x: e.chartX, y: e.chartY })
    }

    const currentTimestamp = dayjs(e.activeLabel)
    const initialTimestamp = dayjs(initialPoint)

    if (currentTimestamp.isBefore(initialTimestamp)) {
      // If dragging left, update left and keep right as initial
      setLeft(e.activeLabel)
      setRight(initialPoint)
      setCoordinates({
        left: e.coordinates,
        right: coordinates.right,
      })
    } else {
      // If dragging right, update right and keep left as initial
      setRight(e.activeLabel)
      setLeft(initialPoint)
      setCoordinates({
        left: coordinates.left,
        right: e.coordinates,
      })
    }
  }

  const handleMouseUp = (e: unknown, options?: { fallbackRight?: string }) => {
    if (!isSelecting) return
    setIsSelecting(false)
    setInitialPoint(undefined)

    const upPixel: Partial<Pixel> =
      typeof e === 'object' &&
      e !== null &&
      'chartX' in e &&
      'chartY' in e &&
      typeof e.chartX === 'number' &&
      typeof e.chartY === 'number'
        ? { x: e.chartX, y: e.chartY }
        : {}

    if (options?.fallbackRight && left !== undefined && left === right) {
      setRight(options.fallbackRight)
      setCoordinates({ ...coordinates, right: options.fallbackRight })
    }

    // Anchor the popover to the start (leftmost pixel) of the selection rather
    // than wherever the mouse happened to be released.
    const xs = [startPixel?.x, currentPixel?.x, upPixel.x].filter(
      (value): value is number => typeof value === 'number'
    )
    const y = startPixel?.y ?? currentPixel?.y ?? upPixel.y
    if (xs.length > 0 && typeof y === 'number') {
      setPopoverPosition({ x: Math.min(...xs), y })
    }

    setStartPixel(undefined)
    setCurrentPixel(undefined)
  }

  const clearHighlight = () => {
    setLeft(undefined)
    setRight(undefined)
    setCoordinates({ left: undefined, right: undefined })
    setPopoverPosition(null)
    setInitialPoint(undefined)
    setStartPixel(undefined)
    setCurrentPixel(undefined)
  }

  return {
    left,
    right,
    coordinates,
    isSelecting,
    popoverPosition,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearHighlight,
  }
}
