import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ScrollGradientProps {
  scrollRef: React.RefObject<HTMLElement>
  className?: string
}

export const ScrollGradient = ({ scrollRef, className = '' }: ScrollGradientProps) => {
  const [showGradient, setShowGradient] = useState(false)

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight
    setShowGradient(!isAtBottom)
  }, [scrollRef])

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
