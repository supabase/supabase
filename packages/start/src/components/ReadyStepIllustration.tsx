'use client'

import { motion, useAnimationControls } from 'framer-motion'
import { useEffect } from 'react'

import { CreateProjectFolderIllustration } from './CreateProjectFolderIllustration'

function getRandomWiggleDelay() {
  return 1800 + Math.random() * 2800
}

export function ReadyStepIllustration() {
  const controls = useAnimationControls()

  useEffect(() => {
    let timeoutId: number
    let cancelled = false

    const wiggle = async () => {
      await controls.start({
        rotate: [0, -3, 3, -2, 2, 0],
        transition: { duration: 0.45, ease: 'easeInOut' },
      })

      if (cancelled) return

      timeoutId = window.setTimeout(() => {
        void wiggle()
      }, getRandomWiggleDelay())
    }

    timeoutId = window.setTimeout(() => {
      void wiggle()
    }, getRandomWiggleDelay())

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [controls])

  return (
    <motion.div
      className="mb-10 flex justify-start"
      animate={controls}
      style={{ transformOrigin: '0% 85%' }}
    >
      <CreateProjectFolderIllustration className="h-20 w-auto" />
    </motion.div>
  )
}
