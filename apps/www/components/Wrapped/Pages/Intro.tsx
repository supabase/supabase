'use client'

import * as Scrollytelling from '@bsmnt/scrollytelling'
import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Dots, Stripes } from '../Visuals'
import { cn } from 'ui'

const titles = [
  'Thank you to our community.',
  'You created more Supabase databases in 2025 than in all previous years combined.',
  "You've stored over 36M objects, and called almost 50M edge functions.",
  "Together, we've launched new ideas, startups, community projects, weekend hackathons…",
  'Thank you for building with us.',
]

const MIN_DISTANCE = 12 // Minimum distance between box centers (in percentage)

type FloatingBox = {
  id: number
  type: 'dots' | 'stripes'
  top: number
  left: number
  size: string
  drift: { x: number; y: number }
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

  return null
}

function generateRandomBox(id: number, existingBoxes: FloatingBox[]): FloatingBox | null {
  const position = generateNonOverlappingPosition(existingBoxes)

  if (!position) {
    return null
  }

  const movementType = Math.random()
  let driftX = 0
  let driftY = 0

  if (movementType > 0.4) {
    const driftAmount = (Math.random() > 0.5 ? 1 : -1) * 24
    if (movementType > 0.7) {
      driftX = driftAmount
    } else {
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

function FloatingBoxes() {
  const [floatingBoxes, setFloatingBoxes] = useState<FloatingBox[]>([])
  const boxIdRef = useRef(0)
  const lifetimeTimersRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.3 })

  useEffect(() => {
    if (!isInView) {
      // Clear all boxes when section goes out of view
      setFloatingBoxes([])
      lifetimeTimersRef.current.forEach(clearTimeout)
      lifetimeTimersRef.current.clear()
      return
    }

    const lifetimeTimers = lifetimeTimersRef.current

    const spawnBox = () => {
      setFloatingBoxes((prev) => {
        const id = boxIdRef.current++
        const newBox = generateRandomBox(id, prev)

        if (!newBox) {
          return prev
        }

        const lifetime = Math.random() * 2000 + 2000
        const timerId = setTimeout(() => {
          setFloatingBoxes((current) => current.filter((box) => box.id !== id))
          lifetimeTimers.delete(timerId)
        }, lifetime)
        lifetimeTimers.add(timerId)

        return [...prev, newBox]
      })
    }

    const initialDelays = [0, 100, 200, 350, 500, 650, 800, 1000]
    const initialTimers = initialDelays.map((delay) => setTimeout(spawnBox, delay))

    let intervalId: NodeJS.Timeout
    const scheduleNextSpawn = () => {
      intervalId = setTimeout(
        () => {
          spawnBox()
          scheduleNextSpawn()
        },
        300 + Math.random() * 300
      )
    }
    scheduleNextSpawn()

    return () => {
      initialTimers.forEach(clearTimeout)
      clearTimeout(intervalId)
      lifetimeTimers.forEach(clearTimeout)
      lifetimeTimers.clear()
    }
  }, [isInView])

  return (
    <div ref={containerRef} className="absolute inset-0">
      <AnimatePresence>
        {floatingBoxes.map((box) => (
          <motion.div
            key={box.id}
            className={cn('absolute pointer-events-none border')}
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
    </div>
  )
}

export const Intro = () => {
  // Calculate the scroll percentage ranges for each title
  const segmentSize = 100 / titles.length

  return (
    <Scrollytelling.Root>
      <Scrollytelling.Pin childHeight={'100vh'} pinSpacerHeight={`${titles.length * 60}vh`} top={0}>
        <section className="h-screen border-x border-b max-w-[60rem] mx-auto w-[95%] md:w-full">
          <div className="h-full grid place-items-center px-4 relative overflow-hidden">
            {/* Floating boxes */}
            <FloatingBoxes />

            {/* Content - each title fades in/out based on scroll position */}
            {titles.map((title, index) => {
              const start = index * segmentSize
              const fadeInEnd = start + segmentSize * 0.2
              const fadeOutStart = start + segmentSize * 0.8
              const end = (index + 1) * segmentSize

              return (
                <Scrollytelling.Animation
                  key={index}
                  tween={[
                    // Fade in: opacity 0 -> 1
                    {
                      start,
                      end: fadeInEnd,
                      to: { opacity: 1, filter: 'blur(0px)' },
                    },
                    // Fade out (except for last item)
                    ...(index < titles.length - 1
                      ? [
                          {
                            start: fadeOutStart,
                            end,
                            to: { opacity: 0, filter: 'blur(4px)' },
                          },
                        ]
                      : []),
                  ]}
                >
                  <p
                    className="h1 text-center absolute inset-x-8 top-1/2 -translate-y-1/2"
                    style={{ opacity: 0, transform: 'translateY(calc(-50% + 30px))' }}
                  >
                    {title}
                  </p>
                </Scrollytelling.Animation>
              )
            })}
          </div>
        </section>
      </Scrollytelling.Pin>
    </Scrollytelling.Root>
  )
}
