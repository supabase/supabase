import { motion } from 'framer-motion'
import Link from 'next/link'

interface StateOfStartupsHeaderProps {
  title: string
  subtitle: string
  chapters: Array<{
    shortTitle: string
    number: number
  }>
}

const DiagonalStripes = () => (
  <div
    className="flex-grow"
    style={{
      backgroundImage: `repeating-linear-gradient(
        45deg,
        hsl(var(--border-muted)) 0px,
        hsl(var(--border-muted)) 1px,
        transparent 1px,
        transparent 8px
      )`,
    }}
  />
)

export function StateOfStartupsHeader({ title, subtitle, chapters }: StateOfStartupsHeaderProps) {
  return (
    <header className="mt-32">
      <div className="max-w-[60rem] mx-auto">
        <div className="flex flex-col gap-1">
          {/* State */}
          <div className="flex w-full">
            <div className="inline-block bg-surface-300">
              <span className="text-foreground-light text-[4.5rem] font-normal px-4 py-2 inline-block leading-none">
                State
              </span>
            </div>
            <DiagonalStripes />
          </div>

          {/* of */}
          <div className="flex w-full">
            <div className="inline-block bg-surface-300">
              <span className="text-foreground-light text-[4.5rem] font-normal px-4 py-2 inline-block leading-none">
                of
              </span>
            </div>
            <DiagonalStripes />
          </div>

          {/* Startups */}
          <div className="flex w-full">
            <div className="inline-block bg-brand">
              <span className="text-[#1c1c1c] text-[4.5rem] font-normal px-4 py-2 inline-block leading-none">
                Startups
              </span>
            </div>
            <DiagonalStripes />
          </div>

          {/* 2025 */}
          <div className="flex w-full">
            <div className="inline-block bg-foreground">
              <span className="text-background text-[4.5rem] font-normal px-4 py-2 inline-block leading-none">
                2025
              </span>
            </div>
            <DiagonalStripes />
          </div>
        </div>
      </div>
    </header>
  )
}
