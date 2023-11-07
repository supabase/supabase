import React, { PropsWithChildren, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from 'ui'
import { isBrowser } from 'common'

interface Props {
  outerClassName?: string
  innerClassName?: string
  hasActiveOnHover?: boolean
  activeColor?: 'default' | 'brand'
  hasShimmer?: boolean
  hasInnerShimmer?: boolean
  shimmerFromColor?: string
  shimmerToColor?: string
  hasMotion?: boolean
}

const Panel = ({
  outerClassName,
  innerClassName,
  hasActiveOnHover = false,
  activeColor = 'default',
  hasShimmer = false,
  hasInnerShimmer = false,
  shimmerFromColor,
  shimmerToColor,
  hasMotion = false,
  children,
}: PropsWithChildren<Props>) => {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const Component = hasMotion ? motion.div : 'div'
  const trackCursor = hasShimmer || hasInnerShimmer

  const handleGlow = (event: any) => {
    if (!trackCursor || !outerRef.current || !innerRef.current) return null

    const outerElement = outerRef.current as HTMLDivElement
    const innerElement = innerRef.current as HTMLDivElement
    const { x: elX, y: elY, width, height } = outerElement.getBoundingClientRect()
    const x = event.clientX - elX
    const y = event.clientY - elY
    const isActive = x > -0 && x < width + 0 && y > -0 && y < height + 0

    if (hasShimmer) {
      const activeGlow =
        hasActiveOnHover && isActive
          ? `radial-gradient(65rem circle at ${x}px ${y}px, ${
              activeColor === 'brand' ? 'var(--colors-brand9)' : 'hsl(var(--foreground-muted))'
            }, transparent), `
          : ''
      outerElement.style.backgroundImage = `
      ${activeGlow}radial-gradient(30rem circle at ${x}px ${y}px, ${
        shimmerFromColor ?? 'hsl(var(--border-strong))'
      }, ${shimmerToColor ?? 'hsl(var(--background-surface-300))'})`
    }

    if (hasInnerShimmer) {
      innerElement.style.backgroundImage = isActive
        ? `radial-gradient(7rem circle at ${x}px ${y}px, hsl(var(--background-surface-300)), transparent), radial-gradient(20rem circle at ${x}px ${y}px, hsl(var(--background-surface-200)), transparent)`
        : ''
    }
  }

  useEffect(() => {
    if (!isBrowser) return

    window.addEventListener('mousemove', handleGlow)
    return () => {
      window.removeEventListener('mousemove', handleGlow)
    }
  }, [])

  return (
    <Component
      ref={outerRef}
      className={cn(
        'relative rounded-xl bg-surface-100 bg-gradient-to-b from-border to-surface-200 p-px transition-all shadow-md',
        !trackCursor && hasActiveOnHover
          ? activeColor === 'brand'
            ? 'hover:bg-none hover:!bg-brand'
            : 'hover:bg-none hover:!bg-foreground-muted'
          : '',
        outerClassName
      )}
      {...(hasMotion ? { whileHover: 'hover', animate: 'initial' } : undefined)}
    >
      <div
        className={cn(
          'relative z-10 w-full h-full rounded-xl bg-surface-100 overflow-hidden text-foreground-light',
          innerClassName
        )}
      >
        {children}
        <div
          ref={innerRef}
          className="absolute z-10 inset-0 w-full h-full pointer-events-none opacity-20"
        />
      </div>
    </Component>
  )
}

export default Panel
