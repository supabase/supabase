import { ComponentProps, RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChartTooltipContent, cn } from 'ui'

const TOOLTIP_OFFSET = 16
const VIEWPORT_MARGIN = 8

// useLayoutEffect logs a warning during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// `content` is omitted because recharts passes its own (incompatibly typed)
// `content` through the render-prop spread; we never forward it.
type PortalChartTooltipProps = Omit<ComponentProps<typeof ChartTooltipContent>, 'content'> & {
  /** Ref to the chart's container element, used to position the tooltip at the active point. */
  chartRef: RefObject<HTMLElement | null>
}

/**
 * Drop-in replacement for `<ChartTooltipContent />` that renders the tooltip in
 * a portal at `document.body`. This lets it escape `overflow-hidden` ancestors
 * (e.g. report cards) so long labels are no longer clipped by the card.
 *
 * It anchors at the active point, measures itself, and flips/clamps to stay
 * inside the viewport — preserving recharts' directional behaviour.
 *
 * Use via recharts' render-prop form so the active-point props are forwarded:
 *   <Tooltip content={(props) => <PortalChartTooltip {...props} chartRef={chartRef} />} />
 */
export const PortalChartTooltip = ({ chartRef, className, ...props }: PortalChartTooltipProps) => {
  const { active, coordinate, payload } = props
  const innerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)

  useIsomorphicLayoutEffect(() => {
    if (!active || typeof document === 'undefined') {
      setPosition(null)
      return
    }
    const el = innerRef.current
    if (!el) return

    const containerRect = chartRef.current?.getBoundingClientRect()
    const anchorX = (containerRect?.left ?? 0) + (coordinate?.x ?? 0)
    const anchorY = (containerRect?.top ?? 0) + (coordinate?.y ?? 0)

    const { width, height } = el.getBoundingClientRect()

    // Prefer the right of the point; flip left if it would overflow the viewport
    let left = anchorX + TOOLTIP_OFFSET
    if (left + width > window.innerWidth - VIEWPORT_MARGIN) {
      left = anchorX - width - TOOLTIP_OFFSET
    }
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - width - VIEWPORT_MARGIN))

    const top = Math.max(
      VIEWPORT_MARGIN,
      Math.min(anchorY, window.innerHeight - height - VIEWPORT_MARGIN)
    )

    setPosition({ left, top })
  }, [active, coordinate?.x, coordinate?.y, payload, chartRef])

  if (!active || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={innerRef}
      style={{
        position: 'fixed',
        left: position?.left ?? -9999,
        top: position?.top ?? -9999,
        zIndex: 50,
        pointerEvents: 'none',
        // Hidden until measured/positioned to avoid a one-frame jump
        opacity: position ? 1 : 0,
      }}
    >
      <ChartTooltipContent className={cn('max-w-xs', className)} {...props} />
    </div>,
    document.body
  )
}
