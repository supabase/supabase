'use client'

import { Palette } from 'lucide-react'
import { Button, PopoverTrigger, cn } from 'ui'

import { useColorTinker } from './ColorTinkerContext'

// Duplicated for tree-shaking — bundler must see literal process.env reference.
// Keep in sync: index.ts, ColorTinkerContext.tsx, ColorSystemTinker.tsx
const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const IS_COLOR_TINKER_ENABLED = env === 'local' || env === 'staging'

interface ColorTinkerTriggerProps {
  hasOverrides?: boolean
}

export function ColorTinkerTrigger({ hasOverrides = false }: ColorTinkerTriggerProps) {
  const { isEnabled } = useColorTinker()

  if (!IS_COLOR_TINKER_ENABLED || !isEnabled) return null

  return (
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="text"
        className={cn(
          'relative h-10 w-10 rounded-full p-0',
          'border border-overlay bg-surface-100 shadow-md',
          'text-foreground-light hover:bg-surface-200 hover:text-foreground',
          'focus-visible:outline-0 focus-visible:outline-transparent focus-visible:outline-offset-0',
          hasOverrides && 'ring-2 ring-brand'
        )}
        aria-label="Color system tinker"
        title="Color system tinker"
      >
        <Palette size={16} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none" />
      </Button>
    </PopoverTrigger>
  )
}
