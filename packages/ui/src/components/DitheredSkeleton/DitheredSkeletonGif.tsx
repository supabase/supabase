'use client'

import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type Ref,
} from 'react'

import { cn } from '../../lib/utils/cn'
import {
  mod,
  scheduleOrigin,
  SWEEP_ANGLE_DEG,
  SWEEP_NORM,
  SWEEP_PERIOD_PX,
  SWEEP_SLOPE,
  SWEEP_VELOCITY_PX_PER_MS,
} from './dither'
import {
  DITHER_BASE_GIF,
  DITHER_BASE_STILL,
  DITHER_GIF_TILE,
  DITHER_HIGHLIGHT_GIF,
  DITHER_HIGHLIGHT_STILL,
} from './dither-gifs'

const STYLE_ID = 'dithered-skeleton-gif-styles'
const HIDDEN_MASK = 'linear-gradient(transparent, transparent)'

// The GIFs are injected once per document instead of inlined per instance, so a page full of
// skeletons doesn't repeat ~27KB of data URI in every element's style.
const STYLES = `
:root {
  --dithered-skeleton-base: url(${DITHER_BASE_GIF});
  --dithered-skeleton-highlight: url(${DITHER_HIGHLIGHT_GIF});
}
@media (prefers-reduced-motion: reduce) {
  :root {
    --dithered-skeleton-base: url(${DITHER_BASE_STILL});
    --dithered-skeleton-highlight: url(${DITHER_HIGHLIGHT_STILL});
  }
}
.dithered-skeleton-gif-layer {
  -webkit-mask-repeat: repeat;
  mask-repeat: repeat;
  -webkit-mask-size: var(--dithered-skeleton-tile);
  mask-size: var(--dithered-skeleton-tile);
  -webkit-mask-position: var(--dither-origin, 0 0);
  mask-position: var(--dither-origin, 0 0);
  -webkit-mask-source-type: luminance;
  mask-mode: luminance;
  image-rendering: pixelated;
}
.dithered-skeleton-gif-base {
  -webkit-mask-image: var(--dithered-skeleton-base, ${HIDDEN_MASK});
  mask-image: var(--dithered-skeleton-base, ${HIDDEN_MASK});
}
.dithered-skeleton-gif-highlight {
  -webkit-mask-image: var(--dithered-skeleton-highlight, ${HIDDEN_MASK});
  mask-image: var(--dithered-skeleton-highlight, ${HIDDEN_MASK});
}
`

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = STYLES
  document.head.appendChild(style)
}

// Soft shine with a sharp leading edge and a long tail, sampled from the canvas version's falloff.
const SHINE_MASK = (() => {
  const stops: string[] = []
  for (let distance = -SWEEP_PERIOD_PX / 2; distance <= SWEEP_PERIOD_PX / 2; distance += 11) {
    const falloff = distance > 0 ? distance / 70 : distance / 220
    const alpha = Math.exp(-falloff * falloff)
    const position = (distance + SWEEP_PERIOD_PX / 2) / SWEEP_NORM
    stops.push(`rgb(0 0 0 / ${alpha.toFixed(3)}) ${position.toFixed(1)}px`)
  }
  return `repeating-linear-gradient(${SWEEP_ANGLE_DEG}deg, ${stops.join(', ')})`
})()

const SHINE_STYLE: CSSProperties = {
  left: -SWEEP_PERIOD_PX,
  maskImage: SHINE_MASK,
  WebkitMaskImage: SHINE_MASK,
  maskSize: `${SWEEP_PERIOD_PX}px ${SWEEP_PERIOD_PX / SWEEP_SLOPE}px`,
  WebkitMaskSize: `${SWEEP_PERIOD_PX}px ${SWEEP_PERIOD_PX / SWEEP_SLOPE}px`,
  maskPosition: 'var(--dither-sweep-offset, 0px) 0px',
  WebkitMaskPosition: 'var(--dither-sweep-offset, 0px) 0px',
}

export interface DitheredSkeletonGifProps extends HTMLAttributes<HTMLDivElement> {
  /** Size of one dither cell in CSS pixels. Larger values feel chunkier and more lo-fi. */
  pixelSize?: number
  /**
   * Adds the sweeping shine. It runs on the compositor but adds one animated layer per instance,
   * which makes every main-thread frame on the page a little more expensive. Without it, all
   * motion comes from the GIFs and the skeleton costs nothing per frame.
   */
  shine?: boolean
  ref?: Ref<HTMLDivElement>
}

/**
 * Experimental. A `DitheredSkeleton` whose drifting, pulsing texture is two tiny pre-rendered GIFs
 * used as luminance masks. The optional shine is a compositor animation, so no per-frame
 * JavaScript runs.
 */
export function DitheredSkeletonGif({
  className,
  pixelSize = 1,
  shine = true,
  style,
  ref,
  ...props
}: DitheredSkeletonGifProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(ref, () => rootRef.current as HTMLDivElement)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    injectStyles()

    // Snap cells to whole device pixels so the scaled GIF stays crisp.
    const dpr = window.devicePixelRatio || 1
    const cell = Math.max(1, Math.round(pixelSize * dpr)) / dpr
    const tileSize = DITHER_GIF_TILE * cell
    root.style.setProperty('--dithered-skeleton-tile', `${tileSize}px ${tileSize}px`)

    const sweep = root.querySelector<HTMLElement>('[data-dither-sweep]')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animation: Animation | null = null

    const syncMotion = () => {
      animation?.cancel()
      animation = null
      if (!sweep) return
      // Without the Web Animations API (e.g. jsdom), the shine stays parked like reduced motion.
      if (reducedMotion.matches || typeof sweep.animate !== 'function') {
        sweep.style.transform = `translateX(${SWEEP_PERIOD_PX * 0.35}px)`
        return
      }
      sweep.style.transform = ''
      animation = sweep.animate(
        [{ transform: 'translateX(0px)' }, { transform: `translateX(${SWEEP_PERIOD_PX}px)` }],
        { duration: SWEEP_PERIOD_PX / SWEEP_VELOCITY_PX_PER_MS, iterations: Infinity }
      )
      // Pinning to the document timeline keeps every instance in phase.
      animation.startTime = 0
    }

    const cancelOrigin = scheduleOrigin(root, (left, top) => {
      root.style.setProperty(
        '--dither-origin',
        `${Math.round(mod(-left, tileSize))}px ${Math.round(mod(-top, tileSize))}px`
      )
      const phase = mod(-(left + top * SWEEP_SLOPE), SWEEP_PERIOD_PX)
      root.style.setProperty('--dither-sweep-offset', `${Math.round(phase)}px`)
    })

    syncMotion()
    reducedMotion.addEventListener('change', syncMotion)

    return () => {
      cancelOrigin()
      reducedMotion.removeEventListener('change', syncMotion)
      animation?.cancel()
    }
  }, [pixelSize, shine])

  return (
    <div
      ref={rootRef}
      data-dithered-skeleton
      className={cn('relative overflow-hidden rounded-md bg-muted isolate', className)}
      style={
        {
          '--dithered-skeleton-tile': `${DITHER_GIF_TILE * pixelSize}px ${DITHER_GIF_TILE * pixelSize}px`,
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 text-foreground-lighter">
        <div className="dithered-skeleton-gif-layer dithered-skeleton-gif-base absolute inset-0 bg-current opacity-25" />
        {shine && (
          <div className="dithered-skeleton-gif-layer dithered-skeleton-gif-highlight absolute inset-0 opacity-50">
            <div
              data-dither-sweep
              className="absolute inset-y-0 right-0 bg-current"
              style={SHINE_STYLE}
            />
          </div>
        )}
      </div>
    </div>
  )
}
