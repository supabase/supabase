import React, { PropsWithChildren, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { detectBrowser } from 'common'

interface Props {
  outerClassName?: string
  innerClassName?: string
  hasActiveOnHover?: boolean
  activeColor?: 'default' | 'brand'
  hasShimmer?: boolean
  hasInnerShimmer?: boolean
  shimmerFromColor?: string
  shimmerToColor?: string
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
  children,
}: PropsWithChildren<Props>) => {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const trackCursor = hasShimmer || hasInnerShimmer

  const handleGlow = (event: any) => {
    if (!outerRef.current || !innerRef.current) return null

    const outerElement = outerRef.current as HTMLDivElement
    const innerElement = innerRef.current as HTMLDivElement
    const { x: elX, y: elY, width, height } = outerElement.getBoundingClientRect()
    const x = event.clientX - elX
    const y = event.clientY - elY
    const isActive = x > -0 && x < width + 0 && y > -0 && y < height + 0

    if (hasShimmer) {
      const activeGlow =
        hasActiveOnHover && isActive
          ? `radial-gradient(65rem circle at ${x}px ${y}px, var(${
              activeColor === 'brand' ? '--colors-brand9' : '--colors-scale9'
            }), transparent), `
          : ''
      outerElement.style.backgroundImage = `
      ${activeGlow}radial-gradient(30rem circle at ${x}px ${y}px, ${
        shimmerFromColor ?? 'var(--colors-scale8)'
      }, ${shimmerToColor ?? 'var(--colors-scale5)'})`
    }

    if (hasInnerShimmer) {
      innerElement.style.backgroundImage = isActive
        ? `radial-gradient(7rem circle at ${x}px ${y}px, var(--colors-scale5), transparent), radial-gradient(20rem circle at ${x}px ${y}px, var(--colors-scale4), transparent)`
        : ''
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !trackCursor) return

    window.addEventListener('mousemove', handleGlow)
    return () => {
      window.removeEventListener('mousemove', handleGlow)
    }
  }, [])

  return (
    <motion.div
      ref={outerRef}
      className={[
        'relative z-0 rounded-xl bg-gradient-to-b from-background-surface-300 to-scale-400 p-px shadow-md',
        !trackCursor && hasActiveOnHover ? 'hover:bg-none hover:!bg-scale-700' : '',
        outerClassName,
      ].join(' ')}
      whileHover="hover"
      animate="initial"
    >
      <div
        className={[
          'relative z-10 h-full rounded-xl bg overflow-hidden transition-all text-scale-1100',
          innerClassName,
        ].join(' ')}
      >
        <div
          ref={innerRef}
          className="absolute z-10 inset-0 w-full h-full pointer-events-none opacity-20"
        />
        <div className="relative z-0 w-full h-full">{children}</div>
      </div>
    </motion.div>
  )
}

export default Panel
