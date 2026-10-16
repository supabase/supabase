import { render, screen } from '@testing-library/react'
import { TooltipProvider } from 'ui'
import { expect, it } from 'vitest'

import { ChartHeader } from './ChartHeader'

it.each([
  { label: 'Acknowledgment', badgeLabel: 'Warning', color: 'var(--color-yellow-900)' },
  { label: 'Problematic', badgeLabel: 'Problematic', color: 'var(--color-orange-900)' },
  { label: 'Severe', badgeLabel: 'Severe', color: 'hsl(var(--destructive-600))' },
])('shows the $badgeLabel badge for the selected risk level', ({ label, badgeLabel, color }) => {
  render(
    <TooltipProvider>
      <ChartHeader
        title="Memory commitment"
        hideChartType
        highlightedValue="6 GB"
        thresholdZoneWarning={{
          label,
          badgeLabel,
          color,
          tooltip: 'Optimize memory usage or upgrade compute.',
        }}
      />
    </TooltipProvider>
  )

  const badge = screen.getByLabelText(`Warning: ${label}`)
  expect(badge).toHaveTextContent(badgeLabel)
  expect(badge).toHaveAttribute('tabindex', '0')
})
