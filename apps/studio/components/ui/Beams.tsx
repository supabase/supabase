'use client'

import { motion } from 'framer-motion'
import React, { HTMLAttributes, useMemo } from 'react'
import { cn } from 'ui'

const createGridMask = (start: number, end: number): string => {
  const mid = (start + end) / 2
  return `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.05) ${start}%, rgba(0,0,0,0.2) ${mid}%, rgba(0,0,0,0.6) ${end - 20}%, rgba(0,0,0,1) ${end}%)`
}

const generateRayConfig = (index: number, total: number) => {
  const progress = index / Math.max(total - 1, 1)
  const leftPercent = 2 + progress * 96
  const rotation = 28 - progress * 56
  const variation = (index * 0.618) % 1

  return {
    left: `${leftPercent}%`,
    rotation,
    width: 40 + variation * 25,
    duration: 6 + variation * 5,
    delay: -variation * 10,
    swayDuration: 12 + variation * 9,
    swayDelay: -variation * 10,
    blur: 24 + variation * 9,
    strongSway: index % 2 === 0,
  }
}

interface GridBeamsProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gridSize?: number
  gridColor?: string
  rayCount?: number
  rayOpacity?: number
  raySpeed?: number
  rayLength?: string
  gridFadeStart?: number
  gridFadeEnd?: number
  backgroundColor?: string
  variant?: 'default' | 'destructive'
}

interface LightRayProps {
  left: string
  rotation: number
  width: number
  delay: number
  duration: number
  swayDuration: number
  swayDelay: number
  blurAmount: number
  isStrongerSway: boolean
  opacity: number
  speed: number
  length: string
}

const LightRay = React.memo<LightRayProps>(
  ({
    left,
    rotation,
    width,
    delay,
    duration,
    swayDuration,
    swayDelay,
    blurAmount,
    isStrongerSway,
    opacity,
    speed,
    length,
  }) => {
    return (
      <motion.div
        className="absolute pointer-events-none -top-[5%] left-[var(--ray-left)] w-[var(--ray-width)] h-[var(--ray-height)] origin-top mix-blend-screen bg-[linear-gradient(to_bottom,hsl(var(--ray-color)/var(--ray-opacity)),hsl(var(--ray-color)/0))] blur-[var(--ray-blur)] translate-x-[-50%] rotate-[var(--ray-rotation)]"
        style={
          {
            '--ray-left': left,
            '--ray-width': `${width}px`,
            '--ray-height': length,
            '--ray-opacity': opacity,
            '--ray-blur': `${blurAmount}px`,
            '--ray-rotation': `${rotation}deg`,
          } as React.CSSProperties
        }
        animate={{
          opacity: [0.3, 0.7, 0.3],
          transform: [
            `translateX(-50%) rotate(${rotation}deg)`,
            `translateX(-50%) rotate(${rotation + (isStrongerSway ? 1 : 0.5)}deg)`,
            `translateX(-50%) rotate(${rotation}deg)`,
          ],
        }}
        transition={{
          opacity: {
            duration: duration / speed,
            delay: delay / speed,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          transform: {
            duration: swayDuration / speed,
            delay: swayDelay / speed,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      />
    )
  }
)

LightRay.displayName = 'LightRay'

export const GridBeams: React.FC<GridBeamsProps> = ({
  children,
  className,
  gridSize = 40,
  gridColor = 'rgba(200, 200, 200, 0.2)',
  rayCount = 15,
  rayOpacity = 0.35,
  raySpeed = 1,
  rayLength = '45vh',
  gridFadeStart = 30,
  gridFadeEnd = 90,
  backgroundColor = '#222',
  variant = 'default',
  ...props
}) => {
  const rayConfigs = useMemo(() => {
    return Array.from({ length: rayCount }, (_, i) => generateRayConfig(i, rayCount))
  }, [rayCount])

  const gridMask = useMemo(
    () => createGridMask(gridFadeStart, gridFadeEnd),
    [gridFadeStart, gridFadeEnd]
  )

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[var(--bg-color)] bg-[radial-gradient(ellipse_at_50%_-20%,#111,transparent_70%)]',
        className
      )}
      style={
        {
          '--bg-color': backgroundColor,
          '--ray-color':
            variant === 'destructive' ? 'var(--destructive-default)' : 'var(--foreground-default)',
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        className="absolute inset-0 pointer-events-none bg-[linear-gradient(var(--grid-color)_1px,transparent_1px),linear-gradient(90deg,var(--grid-color)_1px,transparent_1px)] bg-size-[var(--grid-size)_var(--grid-size)] [mask-image:var(--grid-mask)] [webkit-mask-image:var(--grid-mask)]"
        style={
          {
            '--grid-color': gridColor,
            '--grid-size': `${gridSize}px`,
            '--grid-mask': gridMask,
          } as React.CSSProperties
        }
      />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {rayConfigs.map((config, index) => (
          <LightRay
            key={index}
            left={config.left}
            rotation={config.rotation}
            width={config.width}
            delay={config.delay}
            duration={config.duration}
            swayDuration={config.swayDuration}
            swayDelay={config.swayDelay}
            blurAmount={config.blur}
            isStrongerSway={config.strongSway}
            opacity={rayOpacity}
            speed={raySpeed}
            length={rayLength}
          />
        ))}
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  )
}
