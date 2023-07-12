import React, { PropsWithChildren, useEffect, useRef } from 'react'

interface Props {
  outerClassName?: string
  innerClassName?: string
  hasActiveOnHover?: boolean
  hasInnerShimmer?: boolean
  shimmerFromColor?: string
  shimmerToColor?: string
}

const InteractiveShimmerCard = ({
  outerClassName,
  innerClassName,
  hasActiveOnHover = false,
  hasInnerShimmer = false,
  shimmerFromColor,
  shimmerToColor,
  children,
}: PropsWithChildren<Props>) => {
  const outerRef = useRef(null)
  const innerRef = useRef(null)

  const handleGlow = (event: any) => {
    if (!outerRef.current || !innerRef.current) return null
    const outerElement = outerRef.current as HTMLDivElement
    const innerElement = innerRef.current as HTMLDivElement
    let x: any
    let y: any

    const { x: elX, y: elY, width, height } = outerElement.getBoundingClientRect()
    x = event.clientX - elX
    y = event.clientY - elY
    const isActive = x > -3 && x < width + 3 && y > -3 && y < height + 3
    const activeGlow =
      hasActiveOnHover && isActive
        ? `radial-gradient(65rem circle at ${x}px ${y}px, var(--colors-brand9), transparent), `
        : ''
    outerElement.style.background = isActive ? `var(--colors-brand9)` : `var(--colors-scale3)`
    outerElement.style.backgroundImage = `
      ${activeGlow}radial-gradient(30rem circle at ${x}px ${y}px, ${
      shimmerFromColor ?? 'var(--colors-scale8)'
    }, ${shimmerToColor ?? 'var(--colors-scale3)'})`

    innerElement.style.backgroundImage =
      hasInnerShimmer && isActive
        ? `radial-gradient(7rem circle at ${x}px ${y}px, var(--colors-scale5), transparent), radial-gradient(20rem circle at ${x}px ${y}px, var(--colors-scale4), transparent)`
        : ''
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
      className={[
        'relative rounded-xl bg-scale-400 from-scale-800 to-scale-800 p-px transition-all shadow-md',
        outerClassName,
      ].join(' ')}
    >
      <div
        className={[
          'relative h-full rounded-xl bg-scale-200 dark:bg-scale-300 overflow-hidden transition-all text-scale-1100',
          innerClassName,
        ].join(' ')}
      >
        <div className="relative z-10 w-full h-full">{children}</div>
        <div ref={innerRef} className="absolute z-0 inset-0 w-full h-full" />
      </div>
    </div>
  )
}

export default InteractiveShimmerCard
