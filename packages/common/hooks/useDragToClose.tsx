import React from 'react'

/**
 * Custom hook to enable closing bottom drawers by dragging down.
 */
const useDragToClose = ({
  onClose,
  threshold = 100,
}: {
  onClose: Function
  threshold?: number
}) => {
  const [startY, setStartY] = React.useState(0)
  const [currentY, setCurrentY] = React.useState(0)
  const ref = React.useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    setCurrentY(e.touches[0].clientY)
    const translateY = currentY - startY
    if (translateY > 0 && ref.current) {
      ref.current.style.transform = `translateY(${translateY}px)`
    }
  }

  const handleTouchEnd = () => {
    if (currentY - startY > threshold) {
      onClose()
    } else if (ref.current) {
      ref.current.style.transform = 'translateY(0)'
    }
    setStartY(0)
    setCurrentY(0)
  }

  return { ref, handleTouchStart, handleTouchMove, handleTouchEnd }
}

export default useDragToClose
