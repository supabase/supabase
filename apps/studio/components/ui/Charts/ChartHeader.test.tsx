import { render, screen } from '@testing-library/react'
import { TooltipProvider } from 'ui'
import { expect, it } from 'vitest'

import { ChartHeader } from './ChartHeader'
import type { Project } from '@/data/projects/project-detail-query'
import { getReportAttributesV2 } from '@/data/reports/database-charts'
import { createMockProject } from '@/tests/helpers'

const project: Project = {
  ...createMockProject({}),
  connectionString: '',
  db_host: '',
  dbVersion: 'supabase-postgres-15.1.0',
  high_availability: false,
  infra_compute_size: 'micro',
  integration_source: null,
  restUrl: '',
  updated_at: '2026-01-01T00:00:00Z',
}
const thresholds = getReportAttributesV2(['database'], project).find(
  (chart) => chart.id === 'memory-commitment'
)?.thresholdZones

it.each(['Warning', 'Problematic', 'Severe'])(
  'shows the %s badge from the memory commitment report',
  (expectedLabel) => {
    const threshold = thresholds?.find((zone) => zone.badgeLabel === expectedLabel)
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
