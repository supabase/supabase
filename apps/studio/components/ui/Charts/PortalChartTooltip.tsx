import { useIsomorphicLayoutEffect } from 'common'
import { ComponentProps, RefObject, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TooltipProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { ChartTooltipContent, cn } from 'ui'

const TOOLTIP_OFFSET = 16
const VIEWPORT_MARGIN = 8

type PortalChartTooltipProps = Omit<ComponentProps<typeof ChartTooltipContent>, 'content'> &
  Pick<TooltipProps<ValueType, NameType>, 'active' | 'coordinate' | 'payload'> & {
    chartRef: RefObject<HTMLElement | null>
  }

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
        opacity: position ? 1 : 0,
      }}
    >
      <ChartTooltipContent className={cn('max-w-xs', className)} {...props} />
    </div>,
    document.body
  )
}
