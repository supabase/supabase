'use client'

import { useState } from 'react'
import { cn, SuccessCheck } from 'ui'

const OPTIONS = ['Production', 'Staging', 'Development']

export default function SuccessCheckSelected() {
  const [selected, setSelected] = useState(OPTIONS[0])

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      {OPTIONS.map((option) => {
        const isSelected = selected === option

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isSelected}
            onClick={() => setSelected(option)}
            className={cn(
              'relative flex w-full items-center rounded-md border px-4 py-3 text-left text-sm transition-colors',
              isSelected
                ? 'border-brand bg-brand-200/20 pr-10 dark:bg-brand-300'
                : 'hover:border-default hover:bg-surface-200'
            )}
          >
            {option}
            {isSelected && (
              <SuccessCheck className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </button>
        )
      })}
    </div>
  )
}
