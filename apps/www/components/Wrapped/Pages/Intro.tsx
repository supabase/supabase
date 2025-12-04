import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useWrapped } from '../WrappedContext'
import { Dots, Stripes } from '../Visuals'
import { cn } from 'ui'

const titles = [
  'Thank you to our community.',
  'You created more Supabase databases in 2025 than in all previous years combined.',
  "You've stored over 36M objects, and called almost 50M edge functions.",
  "Together, we've launched new ideas, startups, community projects, weekend hackathons…",
  'Thank you for building with us.',
]

const DISPLAY_DURATION = 3000
const FADE_DURATION = 0.5
const MIN_DISTANCE = 25 // Minimum distance between box centers (in percentage)

type FloatingBox = {
  id: number
  type: 'dots' | 'stripes'
  top: number
  left: number
  size: string
  drift: { x: number; y: number } // Direction to drift while visible
}

function getDistance(box1: { top: number; left: number }, box2: { top: number; left: number }) {
  return Math.sqrt(Math.pow(box1.top - box2.top, 2) + Math.pow(box1.left - box2.left, 2))
}

function generateNonOverlappingPosition(
  existingBoxes: FloatingBox[]
): { top: number; left: number } | null {
  const maxAttempts = 20

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const top = Math.random() * 80 + 5
    const left = Math.random() * 80 + 5

    const hasOverlap = existingBoxes.some(
      (box) => getDistance({ top, left }, { top: box.top, left: box.left }) < MIN_DISTANCE
    )

    if (!hasOverlap) {
      return { top, left }
    }
  }

  return null // Couldn't find non-overlapping position
}

function generateRandomBox(id: number, existingBoxes: FloatingBox[]): FloatingBox | null {
  const position = generateNonOverlappingPosition(existingBoxes)

  if (!position) {
    return null
  }

  // Randomly decide: no movement (40%), move X only (30%), or move Y only (30%)
  const movementType = Math.random()
  let driftX = 0
  let driftY = 0

  if (movementType > 0.4) {
    // 60% chance to move
    const driftAmount = (Math.random() > 0.5 ? 1 : -1) * 24
    if (movementType > 0.7) {
      // Move on X axis
      driftX = driftAmount
    } else {
      // Move on Y axis
      driftY = driftAmount
    }
  }

  return {
    id,
    type: Math.random() > 0.5 ? 'dots' : 'stripes',
    top: position.top,
    left: position.left,
    size: `${Math.random() * 60 + 40}px`,
    drift: { x: driftX, y: driftY },
  }
}

export const Intro = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [floatingBoxes, setFloatingBoxes] = useState<FloatingBox[]>([])
  const boxIdRef = useRef(0)
  const { setCurrentPage } = useWrapped()

  // Spawn boxes periodically throughout the intro
  useEffect(() => {
    const spawnBox = () => {
      setFloatingBoxes((prev) => {
        const id = boxIdRef.current++
        const newBox = generateRandomBox(id, prev)

        if (!newBox) {
          return prev // Couldn't find non-overlapping position, skip this spawn
        }

        // Schedule removal of this box after its lifetime (2-4 seconds)
        const lifetime = Math.random() * 2000 + 2000
        setTimeout(() => {
          setFloatingBoxes((current) => current.filter((box) => box.id !== id))
        }, lifetime)

        return [...prev, newBox]
      })
    }

    // Spawn initial boxes with staggered timing
    const initialDelays = [0, 100, 200, 350, 500, 650, 800, 1000]
    const initialTimers = initialDelays.map((delay) => setTimeout(spawnBox, delay))

    // Continue spawning boxes at random intervals
    let intervalId: NodeJS.Timeout
    const scheduleNextSpawn = () => {
      intervalId = setTimeout(
        () => {
          spawnBox()
          scheduleNextSpawn()
        },
        300 + Math.random() * 300
      ) // Every 300-600ms
    }
    scheduleNextSpawn()

    return () => {
      initialTimers.forEach(clearTimeout)
      clearTimeout(intervalId)
    }
  }, [])

  // Handle title progression
  useEffect(() => {
    if (currentIndex >= titles.length - 1) {
      // After the last title is shown, navigate to next page
      const timer = setTimeout(() => {
        setCurrentPage('year-of-ai')
      }, DISPLAY_DURATION)

      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => prev + 1)
    }, DISPLAY_DURATION)

    return () => clearTimeout(timer)
  }, [currentIndex, setCurrentPage])

  return (
    <div className="max-w-[60rem] mx-auto grid place-items-center aspect-[4/3] px-8 relative overflow-hidden">
      {/* Floating boxes */}
      <AnimatePresence>
        {floatingBoxes.map((box) => (
          <motion.div
            key={box.id}
            className={cn('absolute pointer-events-none', box.type === 'stripes' && 'border')}
            style={{
              top: `${box.top}%`,
              left: `${box.left}%`,
              width: box.size,
              height: box.size,
            }}
            initial={{ opacity: 0, scale: 0.95, x: 0, y: 0 }}
            animate={{ opacity: 0.6, scale: 1, x: box.drift.x, y: box.drift.y }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              opacity: { duration: 0.45 },
              scale: { type: 'spring', duration: 0.45, bounce: 0.2 },
              x: { type: 'spring', stiffness: 100, damping: 10 },
              y: { type: 'spring', stiffness: 100, damping: 10 },
            }}
          >
            {box.type === 'dots' ? <Dots /> : <Stripes />}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.h1
          key={currentIndex}
          className="h1 text-center relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            ease: 'easeIn',
            duration: FADE_DURATION,
          }}
        >
          {titles[currentIndex]}
        </motion.h1>
      </AnimatePresence>
    </div>
  )
}
