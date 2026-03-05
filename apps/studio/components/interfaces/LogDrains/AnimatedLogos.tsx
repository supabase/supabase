import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from 'ui'
import { Datadog, Grafana, Sentry } from 'icons'
import { BracesIcon } from 'lucide-react'

export const AnimatedLogos = () => {
  const [currIndex, setCurrIndex] = useState(0)
  const timer = 2500
  const iconSize = 36

  const logos = [
    {
      id: 'datadog',
      name: 'Datadog',
      icon: <Datadog fill="currentColor" strokeWidth={0} size={iconSize} />,
    },
    {
      id: 'loki',
      name: 'Loki',
      icon: <Grafana fill="currentColor" strokeWidth={0} size={iconSize} />,
    },
    { id: 'https', name: 'HTTPS', icon: <BracesIcon size={iconSize} /> },
    {
      id: 'sentry',
      name: 'Sentry',
      icon: <Sentry fill="currentColor" strokeWidth={0} size={iconSize} />,
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrIndex((prev) => (prev + 1) % logos.length)
    }, timer)
    return () => clearInterval(interval)
  }, [logos.length])

  const getPreviousIndex = () => (currIndex - 1 + logos.length) % logos.length
  const getNextIndex = () => (currIndex + 1) % logos.length

  const getPosition = (index: number) => {
    if (index === currIndex) return 'center'
    if (index === getPreviousIndex()) return 'left'
    if (index === getNextIndex()) return 'right'
    return 'hidden'
  }

  const logoVariants = {
    hidden: {
      x: 'calc(-50% + 120px)',
      y: '-50%',
      scale: 0.6,
      opacity: 0,
      filter: 'blur(1px)',
    },
    right: {
      x: 'calc(-50% + 80px)',
      y: '-50%',
      scale: 0.8,
      opacity: 0.5,
      zIndex: 2,
      filter: 'blur(1px)',
    },
    center: {
      x: '-50%',
      y: '-50%',
      scale: 1,
      opacity: 1,
      zIndex: 3,
      filter: 'blur(0px)',
    },
    left: {
      x: 'calc(-50% - 80px)',
      y: '-50%',
      scale: 0.8,
      opacity: 0.5,
      zIndex: 2,
      filter: 'blur(1px)',
    },
    exit: {
      x: 'calc(-50% - 120px)',
      y: '-50%',
      scale: 0.6,
      opacity: 0,
      filter: 'blur(1px)',
    },
  }

  const visibleIndices = [getPreviousIndex(), currIndex, getNextIndex()]

  return (
    <div className="relative w-48 h-32 mx-auto mb-8 overflow-hidden">
      <AnimatePresence initial={false}>
        {logos.map((logo, index) => {
          if (!visibleIndices.includes(index)) return null

          const position = getPosition(index)
          const isCenter = index === currIndex

          return (
            <motion.div
              key={logo.id}
              className={cn(
                'absolute top-1/2 left-1/2 flex items-center justify-center rounded-lg',
                isCenter ? 'w-24 h-24' : 'w-20 h-20'
              )}
              variants={logoVariants}
              initial="hidden"
              animate={position}
              exit="exit"
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <span>{logo.icon}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
      <div className="absolute -inset-4 bg-gradient-to-r from-background-surface-75 via-transparent to-background-surface-75 z-40" />
    </div>
  )
}
