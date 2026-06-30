'use client'

export interface CohortToggleOption {
  label: string
  filter: string | string[] | null
}

interface CohortToggleProps {
  eyebrow: string
  options: CohortToggleOption[]
  value: string
  onValueChange: (label: string) => void
}

export function CohortToggle({ eyebrow, options, value, onValueChange }: CohortToggleProps) {
  return (
    <div className="flex flex-col gap-2 px-8 py-6 border-t border-muted">
      <span className="text-foreground-lighter text-xs font-mono uppercase tracking-widest">
        {eyebrow}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isActive = option.label === value
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onValueChange(option.label)}
              className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border rounded-full transition-colors ${
                isActive
                  ? 'border-brand-500/40 bg-brand-300/40 text-brand-link dark:text-brand'
                  : 'border-overlay text-foreground-light hover:text-foreground hover:bg-surface-100'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
