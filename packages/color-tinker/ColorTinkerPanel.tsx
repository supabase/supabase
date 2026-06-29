'use client'

import { EyeOff } from 'lucide-react'
import { Button, PopoverContent, Slider, Tooltip, TooltipContent, TooltipTrigger, cn } from 'ui'

import { COLOR_INPUTS } from './constants'
import { useColorTinker } from './ColorTinkerContext'
import type { ColorVarName, ColorValues } from './types'
import { formatValue } from './utils'

// Duplicated for tree-shaking — bundler must see literal process.env reference.
// Keep in sync: index.ts, ColorTinkerContext.tsx, ColorTinkerTrigger.tsx, ColorSystemTinker.tsx
const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const IS_COLOR_TINKER_ENABLED = env === 'local' || env === 'staging'

interface ColorTinkerPanelProps {
  values: ColorValues
  updateVar: (name: ColorVarName, rawValue: number) => void
  reset: () => void
}

export function ColorTinkerPanel({ values, updateVar, reset }: ColorTinkerPanelProps) {
  const { isEnabled, dismissColorTinker } = useColorTinker()

  if (!IS_COLOR_TINKER_ENABLED || !isEnabled) return null

  return (
    <PopoverContent align="end" side="top" sideOffset={8} className="w-64 p-0">
      <div className="flex items-center justify-between gap-2 border-b border-overlay px-3 py-3">
        <span className="heading-meta">Theme</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="text"
            size="tiny"
            className="h-6 px-1.5 text-sm"
            onClick={reset}
          >
            Reset
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="text"
                size="tiny"
                className="h-6 w-6 p-0 text-foreground-light hover:text-foreground"
                aria-label="Hide color tinker"
                onClick={dismissColorTinker}
              >
                <EyeOff size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Hide color tinker</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="grid w-full gap-3 p-3">
        {COLOR_INPUTS.map(({ name, label, min, max, step, decimals }) => (
          <div key={name} className="grid w-full gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground">{label}</span>
              <span className="text-sm tabular-nums text-foreground-light">
                {formatValue(values[name], decimals)}
              </span>
            </div>
            <Slider
              min={min}
              max={max}
              step={step}
              value={[values[name]]}
              onValueChange={([nextValue]) => updateVar(name, nextValue)}
              className={cn(
                'w-full',
                '[&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:w-full [&_[data-slot=slider-track]]:bg-border'
              )}
            />
          </div>
        ))}
      </div>
    </PopoverContent>
  )
}
