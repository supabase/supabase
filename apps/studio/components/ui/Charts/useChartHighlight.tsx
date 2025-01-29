import { useState } from 'react'
import dayjs from 'dayjs'

export interface ChartHighlight {
  left: string | undefined
  right: string | undefined
  coordinates: { left: any; right: any }
  isSelecting: boolean
  popoverPosition: { x: number; y: number } | null
  handleMouseDown: (e: { activeLabel?: string; coordinates?: any }) => void
  handleMouseMove: (e: { activeLabel?: string; coordinates?: any }) => void
  handleMouseUp: (e: any) => void
  clearHighlight: () => void
}

export function useChartHighlight(): ChartHighlight {
  const [left, setLeft] = useState<string | undefined>(undefined)
  const [right, setRight] = useState<string | undefined>(undefined)
  const [coordinates, setCoordinates] = useState<any>({ left: undefined, right: undefined })
  const [isSelecting, setIsSelecting] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null)
  const [initialPoint, setInitialPoint] = useState<string | undefined>(undefined)

  const handleMouseDown = (e: any) => {
    clearHighlight()
    if (!e || !e.activeLabel) return
    setIsSelecting(true)
    setLeft(e.activeLabel)
    setRight(e.activeLabel)
    setInitialPoint(e.activeLabel)
    setCoordinates({ left: e.coordinates, right: e.coordinates })
  }

  const handleMouseMove = (e: any) => {
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

  const handleMouseUp = (e: any) => {
    if (!isSelecting) return
    setIsSelecting(false)
    setPopoverPosition({ x: e.chartX, y: e.chartY })
    setInitialPoint(undefined)
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
