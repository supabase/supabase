'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

const REACTIONS = ['❤️', '😂', '👍'] as const
type ReactionEmoji = (typeof REACTIONS)[number]

type FloatingReaction = {
  id: string
  emoji: ReactionEmoji
  x: number
  drift: number
  scale: number
  duration: number
}

const MAX_AUTO_INTERVAL_MS = 1200
const MIN_AUTO_INTERVAL_MS = 350

function pickReaction(): ReactionEmoji {
  return REACTIONS[Math.floor(Math.random() * REACTIONS.length)]!
}

function createReaction(xPercent: number): FloatingReaction {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    emoji: pickReaction(),
    x: xPercent,
    drift: (Math.random() - 0.5) * 48,
    scale: 0.85 + Math.random() * 0.55,
    duration: 2.2 + Math.random() * 1.4,
  }
}

type BroadcastReactionsProps = {
  className?: string
}

export function BroadcastReactions({ className }: BroadcastReactionsProps) {
  const [reactions, setReactions] = useState<FloatingReaction[]>([])
  const sequenceRef = useRef(0)

  const spawnReaction = useCallback((xPercent: number) => {
    sequenceRef.current += 1
    const reaction = createReaction(xPercent)

    setReactions((current) => [...current.slice(-18), reaction])
  }, [])

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect()
      const xPercent = ((event.clientX - bounds.left) / bounds.width) * 100
      spawnReaction(Math.min(92, Math.max(8, xPercent)))
    },
    [spawnReaction]
  )

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    let cancelled = false

    const scheduleNext = () => {
      const delay = MIN_AUTO_INTERVAL_MS + Math.random() * (MAX_AUTO_INTERVAL_MS - MIN_AUTO_INTERVAL_MS)

      timeoutId = setTimeout(() => {
        if (cancelled) return

        spawnReaction(12 + Math.random() * 76)
        scheduleNext()
      }, delay)
    }

    spawnReaction(22)
    spawnReaction(68)
    scheduleNext()

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [spawnReaction])

  const removeReaction = useCallback((id: string) => {
    setReactions((current) => current.filter((reaction) => reaction.id !== id))
  }, [])

  return (
    <div
      className={cn('absolute inset-0 z-10 cursor-pointer touch-none', className)}
      onPointerDown={handlePointerDown}
    >
      <AnimatePresence>
        {reactions.map((reaction) => (
          <motion.span
            key={reaction.id}
            aria-hidden
            className="pointer-events-none absolute bottom-0 select-none text-2xl will-change-transform md:text-3xl"
            style={{
              left: `${reaction.x}%`,
              marginLeft: '-0.75rem',
            }}
            initial={{ opacity: 0, y: 0, x: 0, scale: reaction.scale * 0.6 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: '-115%',
              x: reaction.drift,
              scale: [reaction.scale * 0.6, reaction.scale * 1.08, reaction.scale],
            }}
            transition={{
              duration: reaction.duration,
              ease: 'easeOut',
              times: [0, 0.08, 0.72, 1],
            }}
            onAnimationComplete={() => removeReaction(reaction.id)}
          >
            {reaction.emoji}
          </motion.span>
        ))}
      </AnimatePresence>

      <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[10px] text-foreground-lighter/80">
        Tap to react
      </p>
    </div>
  )
}
