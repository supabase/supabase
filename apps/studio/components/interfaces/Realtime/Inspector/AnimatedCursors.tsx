import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MousePointer2 } from 'lucide-react'

export const AnimatedCursors = () => {
  const [cursor1Position, setCursor1Position] = useState({ x: 20, y: 20 })
  const [cursor2Position, setCursor2Position] = useState({ x: 180, y: 80 })

  useEffect(() => {
    const animateCursors = () => {
      const newCursor1Position = {
        x: Math.random() * 160 + 20,
        y: Math.random() * 80 + 20,
      }
      const newCursor2Position = {
        x: Math.random() * 160 + 20,
        y: Math.random() * 80 + 20,
      }

      setCursor1Position(newCursor1Position)
      setCursor2Position(newCursor2Position)
    }

    const initialTimer = setTimeout(animateCursors, 1000)

    const interval = setInterval(animateCursors, 3000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="relative w-48 h-32 mx-auto mb-8">
      <motion.div
        className="absolute text-warning"
        animate={{ x: cursor1Position.x, y: cursor1Position.y }}
        transition={{
          duration: 1.2,
          ease: 'easeInOut',
        }}
        style={{ width: 20, height: 20 }}
      >
        <MousePointer2 size={20} />
      </motion.div>
      <motion.div
        className="absolute text-brand"
        animate={{ x: cursor2Position.x, y: cursor2Position.y }}
        transition={{
          duration: 1.2,
          ease: 'easeInOut',
          delay: 0.2,
        }}
        style={{ width: 20, height: 20 }}
      >
        <MousePointer2 size={20} />
      </motion.div>
    </div>
  )
}
