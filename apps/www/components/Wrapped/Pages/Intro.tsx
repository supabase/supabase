<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> c9e9354b96 (single page)
'use client'

import * as Scrollytelling from '@bsmnt/scrollytelling'
import { useRef, useState, useEffect } from 'react'
<<<<<<< HEAD
import { motion, AnimatePresence } from 'framer-motion'
=======
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useWrapped } from '../WrappedContext'
>>>>>>> 3525bdad4d (wip)
=======
import { motion, AnimatePresence } from 'framer-motion'
>>>>>>> c9e9354b96 (single page)
import { Dots, Stripes } from '../Visuals'
import { cn } from 'ui'

const titles = [
  'Thank you to our community.',
  'You created more Supabase databases in 2025 than in all previous years combined.',
  "You've stored over 36M objects, and called almost 50M edge functions.",
  "Together, we've launched new ideas, startups, community projects, weekend hackathons…",
  'Thank you for building with us.',
]

<<<<<<< HEAD
<<<<<<< HEAD
const MIN_DISTANCE = 12 // Minimum distance between box centers (in percentage)
=======
const DISPLAY_DURATION = 3000
const FADE_DURATION = 0.5
const MIN_DISTANCE = 25 // Minimum distance between box centers (in percentage)
>>>>>>> 3525bdad4d (wip)
=======
const MIN_DISTANCE = 12 // Minimum distance between box centers (in percentage)
>>>>>>> c9e9354b96 (single page)

type FloatingBox = {
  id: number
  type: 'dots' | 'stripes'
  top: number
  left: number
  size: string
<<<<<<< HEAD
<<<<<<< HEAD
  drift: { x: number; y: number }
=======
  drift: { x: number; y: number } // Direction to drift while visible
>>>>>>> 3525bdad4d (wip)
=======
  drift: { x: number; y: number }
>>>>>>> c9e9354b96 (single page)
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

<<<<<<< HEAD
<<<<<<< HEAD
  return null
=======
  return null // Couldn't find non-overlapping position
>>>>>>> 3525bdad4d (wip)
=======
  return null
>>>>>>> c9e9354b96 (single page)
}

function generateRandomBox(id: number, existingBoxes: FloatingBox[]): FloatingBox | null {
  const position = generateNonOverlappingPosition(existingBoxes)

  if (!position) {
    return null
  }

<<<<<<< HEAD
<<<<<<< HEAD
=======
  // Randomly decide: no movement (40%), move X only (30%), or move Y only (30%)
>>>>>>> 3525bdad4d (wip)
=======
>>>>>>> c9e9354b96 (single page)
  const movementType = Math.random()
  let driftX = 0
  let driftY = 0

  if (movementType > 0.4) {
<<<<<<< HEAD
<<<<<<< HEAD
    const driftAmount = (Math.random() > 0.5 ? 1 : -1) * 24
    if (movementType > 0.7) {
      driftX = driftAmount
    } else {
=======
    // 60% chance to move
=======
>>>>>>> c9e9354b96 (single page)
    const driftAmount = (Math.random() > 0.5 ? 1 : -1) * 24
    if (movementType > 0.7) {
      driftX = driftAmount
    } else {
<<<<<<< HEAD
      // Move on Y axis
>>>>>>> 3525bdad4d (wip)
=======
>>>>>>> c9e9354b96 (single page)
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

<<<<<<< HEAD
<<<<<<< HEAD
function FloatingBoxes() {
  const [floatingBoxes, setFloatingBoxes] = useState<FloatingBox[]>([])
  const boxIdRef = useRef(0)

=======
export const Intro = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
=======
function FloatingBoxes() {
>>>>>>> c9e9354b96 (single page)
  const [floatingBoxes, setFloatingBoxes] = useState<FloatingBox[]>([])
  const boxIdRef = useRef(0)

<<<<<<< HEAD
  // Spawn boxes periodically throughout the intro
>>>>>>> 3525bdad4d (wip)
=======
>>>>>>> c9e9354b96 (single page)
  useEffect(() => {
    const spawnBox = () => {
      setFloatingBoxes((prev) => {
        const id = boxIdRef.current++
        const newBox = generateRandomBox(id, prev)

        if (!newBox) {
<<<<<<< HEAD
<<<<<<< HEAD
          return prev
        }

=======
          return prev // Couldn't find non-overlapping position, skip this spawn
        }

        // Schedule removal of this box after its lifetime (2-4 seconds)
>>>>>>> 3525bdad4d (wip)
=======
          return prev
        }

>>>>>>> c9e9354b96 (single page)
        const lifetime = Math.random() * 2000 + 2000
        setTimeout(() => {
          setFloatingBoxes((current) => current.filter((box) => box.id !== id))
        }, lifetime)

        return [...prev, newBox]
      })
    }

<<<<<<< HEAD
<<<<<<< HEAD
    const initialDelays = [0, 100, 200, 350, 500, 650, 800, 1000]
    const initialTimers = initialDelays.map((delay) => setTimeout(spawnBox, delay))

=======
    // Spawn initial boxes with staggered timing
    const initialDelays = [0, 100, 200, 350, 500, 650, 800, 1000]
    const initialTimers = initialDelays.map((delay) => setTimeout(spawnBox, delay))

    // Continue spawning boxes at random intervals
>>>>>>> 3525bdad4d (wip)
=======
    const initialDelays = [0, 100, 200, 350, 500, 650, 800, 1000]
    const initialTimers = initialDelays.map((delay) => setTimeout(spawnBox, delay))

>>>>>>> c9e9354b96 (single page)
    let intervalId: NodeJS.Timeout
    const scheduleNextSpawn = () => {
      intervalId = setTimeout(
        () => {
          spawnBox()
          scheduleNextSpawn()
        },
        300 + Math.random() * 300
<<<<<<< HEAD
<<<<<<< HEAD
      )
=======
      ) // Every 300-600ms
>>>>>>> 3525bdad4d (wip)
=======
      )
>>>>>>> c9e9354b96 (single page)
    }
    scheduleNextSpawn()

    return () => {
      initialTimers.forEach(clearTimeout)
      clearTimeout(intervalId)
    }
  }, [])

<<<<<<< HEAD
<<<<<<< HEAD
  return (
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
  )
}

export const Intro = () => {
  // Calculate the scroll percentage ranges for each title
  const segmentSize = 100 / titles.length

  return (
    <Scrollytelling.Root>
      <Scrollytelling.Pin childHeight={'100vh'} pinSpacerHeight={`${titles.length * 60}vh`} top={0}>
        <section className="h-screen border-x border-b max-w-[60rem] mx-auto">
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
=======
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

=======
>>>>>>> c9e9354b96 (single page)
  return (
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
<<<<<<< HEAD
          {titles[currentIndex]}
        </motion.h1>
      </AnimatePresence>
    </div>
>>>>>>> 3525bdad4d (wip)
=======
          {box.type === 'dots' ? <Dots /> : <Stripes />}
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

export const Intro = () => {
  // Calculate the scroll percentage ranges for each title
  const segmentSize = 100 / titles.length

  return (
    <Scrollytelling.Root>
      <Scrollytelling.Pin
        childHeight={'100vh'}
        pinSpacerHeight={`${titles.length * 100}vh`}
        top={0}
      >
        <section className="h-screen border-x border-b max-w-[60rem] mx-auto">
          <div className="h-full grid place-items-center px-8 relative overflow-hidden">
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
                  <h1
                    className="h1 text-center absolute inset-x-8 top-1/2 -translate-y-1/2"
                    style={{ opacity: 0, transform: 'translateY(calc(-50% + 30px))' }}
                  >
                    {title}
                  </h1>
                </Scrollytelling.Animation>
              )
            })}
          </div>
        </section>
      </Scrollytelling.Pin>
    </Scrollytelling.Root>
>>>>>>> c9e9354b96 (single page)
  )
}
