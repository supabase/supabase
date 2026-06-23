import createGlobe from 'cobe'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { cn } from 'ui'

import { useInfrastructurePrototype } from '../InfrastructurePrototypeContext'
import {
  buildInfrastructureGlobeArcs,
  buildInfrastructureGlobeMarkers,
  toCobeMarkers,
  type InfrastructureGlobeMarkerRole,
} from './infrastructureGlobe.utils'
import { useInfrastructureGlobeTheme } from './infrastructureGlobeTheme'

import './InfrastructureGlobe.css'

const LEGEND_ITEMS: { role: InfrastructureGlobeMarkerRole; label: string; className: string }[] = [
  { role: 'primary', label: 'Primary', className: 'bg-foreground' },
  { role: 'replica', label: 'Replica', className: 'bg-muted border border-default' },
  { role: 'recommended', label: 'Suggested', className: 'bg-warning' },
]

const GLOBE_THETA = 0.2
const AUTO_ROTATE_SPEED = 0.003

const getGlobeStageSize = (container: HTMLDivElement) =>
  Math.min(container.offsetWidth, container.offsetHeight)

export const InfrastructureGlobe = () => {
  const { config } = useInfrastructurePrototype()
  const { resolvedTheme } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const globeStageRef = useRef<HTMLDivElement>(null)

  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const phiOffset = useRef(0)
  const thetaOffset = useRef(0)
  const spinPhi = useRef(0)

  const isDark = resolvedTheme === 'dark'
  const themeColors = useInfrastructureGlobeTheme(isDark)

  const markers = useMemo(
    () => buildInfrastructureGlobeMarkers(config, themeColors.markers),
    [config, themeColors.markers]
  )
  const cobeMarkers = useMemo(() => toCobeMarkers(markers), [markers])
  const arcs = useMemo(() => buildInfrastructureGlobeArcs(markers), [markers])

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    pointerInteracting.current = { x: event.clientX, y: event.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
  }, [])

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (pointerInteracting.current === null) return

    const deltaX = event.clientX - pointerInteracting.current.x
    const deltaY = event.clientY - pointerInteracting.current.y
    dragOffset.current = { phi: deltaX / 300, theta: deltaY / 1000 }
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffset.current += dragOffset.current.phi
      thetaOffset.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
    }

    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
  }, [])

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerup', handlePointerUp, { passive: true })
    window.addEventListener('pointercancel', handlePointerUp, { passive: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const globeStage = globeStageRef.current
    if (!container || !canvas || !globeStage) return

    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId = 0

    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2)

    const applyStageSize = () => {
      const size = getGlobeStageSize(container)
      if (size === 0) return 0

      globeStage.style.width = `${size}px`
      globeStage.style.height = `${size}px`
      return size
    }

    const createGlobeInstance = () => {
      if (applyStageSize() === 0) return

      const width = canvas.offsetWidth
      if (width === 0) return

      globe?.destroy()

      globe = createGlobe(canvas, {
        devicePixelRatio,
        width,
        height: width,
        phi: spinPhi.current + phiOffset.current,
        theta: GLOBE_THETA + thetaOffset.current,
        dark: themeColors.dark,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        mapBaseBrightness: 0,
        baseColor: themeColors.baseColor,
        markerColor: themeColors.markers.primary,
        glowColor: themeColors.glowColor,
        markerElevation: 0.01,
        markers: cobeMarkers,
        arcs,
        arcWidth: 0.5,
        arcHeight: 0.25,
        opacity: 1,
      })
    }

    const animate = () => {
      if (!globe) {
        animationId = requestAnimationFrame(animate)
        return
      }

      const width = canvas.offsetWidth
      if (width === 0) {
        animationId = requestAnimationFrame(animate)
        return
      }

      if (pointerInteracting.current === null) {
        spinPhi.current += AUTO_ROTATE_SPEED
      }

      globe.update({
        phi: spinPhi.current + phiOffset.current + dragOffset.current.phi,
        theta: GLOBE_THETA + thetaOffset.current + dragOffset.current.theta,
        width,
        height: width,
        markers: cobeMarkers,
        arcs,
        dark: themeColors.dark,
        baseColor: themeColors.baseColor,
        glowColor: themeColors.glowColor,
        markerColor: themeColors.markers.primary,
      })

      animationId = requestAnimationFrame(animate)
    }

    const resizeObserver = new ResizeObserver(() => {
      createGlobeInstance()
    })

    resizeObserver.observe(container)
    createGlobeInstance()
    animate()

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(animationId)
      globe?.destroy()
    }
  }, [arcs, cobeMarkers, themeColors])

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center bg-background"
    >
      <div ref={globeStageRef} className="infrastructure-globe-stage">
        <canvas
          ref={canvasRef}
          className="infrastructure-globe-canvas"
          onPointerDown={handlePointerDown}
        />

        {markers.map((marker) => {
          if (!marker.id) return null

          return (
            <div
              key={marker.id}
              className={cn(
                'infrastructure-globe-label',
                `infrastructure-globe-label--${marker.role}`
              )}
              style={
                {
                  positionAnchor: `--cobe-${marker.id}`,
                  opacity: `var(--cobe-visible-${marker.id}, 0)`,
                  filter: `blur(calc((1 - var(--cobe-visible-${marker.id}, 0)) * 8px))`,
                } as React.CSSProperties
              }
            >
              {marker.label}
            </div>
          )
        })}
      </div>

      <div className="absolute right-4 top-4 rounded-lg border border-default bg-background px-3 py-2 shadow-lg">
        <p className="mb-2 text-xs font-medium text-foreground">Regions</p>
        <ul className="flex flex-col gap-1.5">
          {LEGEND_ITEMS.map((item) => (
            <li key={item.role} className="flex items-center gap-2 text-xs text-foreground-muted">
              <span className={`h-2 w-2 shrink-0 rounded-full ${item.className}`} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
