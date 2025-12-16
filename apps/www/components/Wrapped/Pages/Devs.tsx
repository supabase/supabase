'use client'

import { AnimatedCounter } from '../AnimatedCounter'
import { AnimatedGridBackground } from '../AnimatedGridBackground'

type HeroStat = {
  headline: string
  number: number
  increment: number
  intervalMs: number
}

const heroStats: HeroStat[] = [
  {
    headline: 'More databases created in 2025 than in all previous years combined',
    number: 15_106_212,
    increment: 1,
    intervalMs: 1000,
  },
  {
    headline: 'Projects created',
    number: 11_808_815,
    increment: 1,
    intervalMs: 500,
  },
  {
    headline: 'Realtime messages delivered',
    number: 280_355_288_012,
    increment: 1931,
    intervalMs: 200,
  },
]

type GridStat = {
  headline: string
  number: number
  increment: number
  suffix?: string
  prefix?: string
}

const gridStats: GridStat[] = [
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
  {
    headline: 'One of the top 100 repos on Github',
    number: 94_500,
    increment: 0,
    suffix: 'stars',
  },
  {
    headline: 'paid to fund open source',
    number: 662_357.71,
    increment: 0,
    prefix: '$',
    suffix: 'USD',
  },
  {
    headline: 'Commits to our repos by community members',
    number: 1_421,
    increment: 0,
  },
]

export const Devs = () => {
  return (
    <>
      <section className="relative max-w-[60rem] h-[240px] md:h-[360px] mx-auto border-x border-b w-[95%] md:w-full">
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
            <h2 className="font-medium tracking-tighter text-6xl md:text-7xl lg:text-[5.6rem] translate-y-2 lg:translate-y-[10px]">
              Devs <span className="text-brand">love</span> Supabase
            </h2>
          </div>
        </div>
      </section>

      <div className="relative max-w-[60rem] mx-auto border-x border-b px-4 lg:px-8 py-12 w-[95%] md:w-full">
        <p className="text-lg text-foreground-light max-w-2xl">
          In 2025, developers around the world shipped faster, scaled further, and built things we
          never imagined. Here is what you accomplished on Supabase.
        </p>
      </div>

      {/* Hero stats */}
      {heroStats.map((stat) => (
        <div
          key={stat.headline}
          className="relative max-w-[60rem] mx-auto border-x border-b p-8 bg-surface-75 w-[95%] md:w-full"
        >
          <div className="flex flex-col gap-2">
            <p className="text-4xl md:text-5xl font-mono font-medium text-brand tracking-tighter">
              <AnimatedCounter
                value={stat.number}
                increment={stat.increment}
                intervalMs={stat.intervalMs}
              />
            </p>
            <p className="text-base text-foreground-light">{stat.headline}</p>
          </div>
        </div>
      ))}

      {/* Stats grid */}
      <div className="relative max-w-[60rem] mx-auto border-x w-[95%] md:w-full">
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
                    className="p-8 border-r border-b border-muted [&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r [&:nth-child(4n)]:border-r-0"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col">
                        <p
                          className={`text-2xl md:text-3xl font-mono font-medium tracking-tighter ${stat.increment > 0 ? 'text-brand' : 'text-foreground'}`}
                        >
                          {stat.suffix ? (
                            <>
                              {stat.prefix}
                              {new Intl.NumberFormat('en-US', {
                                notation: 'compact',
                                maximumFractionDigits: stat.number % 1 !== 0 ? 2 : 0,
                                minimumFractionDigits: stat.number % 1 !== 0 ? 1 : 0,
                              })
                                .format(stat.number)
                                .toLowerCase()}
                              <span className="text-lg ml-1.5 font-medium tracking-tight">
                                {stat.suffix}
                              </span>
                            </>
                          ) : (
                            <AnimatedCounter
                              value={stat.number}
                              increment={stat.increment}
                              compact
                            />
                          )}
                        </p>
                      </div>
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
