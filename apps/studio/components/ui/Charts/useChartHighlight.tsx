import { useState } from 'react'

export interface ChartHighlight {
  left: string | undefined
  right: string | undefined
  coordinates: { left: any; right: any }
  isSelecting: boolean
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

  const handleMouseDown = (e: any) => {
    clearHighlight()
    if (!e || !e.activeLabel) return
    setIsSelecting(true)
    setLeft(e.activeLabel)
    setCoordinates((prevCoordinates: any) => ({ left: e.coordinates, right: undefined }))
  }

  const handleMouseMove = (e: any) => {
    if (!isSelecting || !e || !e.activeLabel) return
    console.log('handleMouseMove', e.coordinates, e)
    setRight(e.activeLabel)
    setCoordinates((prevCoordinates: any) => ({ left: prevCoordinates.left, right: e.coordinates }))
  }

  const handleMouseUp = (e: any) => {
    if (!isSelecting) return
    setIsSelecting(false)
  }

  const clearHighlight = () => {
    setLeft(undefined)
    setRight(undefined)
  }

  return {
    left,
    right,
    coordinates,
    isSelecting,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearHighlight,
  }
}
