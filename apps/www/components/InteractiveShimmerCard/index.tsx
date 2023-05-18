import React, { PropsWithChildren, useEffect, useRef } from 'react'

const InteractiveShimmerCard = ({
  outerClassName,
  innerClassName,
  children,
}: PropsWithChildren<{ outerClassName?: string; innerClassName?: string }>) => {
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
    const activeGlow = isActive
      ? `radial-gradient(65rem circle at ${x}px ${y}px, var(--colors-brand9), transparent), `
      : ''
    outerElement.style.background = isActive ? `var(--colors-brand9)` : `var(--colors-scale3)`
    outerElement.style.backgroundImage = `
      ${activeGlow}radial-gradient(30rem circle at ${x}px ${y}px, var(--colors-scale9), var(--colors-scale6))`

    innerElement.style.backgroundImage = isActive
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
        'relative rounded-xl bg-slate-400 from-slate-800 to-slate-800 p-px transition-all shadow-md',
        outerClassName,
      ].join(' ')}
    >
      <div
        className={[
          'relative rounded-xl bg-scale-300 overflow-hidden transition-all flex flex-col text-slate-1100 lg:items-center lg:text-center',
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
