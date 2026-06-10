'use client'

/**
 * Small, presentational rail controls for the get-started configurator.
 * These map the prototype's bespoke segmented / radio / chip controls onto
 * Tailwind + semantic tokens. They are intentionally local to /start — the
 * design variants (two-line segments, animated pill chips) don't map cleanly
 * onto the shared form primitives.
 */
import { Check } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from 'ui'

export function Field({
  label,
  count,
  children,
}: {
  label: string
  count?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mb-7">
      <div className="mb-2.5 flex items-baseline justify-between text-xs text-foreground-muted">
        <span>{label}</span>
        {count != null && <span className="tabular-nums">{count}</span>}
      </div>
      {children}
    </div>
  )
}

export interface SegOption<T extends string> {
  id: T
  label: string
  sub?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegOption<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-surface-100 p-1">
      {options.map((o) => {
        const on = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 rounded-md px-1.5 py-1.5 text-[13px] leading-tight transition-colors',
              on
                ? 'bg-surface-300 text-foreground shadow-sm'
                : 'text-foreground-light hover:text-foreground'
            )}
          >
            <span>{o.label}</span>
            {o.sub && (
              <span
                className={cn(
                  'text-[11px]',
                  on ? 'text-foreground-light' : 'text-foreground-muted'
                )}
              >
                {o.sub}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export interface RadioOption<T extends string> {
  id: T
  label: string
  meta?: string
}

export function RadioList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: RadioOption<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {options.map((o) => {
        const on = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              '-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
              on ? 'text-foreground' : 'text-foreground-light hover:bg-surface-100'
            )}
          >
            <span
              className={cn(
                'grid h-3.5 w-3.5 flex-none place-items-center rounded-full border transition-colors',
                on ? 'border-brand' : 'border-strong'
              )}
            >
              {on && <span className="h-[7px] w-[7px] rounded-full bg-brand" />}
            </span>
            <span>{o.label}</span>
            {o.meta && <span className="ml-auto text-xs text-foreground-muted">{o.meta}</span>}
          </button>
        )
      })}
    </div>
  )
}

export interface ChipOption {
  id: string
  label: string
}

export function Chips({
  options,
  value,
  onToggle,
}: {
  options: ChipOption[]
  value: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.id)
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3 text-[13px] transition-colors',
              on
                ? 'bg-brand-200 text-brand-600'
                : 'bg-surface-200 text-foreground-light hover:bg-surface-300 hover:text-foreground'
            )}
          >
            <Check
              size={13}
              className={cn('transition-all', on ? 'scale-100 opacity-100' : 'scale-50 opacity-0')}
            />
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
