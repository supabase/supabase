/**
 * CSS colors for charts in the Explorer prototype.
 *
 * `--chart-1` is already a complete CSS color, while the remaining chart
 * tokens are HSL channels. Normalize them here before passing them to Recharts
 * or inline styles.
 */
export const CHART_SERIES_COLORS = [
  'var(--chart-1)',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
]
