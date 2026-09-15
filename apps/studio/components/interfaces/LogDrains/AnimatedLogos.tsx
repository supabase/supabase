import { AnimatePresence, motion } from 'framer-motion'
import { Axiom, Datadog, Grafana, Last9, Otlp, Sentry } from 'icons'
import { BracesIcon, Cloud, Server } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from 'ui'

interface AnimatedLogosProps {
  iconSize?: number
  className?: string
}

export const AnimatedLogos = ({ iconSize = 36, className }: AnimatedLogosProps) => {
  const [currIndex, setCurrIndex] = useState(0)
  const timer = 2500

  const centerWrapperSize = Math.round(iconSize * 2.67)
  const sideWrapperSize = Math.round(iconSize * 2.22)
  const containerW = Math.round(iconSize * 5.33)
  const containerH = Math.round(iconSize * 3.56)
  const sideOffset = Math.round(iconSize * 2.22)
  const hiddenOffset = Math.round(iconSize * 3.33)

  const logos = [
    { id: 'webhook', name: 'Custom Endpoint', icon: <BracesIcon size={iconSize} /> },
    { id: 'otlp', name: 'OTLP', icon: <Otlp fill="currentColor" size={iconSize} /> },
    { id: 'datadog', name: 'Datadog', icon: <Datadog fill="currentColor" size={iconSize} /> },
    { id: 'loki', name: 'Loki', icon: <Grafana fill="currentColor" size={iconSize} /> },
    { id: 's3', name: 'Amazon S3', icon: <Cloud size={iconSize} /> },
    { id: 'sentry', name: 'Sentry', icon: <Sentry fill="currentColor" size={iconSize} /> },
    { id: 'axiom', name: 'Axiom', icon: <Axiom fill="currentColor" size={iconSize} /> },
    { id: 'last9', name: 'Last9', icon: <Last9 fill="currentColor" size={iconSize} /> },
    { id: 'syslog', name: 'Syslog', icon: <Server size={iconSize} /> },
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
      x: `calc(-50% + ${hiddenOffset}px)`,
      y: '-50%',
      scale: 0.6,
      opacity: 0,
      filter: 'blur(1px)',
    },
    right: {
      x: `calc(-50% + ${sideOffset}px)`,
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
      x: `calc(-50% - ${sideOffset}px)`,
      y: '-50%',
      scale: 0.8,
      opacity: 0.5,
      zIndex: 2,
      filter: 'blur(1px)',
    },
    exit: {
      x: `calc(-50% - ${hiddenOffset}px)`,
      y: '-50%',
      scale: 0.6,
      opacity: 0,
      filter: 'blur(1px)',
    },
  }

  const visibleIndices = [getPreviousIndex(), currIndex, getNextIndex()]

  return (
    <div
      className={cn('relative overflow-hidden', className ?? 'mx-auto mb-8')}
      style={{ width: containerW, height: containerH }}
    >
      <AnimatePresence initial={false}>
        {logos.map((logo, index) => {
          if (!visibleIndices.includes(index)) return null

          const position = getPosition(index)
          const isCenter = index === currIndex
          const wrapperSize = isCenter ? centerWrapperSize : sideWrapperSize

          return (
            <motion.div
              key={logo.id}
              className="absolute top-1/2 left-1/2 flex items-center justify-center rounded-lg"
              style={{ width: wrapperSize, height: wrapperSize }}
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
      <div className="absolute -inset-4 bg-linear-to-r from-background-surface-75 via-transparent to-background-surface-75 z-40" />
    </div>
  )
}
