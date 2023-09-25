import React, { PropsWithChildren, useEffect, useRef } from 'react'
import { cn } from 'ui'

interface Props {
  outerClassName?: string
  innerClassName?: string
  activeColor?: 'default' | 'brand'
  hasShimmer?: boolean
  hasActiveOnHover?: boolean
  hasInnerShimmer?: boolean
  shimmerFromColor?: string
  shimmerToColor?: string
}

const InteractiveShimmerCard = ({
  outerClassName,
  innerClassName,
  activeColor = 'default',
  hasShimmer = false,
  hasActiveOnHover = false,
  hasInnerShimmer = false,
  shimmerFromColor,
  shimmerToColor,
  children,
}: PropsWithChildren<Props>) => {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
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
    if (typeof window === 'undefined') return

    window.addEventListener('mousemove', handleGlow)
    return () => {
      window.removeEventListener('mousemove', handleGlow)
    }
  }, [])

  return (
    <div
      ref={outerRef}
      className={cn(
        'relative rounded-xl bg-scale-400 from-scale-800 to-scale-800 p-px transition-all shadow-md',
        !trackCursor && hasActiveOnHover
          ? activeColor === 'brand'
            ? 'hover:bg-none hover:!bg-brand'
            : 'hover:bg-none hover:!bg-scale-900'
          : '',
        outerClassName
      )}
    >
      <div
        className={cn(
          'relative h-full z-10 rounded-xl bg-scale-200 dark:bg-scale-300 overflow-hidden transition-all text-scale-1100',
          innerClassName
        )}
      >
        {children}
        <div ref={innerRef} className="absolute z-0 inset-0 w-full h-full pointer-events-none" />
      </div>
    </div>
  )
}

export default InteractiveShimmerCard
