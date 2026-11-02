import dayjs from 'dayjs'
import { useState } from 'react'

type Coordinate = string | number

const toDayjs = (value?: string) => {
  const asNumber = Number(value)
  return value !== undefined && value !== '' && Number.isFinite(asNumber)
    ? dayjs(asNumber)
    : dayjs(value)
}

type ChartHighlightMouseEvent = {
  activeLabel?: string
  coordinates?: Coordinate
  chartX?: number
  chartY?: number
  nextLabel?: string
  nextCoordinate?: Coordinate
}

type Pixel = { x: number; y: number }

export interface ChartHighlight {
  left: string | undefined
  right: string | undefined
  coordinates: { left?: Coordinate; right?: Coordinate }
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
  const [coordinates, setCoordinates] = useState<{ left?: Coordinate; right?: Coordinate }>({
    left: undefined,
    right: undefined,
  })
  const [isSelecting, setIsSelecting] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null)
  const [initialPoint, setInitialPoint] = useState<string | undefined>(undefined)
  const [anchorPixel, setAnchorPixel] = useState<Pixel | undefined>(undefined)
  const [hasDragged, setHasDragged] = useState(false)
  const [nextPoint, setNextPoint] = useState<{ label?: string; coordinate?: Coordinate }>({})

  const handleMouseDown = (e: ChartHighlightMouseEvent) => {
    clearHighlight()
    if (!e || !e.activeLabel) return
    setIsSelecting(true)
    setHasDragged(false)
    setLeft(e.activeLabel)
    setRight(e.activeLabel)
    setInitialPoint(e.activeLabel)
    setNextPoint({ label: e.nextLabel, coordinate: e.nextCoordinate })
    setCoordinates({ left: e.coordinates, right: e.coordinates })
    if (typeof e.chartX === 'number' && typeof e.chartY === 'number') {
      setAnchorPixel({ x: e.chartX, y: e.chartY })
    }
  }

  const handleMouseMove = (e: ChartHighlightMouseEvent) => {
    if (!isSelecting || !e || !e.activeLabel) return

    if (e.activeLabel !== initialPoint) setHasDragged(true)

    const currentTimestamp = toDayjs(e.activeLabel)
    const initialTimestamp = toDayjs(initialPoint)

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

    const isClick = !hasDragged
    if (isClick && nextPoint.label) {
      setRight(nextPoint.label)
      setCoordinates((prev) => ({ ...prev, right: nextPoint.coordinate }))
    }

    // Anchor the popover to where the selection started rather than wherever
    // the mouse happened to be released.
    if (anchorPixel) {
      setPopoverPosition(anchorPixel)
    } else if (
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
    setAnchorPixel(undefined)
    setHasDragged(false)
    setNextPoint({})
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
