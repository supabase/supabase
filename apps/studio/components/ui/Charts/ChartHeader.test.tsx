import { render, screen } from '@testing-library/react'
import { TooltipProvider } from 'ui'
import { expect, it } from 'vitest'

import { ChartHeader } from './ChartHeader'
import { memoryCommitmentThresholds } from './Charts.test-fixtures'

it.each(['Warning', 'Problematic', 'Severe'])(
  'shows %s so the commitment risk is readable without opening details',
  (expectedLabel) => {
    const threshold = memoryCommitmentThresholds.find((zone) => zone.badgeLabel === expectedLabel)
    if (!threshold) throw new Error(`Missing memory commitment threshold: ${expectedLabel}`)

    render(
      <TooltipProvider>
        <ChartHeader
          title="Memory commitment"
          hideChartType
          highlightedValue="6 GB"
          thresholdZoneWarning={threshold}
        />
      </TooltipProvider>
    )

    const badge = screen.getByLabelText(`Warning: ${threshold.label}`)
    expect(badge).toHaveTextContent(expectedLabel)
    expect(badge).toHaveAttribute('tabindex', '0')
  }
)
