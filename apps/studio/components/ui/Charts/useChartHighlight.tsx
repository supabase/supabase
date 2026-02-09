import dayjs from 'dayjs'
import { useState } from 'react'

type ChartHighlightMouseEvent = {
  activeLabel?: string
  coordinates?: string
}

export interface ChartHighlight {
  left: string | undefined
  right: string | undefined
  coordinates: { left?: string; right?: string }
  isSelecting: boolean
  popoverPosition: { x: number; y: number } | null
  handleMouseDown: (e: ChartHighlightMouseEvent) => void
  handleMouseMove: (e: ChartHighlightMouseEvent) => void
  handleMouseUp: (e: { chartX?: number; chartY?: number }) => void
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

  const handleMouseDown = (e: ChartHighlightMouseEvent) => {
    clearHighlight()
    if (!e || !e.activeLabel) return
    setIsSelecting(true)
    setLeft(e.activeLabel)
    setRight(e.activeLabel)
    setInitialPoint(e.activeLabel)
    setCoordinates({ left: e.coordinates, right: e.coordinates })
  }

  const handleMouseMove = (e: ChartHighlightMouseEvent) => {
    if (!isSelecting || !e || !e.activeLabel) return

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

  const handleMouseUp = (e: unknown) => {
    if (!isSelecting) return
    setIsSelecting(false)
    setInitialPoint(undefined)

    if (
      typeof e === 'object' &&
      e !== null &&
      'chartX' in e &&
      'chartY' in e &&
      typeof e.chartX === 'number' &&
      typeof e.chartY === 'number'
    ) {
      setPopoverPosition({ x: e.chartX, y: e.chartY })
    }
  }

  const clearHighlight = () => {
    setLeft(undefined)
    setRight(undefined)
    setCoordinates({ left: undefined, right: undefined })
    setPopoverPosition(null)
    setInitialPoint(undefined)
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
