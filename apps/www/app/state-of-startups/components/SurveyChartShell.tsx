import type { ReactNode } from 'react'

const CHART_GRADIENT =
  'radial-gradient(circle at center -150%, hsl(var(--brand-300)), transparent 80%), radial-gradient(ellipse at center 230%, var(--background-surface-200), transparent 75%)'

/** Shared frame for every survey chart: gradient container + Q&A/eyebrow header.
 *  When `isEmpty` is set (no data for the active year), renders the
 *  "added in 2026" placeholder instead of the chart body. */
export function SurveyChartShell({
  eyebrow,
  title,
  note,
  isEmpty = false,
  emptyNoun = 'question',
  children,
}: {
  eyebrow?: string
  title: string
  /** Smaller parenthetical under the title clarifying how the question was asked. */
  note?: string
  isEmpty?: boolean
  emptyNoun?: string
  children: ReactNode
}) {
  return (
    <div className="w-full bg-200 border-t border-muted" style={{ background: CHART_GRADIENT }}>
      <header className="px-8 py-8">
        {eyebrow && (
          <p className="text-foreground/30 text-sm font-mono uppercase tracking-widest">
            {eyebrow}
          </p>
        )}
        <h3 className="text-foreground text-xl tracking-tight text-balance">
          {title}
          {note && <span className="ml-2 text-sm font-normal text-foreground-light">({note})</span>}
        </h3>
      </header>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 px-8 text-center">
          <p className="text-foreground-light text-balance">
            This {emptyNoun} was added to the 2026 survey.
          </p>
          <p className="text-foreground-lighter text-sm text-balance">
            Switch the year to 2026 to view results.
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

/** Legend swatch + caption row, shared by the cross-tab and channel-mix charts. */
export function ChartLegend({
  items,
}: {
  items: { label: string; tone: 'accent' | 'muted'; variant: 'line' | 'dot' }[]
}) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className={`inline-block ${item.variant === 'line' ? 'w-4 h-[3px]' : 'w-3 h-3'} ${
              item.tone === 'accent' ? 'bg-brand' : 'bg-foreground-light'
            }`}
          />
          <span className="text-foreground-light text-xs font-mono uppercase tracking-widest">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}
