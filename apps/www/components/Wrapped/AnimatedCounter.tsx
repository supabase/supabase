'use client'

import { useCallback, useEffect, useRef } from 'react'

interface AnimatedCounterProps {
  value: number
  increment: number
  intervalMs?: number
  compact?: boolean
}

export function AnimatedCounter({
  value,
  increment,
  intervalMs = 1000,
  compact,
}: AnimatedCounterProps) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const countRef = useRef(value)
  const lastUpdateRef = useRef(0)
  const isVisibleRef = useRef(false)
  const rafIdRef = useRef<number>()

  const formatNumber = useCallback(
    (num: number) => {
      if (compact) {
        return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
          num
        )
      }
      return num.toLocaleString()
    },
    [compact]
  )

  // Update countRef when value prop changes
  useEffect(() => {
    countRef.current = value
    if (spanRef.current) {
      spanRef.current.textContent = formatNumber(value)
    }
  }, [value, formatNumber])

  useEffect(() => {
    // Set initial content
    if (spanRef.current) {
      spanRef.current.textContent = formatNumber(countRef.current)
    }

    if (increment <= 0) return

    const tick = (timestamp: number) => {
      if (isVisibleRef.current && timestamp - lastUpdateRef.current >= intervalMs) {
        countRef.current += increment
        if (spanRef.current) {
          spanRef.current.textContent = formatNumber(countRef.current)
        }
        lastUpdateRef.current = timestamp
      }
      rafIdRef.current = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting
        })
      },
      { threshold: 0 }
    )

    if (spanRef.current) {
      observer.observe(spanRef.current)
    }

    rafIdRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      observer.disconnect()
    }
  }, [increment, intervalMs, formatNumber])

  return <span ref={spanRef} />
}
