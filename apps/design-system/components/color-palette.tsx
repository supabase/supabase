'use client'

import { useState } from 'react'

const colorNames = [
  'Amber',
  'Blue',
  'Brand',
  'Crimson',
  'Gold',
  'Gray',
  'Green',
  'Indigo',
  'Orange',
  'Pink',
  'Purple',
  'Red',
  'Scale',
  'Slate',
  'Tomato',
  'Violet',
  'Yellow',
]

const SCALE_STEPS = Array.from({ length: 12 }, (_, i) => i + 1)

const GRID_COLS = 'grid-cols-[6rem_repeat(12,minmax(0,1fr))]'

const ColorPalette = () => {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      setTimeout(() => setCopied(null), 1500)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="my-6 w-full">
      <div className="flex min-w-[640px] flex-col gap-1">
        <div className={`grid gap-1 ${GRID_COLS}`}>
          <div />
          {SCALE_STEPS.map((step) => (
            <div key={step} className="text-center font-mono text-[10px] text-foreground-lighter">
              {step}
            </div>
          ))}
        </div>
        {colorNames.map((name) => {
          const slug = name.toLowerCase()
          return (
            <div key={slug} className={`grid items-center gap-1 ${GRID_COLS}`}>
              <div className="pr-2 text-sm font-medium text-foreground">{name}</div>
              {SCALE_STEPS.map((step) => {
                const reference = `var(--colors-${slug}${step})`
                const isCopied = copied === reference
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => handleCopy(reference)}
                    className="group relative flex aspect-square w-full items-center justify-center rounded-sm border border-overlay/40 transition hover:scale-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                    style={{ backgroundColor: reference }}
                    title={reference}
                  >
                    <span className="rounded-xs bg-surface-100/90 px-1 font-mono text-[10px] text-foreground-light opacity-0 transition group-hover:opacity-100">
                      {isCopied ? 'Copied!' : step}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { ColorPalette }
