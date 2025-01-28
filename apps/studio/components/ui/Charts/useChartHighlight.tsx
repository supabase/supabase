import { useState } from 'react'

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

  const handleMouseDown = (e: any) => {
    clearHighlight()
    if (!e || !e.activeLabel) return
    setIsSelecting(true)
    setLeft(e.activeLabel)
    setRight(e.activeLabel)
    setCoordinates({ left: e.coordinates, right: undefined })
  }

  const handleMouseMove = (e: any) => {
    if (!isSelecting || !e || !e.activeLabel) return
    setRight(e.activeLabel)
    setCoordinates((prevCoordinates: any) => ({ left: prevCoordinates.left, right: e.coordinates }))
  }

  const handleMouseUp = (e: any) => {
    if (!isSelecting) return
    setIsSelecting(false)
    setPopoverPosition({ x: e.chartX, y: e.chartY })
  }

  const clearHighlight = () => {
    setLeft(undefined)
    setRight(undefined)
    setCoordinates({ left: undefined, right: undefined })
    setPopoverPosition(null)
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
