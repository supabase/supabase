'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { cn } from 'ui'
import { useBreakpoint } from 'common'
import { AnimatedGridBackground } from '../AnimatedGridBackground'

const stats = [
  { label: 'GitHub stars', value: '+10,000' },
  { label: 'Databases created', value: '15M+' },
  { label: 'Realtime messages', value: '280B+' },
  { label: 'Edge Functions invoked', value: '49B+' },
  { label: 'Petabytes stored', value: '64 PB' },
  { label: 'Peak connections', value: '193K' },
  { label: 'Projects created', value: '12M+' },
  { label: 'Images transformed', value: '64M+' },
]

// Animation timing configuration
const BUBBLE_CONFIG = {
  // Lifetime
  lifetimeMin: 5000, // minimum bubble lifetime in ms
  lifetimeMax: 10000, // maximum bubble lifetime in ms

  // Spawn timing
  spawnIntervalMin: 2000, // minimum time between spawns in ms
  spawnIntervalMax: 3500, // maximum time between spawns in ms
  initialDelays: [1200, 1300, 1100, 1400], // staggered initial spawn delays (3-4 bubbles)
  maxBubbles: 4, // maximum bubbles visible at once

  // Positioning
  minDistance: 18, // minimum distance between bubble centers (percentage)
}

type FloatingStatBubble = {
  id: number
  stat: (typeof stats)[number]
  top: number
  left: number
}

function getDistance(
  box1: { top: number; left: number },
  box2: { top: number; left: number }
): number {
  return Math.sqrt(Math.pow(box1.top - box2.top, 2) + Math.pow(box1.left - box2.left, 2))
}

function generateNonOverlappingPosition(
  existingBubbles: FloatingStatBubble[],
  isMobile: boolean
): { top: number; left: number } | null {
  const maxAttempts = 20

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const top = isMobile
      ? Math.random() * 50 + 10 // 10-60% on mobile
      : Math.random() * 70 + 10 // 10-80% on desktop
    // On mobile, use a narrower, more centered range to prevent overflow
    const left = isMobile
      ? Math.random() * 20 + 20 // 20-40% on mobile
      : Math.random() * 70 + 10 // 10-80% on desktop

    const hasOverlap = existingBubbles.some(
      (bubble) =>
        getDistance({ top, left }, { top: bubble.top, left: bubble.left }) <
        BUBBLE_CONFIG.minDistance
    )

    if (!hasOverlap) {
      return { top, left }
    }
  }

  return null
}

function generateRandomBubble(
  id: number,
  existingBubbles: FloatingStatBubble[],
  usedStatIndices: Set<number>,
  isMobile: boolean
): FloatingStatBubble | null {
  const position = generateNonOverlappingPosition(existingBubbles, isMobile)

  if (!position) {
    return null
  }

  // Find an unused stat, or pick a random one if all have been used
  let statIndex: number
  const availableIndices = stats.map((_, i) => i).filter((i) => !usedStatIndices.has(i))

  if (availableIndices.length > 0) {
    statIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
  } else {
    statIndex = Math.floor(Math.random() * stats.length)
  }

  return {
    id,
    stat: stats[statIndex],
    top: position.top,
    left: position.left,
  }
}

function FloatingStatBubbles() {
  const [bubbles, setBubbles] = useState<FloatingStatBubble[]>([])
  const bubbleIdRef = useRef(0)
  const usedStatIndicesRef = useRef<Set<number>>(new Set())
  const lifetimeTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const isMobile = useBreakpoint(768)

  useEffect(() => {
    const spawnBubble = () => {
      setBubbles((prev) => {
        // Limit max bubbles on screen
        if (prev.length >= BUBBLE_CONFIG.maxBubbles) {
          return prev
        }

        const id = bubbleIdRef.current++
        const newBubble = generateRandomBubble(id, prev, usedStatIndicesRef.current, isMobile)

        if (!newBubble) {
          return prev
        }

        // Track which stat index was used
        const statIndex = stats.indexOf(newBubble.stat)
        usedStatIndicesRef.current.add(statIndex)

        const lifetime =
          Math.random() * (BUBBLE_CONFIG.lifetimeMax - BUBBLE_CONFIG.lifetimeMin) +
          BUBBLE_CONFIG.lifetimeMin
        const timerId = setTimeout(() => {
          setBubbles((current) => current.filter((bubble) => bubble.id !== id))
          usedStatIndicesRef.current.delete(statIndex)
          lifetimeTimersRef.current.delete(timerId)
        }, lifetime)
        lifetimeTimersRef.current.add(timerId)

        return [...prev, newBubble]
      })
    }

    const initialTimers = BUBBLE_CONFIG.initialDelays.map((delay) => setTimeout(spawnBubble, delay))

    let intervalId: ReturnType<typeof setTimeout>
    const scheduleNextSpawn = () => {
      intervalId = setTimeout(
        () => {
          spawnBubble()
          scheduleNextSpawn()
        },
        BUBBLE_CONFIG.spawnIntervalMin +
          Math.random() * (BUBBLE_CONFIG.spawnIntervalMax - BUBBLE_CONFIG.spawnIntervalMin)
      )
    }
    scheduleNextSpawn()

    return () => {
      initialTimers.forEach(clearTimeout)
      clearTimeout(intervalId)
      lifetimeTimersRef.current.forEach(clearTimeout)
      lifetimeTimersRef.current.clear()
    }
  }, [isMobile])

  return (
    <AnimatePresence>
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className={cn(
            'absolute pointer-events-none px-3 py-2 bg-surface-100 border rounded-lg shadow-sm'
          )}
          style={{
            top: `${bubble.top}%`,
            left: `${bubble.left}%`,
          }}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 0.98, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{
            opacity: { duration: 0.75, type: 'spring' },
            scale: {
              type: 'spring',
              duration: 0.7,
              bounce: 0.15,
            },
          }}
        >
          <p className="text-sm font-mono font-medium text-brand-link dark:text-brand whitespace-nowrap">
            {bubble.stat.value}
          </p>
          <p className="text-xs text-foreground-light whitespace-nowrap">{bubble.stat.label}</p>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

export function Home() {
  return (
    <div className="h-[calc(100dvh-64px)] flex flex-col max-w-[60rem] mx-auto w-[95%] md:w-full">
      <section className="relative border-x border-b h-full">
        {/* Grid background */}
        <AnimatedGridBackground
          cols={5}
          rows={{
            desktop: 4,
            mobile: 8,
          }}
          tiles={[
            { cell: 1, type: 'dots' },
            { cell: 6, type: 'dots' },
            { cell: 7, type: 'stripes' },
            { cell: 8, type: 'stripes' },
            { cell: 13, type: 'dots' },
            { cell: 18, type: 'dots' },
          ]}
        />

        {/* Floating stat bubbles */}
        <FloatingStatBubbles />

        {/* Content */}
        <div className="flex flex-col justify-end h-full px-4 lg:px-8 py-0 relative">
          <h1 className="font-medium tracking-tighter text-6xl md:text-7xl lg:text-[5.6rem] translate-y-2 lg:translate-y-[10px]">
            Supabase Wrapped
          </h1>
        </div>
      </section>

      <div className="relative w-full border-x border-b px-6 lg:px-10 py-12">
        <article className="text-lg">
          <p>You created more Supabase databases in 2025 than in all previous years combined.</p>
        </article>
      </div>
    </div>
  )
}
