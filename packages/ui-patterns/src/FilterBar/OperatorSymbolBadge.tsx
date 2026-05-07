export type OperatorSymbolBadgeProps = {
  symbol: string
}

export function OperatorSymbolBadge({ symbol }: OperatorSymbolBadgeProps) {
  return (
    <span className="ml-auto text-xs text-foreground-light bg-surface-200 rounded px-1.5 py-0.5 font-mono">
      {symbol}
    </span>
  )
}
