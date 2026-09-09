'use client'

import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { FC, useEffect, useRef } from 'react'

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
 * Formats the in-flight counter value, zero-padding it to the width of the
 * target so the element keeps a stable width during the animation.
 *
 * For percentages the padding is applied to the numeric magnitude and the sign
 * is re-attached afterwards. Padding the signed string directly inserts the
 * zeros before the minus sign (e.g. `"-2.0"` padded to `"-13.4"`'s width yields
 * `"0-2.0"`), producing a garbled value for negative percentages.
 */
export const getPaddedCounterValue = (
  currentValue: number,
  targetValue: number,
  isPercentage: boolean,
  prefix: string = ''
) => {
  if (isPercentage) {
    const prefixed = prefix && currentValue > 0 ? '+' : prefix ? prefix : ''
    const sign = currentValue < 0 ? '-' : ''
    const targetString = Math.abs(targetValue).toFixed(1)
    const currentString = Math.abs(currentValue).toFixed(1)
    const paddedCurrent = sign + currentString.padStart(targetString.length, '0')
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

  const displayValue = useTransform(rounded, (latest) =>
    getPaddedCounterValue(latest, value, isPercentage, prefix)
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
