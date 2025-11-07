import { AnimatePresence, motion } from 'framer-motion'
import { RefObject, useCallback, useEffect, useState } from 'react'

interface ScrollGradientProps {
  scrollRef: RefObject<HTMLElement>
  className?: string
  offset?: number // Pixels to offset from bottom before showing gradient
}

export const ScrollGradient = ({ scrollRef, className = '', offset = 0 }: ScrollGradientProps) => {
  const [showGradient, setShowGradient] = useState(false)

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isAtBottom = Math.ceil(scrollTop + clientHeight + offset) >= scrollHeight
    setShowGradient(!isAtBottom)
  }, [scrollRef, offset])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial position

    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <AnimatePresence>
      {showGradient && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background-200 pointer-events-none ${className}`}
        />
      )}
    </AnimatePresence>
  )
}
