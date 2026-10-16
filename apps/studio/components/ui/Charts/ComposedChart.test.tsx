import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TooltipProvider } from 'ui'
import { afterEach, expect, it, vi } from 'vitest'

import { ComposedChart } from './ComposedChart'
import type { Project } from '@/data/projects/project-detail-query'
import { getReportAttributesV2 } from '@/data/reports/database-charts'

const GIB = 1024 ** 3

const PROJECT: Project = {
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres',
  db_host: 'db.project-ref.supabase.co',
  dbVersion: 'supabase-postgres-15.1.0',
  high_availability: false,
  id: 1,
  infra_compute_size: 'micro',
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Production',
  organization_id: 1,
  ref: 'project-ref',
  region: 'us-east-1',
  restUrl: 'https://project-ref.supabase.co',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

afterEach(() => vi.restoreAllMocks())

it('shows only the displayed threshold and capacity when hovering a recovered sample after resizing', async () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width: 650,
    height: 200,
    top: 0,
    right: 650,
    bottom: 200,
    left: 0,
    toJSON: () => ({}),
  })
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(650)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(200)
  const config = getReportAttributesV2(['database'], PROJECT).find(
    (chart) => chart.id === 'memory-commitment'
  )
  if (!config) throw new Error('Memory commitment report is unavailable')
  const { container } = render(
    <TooltipProvider>
      <ComposedChart
        title="Memory commitment"
        chartStyle="bar"
        hideChartType
        showTooltip
        showTotal
        xAxisKey="period_start"
        yAxisKey="ram_commit_used"
        referenceZoneAttribute={config.referenceZoneAttribute}
        referenceZones={config.referenceZones}
        attributes={[{ attribute: 'ram_commit_used', label: 'Committed' }]}
        updateDateRange={() => {}}
        data={[
          {
            period_start: '2026-10-16T10:00:00Z',
            ram_commit_limit: 5 * GIB,
            ram_commit_used: 7.5 * GIB,
          },
          {
            period_start: '2026-10-16T11:00:00Z',
            ram_commit_limit: 2 * GIB,
            ram_commit_used: 1.5 * GIB,
          },
        ]}
      />
    </TooltipProvider>
  )

  await waitFor(() => expect(container.querySelector('.recharts-surface')).toBeInTheDocument())
  const chart = container.querySelector('.recharts-wrapper')
  if (!chart) throw new Error('Chart is unavailable')
  try {
    fireEvent.mouseMove(chart, { clientX: 480, clientY: 100 })
    const threshold = await screen.findByText('80% threshold')
    expect(threshold.parentElement).toHaveTextContent('2.6 GB')
    expect(
      screen.getByText('Full commitment capacity', { selector: 'span' }).parentElement
    ).toHaveTextContent('3 GB')
    expect(screen.queryByText('50% threshold')).not.toBeInTheDocument()
    expect(screen.queryByText('90% threshold')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Warning: Problematic')).toHaveTextContent('Problematic')
  } finally {
    fireEvent.mouseLeave(chart)
  }
})
