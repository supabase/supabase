'use client'

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import { AnimatedGridBackground } from '../AnimatedGridBackground'
import { AnimatedCounter } from '../AnimatedCounter'
=======
import { motion } from 'framer-motion'
=======
>>>>>>> c9e9354b96 (single page)
import { useEffect, useState } from 'react'
import NumberFlow from '@number-flow/react'
import { AnimatedGridBackground } from '../AnimatedGridBackground'

interface AnimatedCounterProps {
  value: number
  increment: number
  intervalMs?: number
  compact?: boolean
}

function AnimatedCounter({ value, increment, intervalMs = 1000, compact }: AnimatedCounterProps) {
  const [count, setCount] = useState(value)

  useEffect(() => {
    if (increment <= 0) return

    const interval = setInterval(() => {
      setCount((prev) => prev + increment)
    }, intervalMs)

    return () => clearInterval(interval)
  }, [increment, intervalMs])

  return (
    <NumberFlow
      value={count}
      format={compact ? { notation: 'compact', maximumFractionDigits: 1 } : undefined}
      transformTiming={{ duration: 500, easing: 'ease-out' }}
      spinTiming={{ duration: 500, easing: 'ease-out' }}
      opacityTiming={{ duration: 300, easing: 'ease-out' }}
    />
  )
}
>>>>>>> 3525bdad4d (wip)
=======
import { AnimatedGridBackground } from '../AnimatedGridBackground'
import { AnimatedCounter } from '../AnimatedCounter'
>>>>>>> f735fc1b6b (optimize imgs)

const heroStats = [
  {
    headline: 'More databases created in 2025 than in all previous years combined',
    number: 14_196_130,
    increment: 1,
<<<<<<< HEAD
<<<<<<< HEAD
    intervalMs: 1000,
=======
    intervalMs: 1000, // +1 every 2 seconds
>>>>>>> 3525bdad4d (wip)
=======
    intervalMs: 1000,
>>>>>>> c9e9354b96 (single page)
  },
  {
    headline: 'Projects created',
    number: 11_212_051,
    increment: 1,
<<<<<<< HEAD
<<<<<<< HEAD
    intervalMs: 500,
=======
    intervalMs: 500, // +1 every 0.5 seconds
>>>>>>> 3525bdad4d (wip)
=======
    intervalMs: 500,
>>>>>>> c9e9354b96 (single page)
  },
  {
    headline: 'Realtime messages delivered',
    number: 280_355_288_012,
<<<<<<< HEAD
<<<<<<< HEAD
    increment: 1931,
    intervalMs: 200,
=======
    increment: 1931, // ~9657 per second / 5
    intervalMs: 200, // update every 200ms
>>>>>>> 3525bdad4d (wip)
=======
    increment: 1931,
    intervalMs: 200,
>>>>>>> c9e9354b96 (single page)
  },
]

const gridStats = [
  {
    headline: 'Peak concurrent Realtime connections',
    number: 193_942,
    increment: 0,
  },
  {
    headline: 'Edge Functions invoked',
    number: 49_632_206_530,
    increment: 1_709,
  },
  {
    headline: 'Images transformed via Storage',
    number: 64_454_990,
    increment: 2,
  },
  {
    headline: 'Petabytes stored',
    number: 64.5,
    increment: 0,
    suffix: 'PB',
  },
  {
    headline: 'Petabytes served',
    number: 19.3,
    increment: 0,
    suffix: 'PB',
  },
]

export const Devs = () => {
  return (
    <>
<<<<<<< HEAD
      <section className="relative max-w-[60rem] h-[240px] md:h-[360px] mx-auto border-x">
        {/* Grid background */}
        <AnimatedGridBackground
          cols={5}
          rows={{ mobile: 2, desktop: 3 }}
          tiles={[
            { cell: 0, type: 'dots' },
            { cell: 2, type: 'stripes' },
            { cell: 3, type: 'stripes' },
            { cell: 4, type: 'stripes' },
            { cell: 5, type: 'stripes' },
            { cell: 7, type: 'dots' },
          ]}
          initialDelay={0.35}
        />

        {/* Content */}
        <div className="flex flex-col justify-end h-full px-4 py-0 relative">
          <div className="flex justify-between items-center">
<<<<<<< HEAD
            <h2 className="font-medium tracking-tighter text-6xl md:text-7xl lg:text-[5.6rem] translate-y-2 lg:translate-y-[10px]">
=======
            <h2 className="font-medium tracking-tighter text-6xl md:text-7xl lg:text-[5.6rem]">
>>>>>>> f735fc1b6b (optimize imgs)
              Devs <span className="text-brand">love</span> Supabase
            </h2>
=======
      <section className="relative max-w-[60rem] h-[420px] mx-auto border-x border-b">
        {/* Grid background */}
        <AnimatedGridBackground
          cols={5}
          rows={3}
          tiles={[
            { cell: 0, type: 'dots' },
            { cell: 2, type: 'stripes' },
            { cell: 3, type: 'stripes' },
            { cell: 4, type: 'stripes' },
            { cell: 5, type: 'stripes' },
            { cell: 7, type: 'dots' },
          ]}
          initialDelay={0.35}
        />

        {/* Content */}
        <div className="flex flex-col justify-end h-full px-8 py-0 relative">
          <div className="flex justify-between items-center">
            <h1 className="font-bold tracking-tight text-[5.6rem]">
              Devs <span className="text-brand">💚</span> Supabase
            </h1>
>>>>>>> 3525bdad4d (wip)
          </div>
        </div>
      </section>

<<<<<<< HEAD
      <div className="relative max-w-[60rem] mx-auto border-x border-b px-4 lg:px-8 py-12">
        <p className="text-lg text-foreground-light max-w-2xl">
<<<<<<< HEAD
=======
      <div className="relative max-w-[60rem] mx-auto border-x border-b px-8 py-12">
        <p className="text-xl text-foreground-light max-w-2xl">
>>>>>>> 3525bdad4d (wip)
=======
>>>>>>> f735fc1b6b (optimize imgs)
          In 2025, developers around the world shipped faster, scaled further, and built things we
          never imagined. Here is what you accomplished on Supabase.
        </p>
      </div>

      {/* Hero stats */}
      {heroStats.map((stat) => (
        <div
          key={stat.headline}
          className="relative max-w-[60rem] mx-auto border-x border-b p-8 bg-surface-75"
        >
          <div className="flex flex-col gap-2">
<<<<<<< HEAD
<<<<<<< HEAD
            <p className="text-4xl md:text-5xl font-mono font-medium text-brand tracking-tighter">
=======
            <p className="text-4xl md:text-5xl font-mono font-bold text-brand tracking-tight">
>>>>>>> 3525bdad4d (wip)
=======
            <p className="text-4xl md:text-5xl font-mono font-medium text-brand tracking-tighter">
>>>>>>> f735fc1b6b (optimize imgs)
              <AnimatedCounter
                value={stat.number}
                increment={stat.increment}
                intervalMs={stat.intervalMs}
              />
            </p>
<<<<<<< HEAD
<<<<<<< HEAD
            <p className="text-base text-foreground-light">{stat.headline}</p>
=======
            <p className="text-lg text-foreground-light">{stat.headline}</p>
>>>>>>> 3525bdad4d (wip)
=======
            <p className="text-base text-foreground-light">{stat.headline}</p>
>>>>>>> f735fc1b6b (optimize imgs)
          </div>
        </div>
      ))}

      {/* Stats grid */}
<<<<<<< HEAD
      <div className="relative max-w-[60rem] mx-auto border-x">
=======
      <div className="relative max-w-[60rem] mx-auto border-x border-b">
>>>>>>> 3525bdad4d (wip)
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {(() => {
            const cols = 4
            const remainder = gridStats.length % cols
            const emptyCells = remainder === 0 ? 0 : cols - remainder

            return (
              <>
                {gridStats.map((stat) => (
                  <div
                    key={stat.headline}
<<<<<<< HEAD
                    className="p-8 border-r border-b border-muted [&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r [&:nth-child(4n)]:border-r-0"
                  >
                    <div className="flex flex-col gap-2">
                      <p
                        className={`text-2xl md:text-3xl font-mono font-medium tracking-tighter ${stat.increment > 0 ? 'text-brand' : 'text-foreground'}`}
<<<<<<< HEAD
=======
                    className="px-6 py-8 border-r border-b border-muted [&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r [&:nth-child(4n)]:border-r-0"
                  >
                    <div className="flex flex-col gap-2">
                      <p
                        className={`text-2xl md:text-3xl font-mono font-bold tracking-tight ${stat.increment > 0 ? 'text-brand' : 'text-foreground'}`}
>>>>>>> 3525bdad4d (wip)
=======
>>>>>>> f735fc1b6b (optimize imgs)
                      >
                        {stat.suffix ? (
                          <>
                            {stat.number}
                            <span className="text-lg ml-1">{stat.suffix}</span>
                          </>
                        ) : (
                          <AnimatedCounter value={stat.number} increment={stat.increment} compact />
                        )}
                      </p>
                      <p className="text-sm text-foreground-lighter">{stat.headline}</p>
                    </div>
                  </div>
                ))}
                {Array.from({ length: emptyCells }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="px-6 py-8 border-r border-b border-muted last:border-r-0"
                  />
                ))}
              </>
            )
          })()}
        </div>
      </div>
    </>
  )
}
