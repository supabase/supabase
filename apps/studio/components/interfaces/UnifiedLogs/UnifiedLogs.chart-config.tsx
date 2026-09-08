import { ChartConfig } from 'ui'

import { TooltipLabel } from './components/TooltipLabel'

// Extracted from UnifiedLogs.tsx so it can be reused by other timeline charts
// (e.g. the embedded Worker logs tab) without pulling in the full page module.
export const CHART_CONFIG = {
  success: {
    label: <TooltipLabel level="success" />,
    color: 'var(--chart-success)',
  },
  warning: {
    label: <TooltipLabel level="warning" />,
    color: 'var(--chart-warning)',
  },
  error: {
    label: <TooltipLabel level="error" />,
    color: 'hsl(var(--destructive-default))',
  },
} satisfies ChartConfig
