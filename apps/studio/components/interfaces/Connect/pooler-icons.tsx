'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from 'ui'

// Add these to your existing constants section
const LINE_WIDTH = 2 // SVG container width
const LINE_STROKE_WIDTH = 1 // Width of the actual line
const LINE_OFFSET = 1 // For centering the line in container

const FlowingLine = ({
  x,
  y1,
  y2,
  isActive,
}: {
  x: number
  y1: number
  y2: number
  isActive: boolean
}) => {
  return (
    <AnimatePresence>
      {isActive && (
        <svg
          width={LINE_WIDTH}
          height={y2 - y1 + 6}
          viewBox={`0 0 ${LINE_WIDTH} ${y2 - y1 + 6}`}
          style={{ position: 'absolute', left: x - LINE_OFFSET, top: y1 - 3 }}
        >
          <motion.line
            x1="1"
            y1="3"
            x2="1"
            y2={y2 - y1 + 3}
            stroke="hsl(var(--foreground-default) / 0.6)"
            strokeWidth={LINE_STROKE_WIDTH}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ pathLength: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <defs>
            <motion.linearGradient
              id={`lineGradient-${x}-${y1}-${y2}`}
              gradientUnits="userSpaceOnUse"
              x1="2"
              y1="-20"
              x2="2"
              y2={y2 - y1 + 26}
              animate={{
                y1: [-20, y2 - y1 + 26],
                y2: [0, y2 - y1 + 46],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
                repeatDelay: 0,
              }}
            >
              <stop offset="0" stopColor="hsl(var(--foreground-default) / 0.6)" stopOpacity="0" />
              <stop offset="0.8" stopColor="hsl(var(--foreground-default))" />
              <stop offset="1" stopColor="hsl(var(--foreground-default) / 0.6)" stopOpacity="0" />
            </motion.linearGradient>
          </defs>
          <motion.line
            x1="2"
            y1="3"
            x2="2"
            y2={y2 - y1 + 3}
            stroke={`url(#lineGradient-${x}-${y1}-${y2})`}
            strokeWidth={LINE_STROKE_WIDTH}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </svg>
      )}
    </AnimatePresence>
  )
}

const TopRect = ({ isActive }: { isActive: boolean }) => (
  <motion.rect
    width={RECT_WIDTH}
    height={3}
    className={cn(
      'fill-background-surface-200 stroke-border-stronger stroke-[1]',
      isActive && 'stroke-foreground/40'
    )}
    x={RECT_X}
    y={TOP_RECT_Y}
    rx="1.5"
    animate={{
      boxShadow: isActive ? '0 0 8px #86efac' : '0 0 0px #86efac',
    }}
    transition={{ duration: 0.2 }}
  />
)

const BottomRect = ({ isActive }: { isActive: boolean }) => (
  <motion.rect
    width={RECT_WIDTH}
    height={8}
    className={cn(
      'stroke-brand-500 fill-brand-300 stroke-[1] transition-all',
      isActive && 'fill-brand-400 stroke-brand'
    )}
    x={RECT_X}
    y={BOTTOM_RECT_Y}
    rx="4"
    animate={{
      fill: isActive ? '#2563eb' : '#1e40af',
      stroke: '#93c5fd',
      boxShadow: isActive ? '0 0 8px #93c5fd' : '0 0 0px #93c5fd',
    }}
    transition={{ duration: 0.2 }}
  />
)

// Common y-coordinates for both icons
const TOP_LINE_START = 14 // Start below dots
const TOP_LINE_END = 24 // End above top rect
const BOTTOM_LINE_START = 36 // Start below top rect
const BOTTOM_LINE_END = 41 // End above bottom rect

// Common rect positions and dimensions
const TOP_RECT_Y = 29
const BOTTOM_RECT_Y = 45
const RECT_X = 8
const RECT_WIDTH = 32

// Add to existing constants
const CIRCLE_Y = 9
const CIRCLE_SPACING = 12
const CIRCLE_START_X = 12
const CIRCLE_RADIUS = 1.8

// Static circle for SessionIcon
const ConnectionDot = ({ index, isActive }: { index: number; isActive: boolean }) => (
  <circle
    cx={CIRCLE_START_X + index * CIRCLE_SPACING}
    cy={CIRCLE_Y}
    r={CIRCLE_RADIUS}
    className={isActive ? 'fill-foreground' : 'fill-foreground-lighter'}
  />
)

export const TransactionIcon = () => {
  const [dots, setDots] = useState([false, false, false])
  const [lines, setLines] = useState([false, false, false])
  const [bottomLineActive, setBottomLineActive] = useState(false)

  useEffect(() => {
    // Watch lines state and update bottomLineActive accordingly
    setBottomLineActive(lines.some(Boolean))
  }, [lines])

  useEffect(() => {
    const animateDot = (index: number) => {
      // Clear previous state
      setDots((prev) => {
        const newState = [...prev]
        newState[index] = false
        return newState
      })
      setLines((prev) => {
        const newState = [...prev]
        newState[index] = false
        return newState
      })

      // Step 1: Animate dot in
      setTimeout(() => {
        setDots((prev) => {
          const newState = [...prev]
          newState[index] = true
          return newState
        })
      }, 0)

      // Step 2: After dot is in, wait, then show line
      setTimeout(() => {
        setLines((prev) => {
          const newState = [...prev]
          newState[index] = true
          return newState
        })
      }, 400) // Wait 400ms after dot appears before showing line

      // Step 3: Clear everything
      setTimeout(() => {
        setDots((prev) => {
          const newState = [...prev]
          newState[index] = false
          return newState
        })
        setLines((prev) => {
          const newState = [...prev]
          newState[index] = false
          return newState
        })
      }, 1000) // Total animation duration
    }

    // Initial staggered animation
    setTimeout(() => animateDot(0), 0)
    setTimeout(() => animateDot(1), 200)
    setTimeout(() => animateDot(2), 400)

    // Set up intervals for continuous animation
    const intervals = [0, 1, 2].map((index) =>
      setInterval(() => animateDot(index), 3000 + index * 200)
    )

    return () => intervals.forEach(clearInterval)
  }, [])

  return (
    <div style={{ position: 'relative', width: 48, height: 35 }}>
      <svg width="48" height="35" viewBox="0 0 48 35">
        {[0, 1, 2].map((index) => (
          <React.Fragment key={index}>
            <AnimatePresence>
              {dots[index] && (
                <motion.circle
                  cx={CIRCLE_START_X + index * CIRCLE_SPACING}
                  cy={CIRCLE_Y}
                  r={CIRCLE_RADIUS}
                  className={'fill-foreground'}
                  initial={{
                    scale: 0,
                    x: [-8, -5, -2][index],
                    y: -10,
                  }}
                  animate={{
                    scale: 1,
                    x: 0,
                    y: 0,
                  }}
                  exit={{
                    scale: 0,
                    x: [8, 5, 2][index],
                    y: -10,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </AnimatePresence>
          </React.Fragment>
        ))}
        <TopRect isActive={bottomLineActive} />
        {/* <BottomRect isActive={bottomLineActive} /> */}
      </svg>
      {[0, 1, 2].map((index) => (
        <FlowingLine
          key={index}
          x={CIRCLE_START_X + index * CIRCLE_SPACING}
          y1={TOP_LINE_START}
          y2={TOP_LINE_END}
          isActive={lines[index]}
        />
      ))}
      {/* <FlowingLine
        x={CIRCLE_START_X + 1 * CIRCLE_SPACING}
        y1={BOTTOM_LINE_START}
        y2={BOTTOM_LINE_END}
        isActive={bottomLineActive}
      /> */}
    </div>
  )
}

export const SessionIcon = () => {
  const [topLineStates, setTopLineStates] = useState([false, false, false])
  const [bottomLineStates, setBottomLineStates] = useState([false, false, false])

  useEffect(() => {
    // Function to animate a single dot
    const animateDot = (index: number) => {
      setTopLineStates((prev) => {
        const newState = [...prev]
        newState[index] = true
        return newState
      })

      setTimeout(() => {
        setBottomLineStates((prev) => {
          const newState = [...prev]
          newState[index] = true
          return newState
        })
      }, 300)

      setTimeout(() => {
        setTopLineStates((prev) => {
          const newState = [...prev]
          newState[index] = false
          return newState
        })
        setBottomLineStates((prev) => {
          const newState = [...prev]
          newState[index] = false
          return newState
        })
      }, 5000)
    }

    // Start initial animations immediately with slight delays
    setTimeout(() => animateDot(0), 100)
    setTimeout(() => animateDot(1), 1500)
    setTimeout(() => animateDot(2), 3000)

    // Set up intervals for subsequent animations
    const intervals = [0, 1, 2].map((index) =>
      setInterval(() => animateDot(index), Math.random() * 3000 + 8000)
    )

    return () => intervals.forEach(clearInterval)
  }, [])

  return (
    <div style={{ position: 'relative', width: 48, height: 35 }}>
      <svg width="48" height="35" viewBox="0 0 48 35">
        {[0, 1, 2].map((index) => (
          <g key={index}>
            <ConnectionDot index={index} isActive={topLineStates[index]} />
          </g>
        ))}
        <TopRect isActive={topLineStates.some((state) => state)} />
        {/* <BottomRect isActive={bottomLineStates.some((state) => state)} /> */}
      </svg>
      {[0, 1, 2].map((index) => (
        <React.Fragment key={index}>
          <FlowingLine
            x={CIRCLE_START_X + index * CIRCLE_SPACING}
            y1={TOP_LINE_START}
            y2={TOP_LINE_END}
            isActive={topLineStates[index]}
          />
          {/* <FlowingLine
            x={CIRCLE_START_X + index * CIRCLE_SPACING}
            y1={BOTTOM_LINE_START}
            y2={BOTTOM_LINE_END}
            isActive={bottomLineStates[index]}
          /> */}
        </React.Fragment>
      ))}
    </div>
  )
}
