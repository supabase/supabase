'use client'

import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'
import {
  useCallback,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
  type UIEvent,
} from 'react'
import { cn } from 'ui'

interface CurvedScrollAreaProps {
  children: ReactNode
  viewportRef?: Ref<HTMLDivElement>
  onScroll?: (event: UIEvent<HTMLDivElement>) => void
  bandHeight?: number
  maxShift?: number
  blur?: number
  className?: string
}

const svgDataUrl = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`

const DISPLACEMENT_MAP =
  svgDataUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' preserveAspectRatio='none'>
  <defs>
    <linearGradient id='x'><stop offset='0' stop-color='rgb(255,128,128)'/><stop offset='1' stop-color='rgb(1,128,128)'/></linearGradient>
    <linearGradient id='y' x2='0' y2='1'>
      <stop offset='0' stop-color='rgb(128,128,128)' stop-opacity='0'/>
      <stop offset='0.25' stop-color='rgb(128,128,128)' stop-opacity='0.56'/>
      <stop offset='0.5' stop-color='rgb(128,128,128)' stop-opacity='0.84'/>
      <stop offset='0.75' stop-color='rgb(128,128,128)' stop-opacity='0.97'/>
      <stop offset='1' stop-color='rgb(128,128,128)'/>
    </linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#x)'/>
  <rect width='100' height='100' fill='url(#y)'/>
</svg>`)

const BLUR_MASK =
  svgDataUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' preserveAspectRatio='none'>
  <defs>
    <linearGradient id='y' x2='0' y2='1'><stop offset='0' stop-color='black'/><stop offset='1' stop-color='black' stop-opacity='0'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#y)'/>
</svg>`)

export function CurvedScrollArea({
  children,
  viewportRef,
  onScroll,
  bandHeight = 88,
  maxShift = 28,
  blur = 1.5,
  className,
}: CurvedScrollAreaProps) {
  const filterId = useId()
  const [width, setWidth] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null)
  const blurRef = useRef<SVGFEGaussianBlurElement>(null)
  const bandRef = useRef<SVGFEImageElement>(null)
  const blurMaskRef = useRef<SVGFEImageElement>(null)

  // the filter works in pixels, so it needs the width of the area
  const measure = useCallback((root: HTMLDivElement | null) => {
    rootRef.current = root
    if (!root) return
    const observer = new ResizeObserver(() => setWidth(root.clientWidth))
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget
    const progress = Math.min(scrollTop / bandHeight, 1)
    const strength = progress * progress * (3 - 2 * progress)
    rootRef.current?.toggleAttribute('data-scrolled', scrollTop > 0)
    bandRef.current?.setAttribute('y', String(scrollTop))
    blurMaskRef.current?.setAttribute('y', String(scrollTop))
    displacementRef.current?.setAttribute('scale', String(maxShift * 2 * strength))
    blurRef.current?.setAttribute('stdDeviation', String(blur * strength))
    onScroll?.(event)
  }

  return (
    <ScrollAreaPrimitive.Root
      ref={measure}
      style={{ '--curved-scroll-filter': `url(#${filterId})` } as CSSProperties}
      className="curved-scroll-area relative"
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        onScroll={handleScroll}
        className={cn('w-full', className)}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="z-10 flex w-2.5 touch-none py-1.5 pr-1.5 select-none before:absolute before:inset-y-1.5 before:right-1.5 before:w-1 before:rounded-full before:bg-surface-300"
      >
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-foreground-muted/40 transition-colors hover:bg-foreground-muted/60" />
      </ScrollAreaPrimitive.Scrollbar>
      <svg aria-hidden width="0" height="0" className="absolute">
        <filter id={filterId} primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood className="curved-scroll-area-neutral" result="neutral" />
          <feImage
            ref={bandRef}
            href={DISPLACEMENT_MAP}
            width={width}
            height={bandHeight}
            preserveAspectRatio="none"
            result="band"
          />
          <feComposite in="band" in2="neutral" operator="over" result="map" />
          <feDisplacementMap
            ref={displacementRef}
            in="SourceGraphic"
            in2="map"
            xChannelSelector="R"
            yChannelSelector="G"
            result="curved"
          />
          <feGaussianBlur ref={blurRef} in="curved" result="blurred" />
          <feImage
            ref={blurMaskRef}
            href={BLUR_MASK}
            width={width}
            height={bandHeight}
            preserveAspectRatio="none"
            result="blurMask"
          />
          <feComposite in="blurred" in2="blurMask" operator="in" result="blurredTop" />
          <feComposite in="blurredTop" in2="curved" operator="over" />
        </filter>
      </svg>
    </ScrollAreaPrimitive.Root>
  )
}
