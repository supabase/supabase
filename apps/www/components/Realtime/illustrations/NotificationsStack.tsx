'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from 'ui'

import { DebugSlider } from './DebugSlider'

const CYCLE_MS = 3000

const dynamicPositions = [
  { x: 0, y: 0, opacity: 1 },
  { x: 10, y: 12, opacity: 0.94 },
  { x: 20, y: 24, opacity: 0.88 },
  { x: 30, y: 36, opacity: 0.82 },
  { x: 40, y: 48, opacity: 0.76 },
  { x: 50, y: 60, opacity: 0.7 },
]

export type NotificationStackItem = {
  id: string
  title: string
  description: string
  badge?: string
  badgeClassName?: string
  icon?: React.ReactNode
}

type NotificationsStackProps = {
  items: NotificationStackItem[]
  className?: string
  debug?: boolean
  skewY?: number
  rotateX?: number
  rotateY?: number
  rotateZ?: number
  spacing?: number
}

export function NotificationsStack({
  items,
  className,
  debug = false,
  skewY: skewYProp = 5,
  rotateX: rotateXProp = 15,
  rotateY: rotateYProp = 20,
  rotateZ: rotateZProp = 0,
  spacing: spacingProp = 0.8,
}: NotificationsStackProps) {
  const [cycleIndex, setCycleIndex] = useState(0)
  const [debugSkewY, setDebugSkewY] = useState(skewYProp)
  const [debugRotateX, setDebugRotateX] = useState(rotateXProp)
  const [debugRotateY, setDebugRotateY] = useState(rotateYProp)
  const [debugRotateZ, setDebugRotateZ] = useState(rotateZProp)
  const [debugSpacing, setDebugSpacing] = useState(spacingProp)

  const skewY = debug ? debugSkewY : skewYProp
  const rotateX = debug ? debugRotateX : rotateXProp
  const rotateY = debug ? debugRotateY : rotateYProp
  const rotateZ = debug ? debugRotateZ : rotateZProp
  const spacing = debug ? debugSpacing : spacingProp
  const itemCount = items.length

  useEffect(() => {
    if (itemCount < 2) return

    const interval = setInterval(() => {
      setCycleIndex((current) => current + 1)
    }, CYCLE_MS)

    return () => clearInterval(interval)
  }, [itemCount])

  if (itemCount === 0) return null

  return (
    <div className={cn('relative flex w-full flex-col items-center', className)}>
      <div
        className="relative flex items-center justify-center"
        style={{
          transform: `skewY(${skewY}deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
          transformStyle: 'preserve-3d',
          perspective: '1200px',
        }}
      >
        <div className="grid place-items-center" style={{ gridTemplateAreas: '"stack"' }}>
          {items.map((item, index) => {
            const posIdx = (index + cycleIndex) % itemCount
            const position = dynamicPositions[posIdx % dynamicPositions.length]!

            return (
              <motion.div
                key={item.id}
                className="w-[min(18rem,calc(100vw-3rem))] rounded-lg border border-default bg-surface-200 p-4 shadow-md [grid-area:stack]"
                style={{ zIndex: 50 - posIdx * 10 }}
                animate={{
                  x: position.x * spacing,
                  y: position.y * spacing,
                  opacity: position.opacity,
                }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="flex items-start gap-3">
                  {item.icon ? <div className="mt-0.5 shrink-0 text-foreground-muted">{item.icon}</div> : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.badge ? (
                        <span
                          className={cn(
                            'rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide',
                            item.badgeClassName
                          )}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                      <p className="text-sm font-normal text-foreground">{item.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-foreground-lighter">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {debug ? (
        <div className="pointer-events-auto mt-6 w-full max-w-sm rounded-md border border-default bg-surface-100 p-3">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-foreground-lighter">
            Stack debug
          </p>
          <div className="grid gap-3">
            <DebugSlider label="skewY" value={debugSkewY} min={-20} max={20} step={1} onChange={setDebugSkewY} />
            <DebugSlider label="rotateX" value={debugRotateX} min={-45} max={45} step={1} onChange={setDebugRotateX} />
            <DebugSlider label="rotateY" value={debugRotateY} min={-45} max={45} step={1} onChange={setDebugRotateY} />
            <DebugSlider label="rotateZ" value={debugRotateZ} min={-45} max={45} step={1} onChange={setDebugRotateZ} />
            <DebugSlider label="spacing" value={debugSpacing} min={0} max={2} step={0.05} onChange={setDebugSpacing} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
