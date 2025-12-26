'use client'

import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import React, { FC, useEffect, useRef } from 'react'

import { cn } from '../../lib/utils/cn'

export interface AnimatedCounterProps {
  /**
   * The target value to animate to
   */
  value: number
  /**
   * Animation duration in seconds
   * @default 2.5
   */
  duration?: number
  /**
   * Animation delay in seconds
   * @default 0.25
   */
  delay?: number
  /**
   * Whether the value represents a percentage
   * @default false
   */
  isPercentage?: boolean
  /**
   * Show a prefix before the value, useful for percentages or negative values
   * @default undefined
   */
  // showPlus?: boolean
  prefix?: string
  /**
   * Additional CSS classes to apply
   */
  className?: string
  /**
   * Animation easing function
   * @default 'linear'
   */
  ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | [number, number, number, number]
}

/**
 * AnimatedCounter - A component that animates numbers from 0 to a target value
 *
 * Features:
 * - Smooth number animation with customizable duration and delay
 * - Support for regular numbers and percentages
 * - Automatic padding to prevent layout shifts during animation
 * - Tabular numbers for consistent spacing
 * - Viewport-triggered animation (starts when component comes into view)
 * - Proper comma formatting for large numbers
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AnimatedCounter value={230550} />
 *
 * // Percentage with plus sign
 * <AnimatedCounter
 *   value={13.4}
 *   isPercentage
 *   prefix="+"
 *   duration={3}
 *   delay={0.5}
 * />
 * ```
 */
export const AnimatedCounter: FC<AnimatedCounterProps> = ({
  value,
  duration = 2.5,
  delay = 0.25,
  isPercentage = false,
  prefix = '',
  className = '',
  ease = [0.175, 0.885, 0.32, 1],
}) => {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) =>
    isPercentage ? Math.round(latest * 10) / 10 : Math.round(latest)
  )

  // Calculate padding based on final value
  const getPaddedValue = (currentValue: number, targetValue: number, isPercentage: boolean) => {
    if (isPercentage) {
      const prefixed = prefix && currentValue > 0 ? '+' : prefix ? prefix : ''
      const targetString = targetValue.toFixed(1)
      const currentString = currentValue.toFixed(1)
      const paddedCurrent = currentString.padStart(targetString.length, '0')
      return `${prefixed}${paddedCurrent}%`
    } else {
      const targetString = targetValue.toLocaleString()
      const currentString = currentValue.toLocaleString()
      // Count digits in target (excluding commas)
      const targetDigits = targetString.replace(/,/g, '').length
      const currentDigits = currentString.replace(/,/g, '').length

      if (currentDigits < targetDigits) {
        const paddingNeeded = targetDigits - currentDigits
        const currentWithoutCommas = currentValue.toString()
        const paddedNumber = currentWithoutCommas.padStart(
          currentWithoutCommas.length + paddingNeeded,
          '0'
        )
        // Manually add commas to preserve leading zeros
        return paddedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      }
      return currentString
    }
  }

  const displayValue = useTransform(rounded, (latest) =>
    getPaddedValue(latest, value, isPercentage)
  )

  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration,
        delay,
        ease,
        // type: 'spring',
      })

      return controls.stop
    }
  }, [count, value, duration, delay, isInView, ease])

  return (
    <motion.span ref={ref} className={cn('tabular-nums', className)}>
      {displayValue}
    </motion.span>
  )
}
