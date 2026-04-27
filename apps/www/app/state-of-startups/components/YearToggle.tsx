'use client'

import { motion } from 'framer-motion'
import { cn } from 'ui'

import { SURVEY_YEARS, useYear, type SurveyYear } from './year-context'

export function YearToggle({ className }: { className?: string }) {
  const { year, setYear } = useYear()

  return (
    <motion.div
      layout
      role="radiogroup"
      aria-label="Survey year"
      className={cn(
        'inline-flex items-center rounded-full border border-overlay bg-overlay/80 p-0.5 font-mono uppercase tracking-widest backdrop-blur shadow-xl h-[30px] text-xs',
        className
      )}
    >
      {SURVEY_YEARS.map((option) => {
        const active = option === year
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setYear(option as SurveyYear)}
            className={cn(
              'relative inline-flex h-full items-center rounded-full px-3 transition-colors',
              active
                ? 'bg-foreground text-background'
                : 'text-foreground-light hover:text-foreground'
            )}
          >
            {option}
          </button>
        )
      })}
    </motion.div>
  )
}
