import { describe, expect, it } from 'vitest'

import { getReportAttributesV2, shouldShowDiskIOBurstBalanceChart } from './database-charts'
import { getThresholdZoneChart } from '@/components/ui/Charts/ComposedChartThresholdZones.utils'
import { RESOURCE_WARNING_MESSAGES } from '@/components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner.constants'
import { mapResponseToAnalyticsData } from '@/data/analytics/infra-monitoring-queries'
import type { InfraMonitoringMultiData } from '@/data/analytics/infra-monitoring-query'
import { Project } from '@/data/projects/project-detail-query'

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

const ENTITLED_FEATURES = ['database']

const buildProject = (overrides: Partial<Project> = {}): Project => ({ ...PROJECT, ...overrides })

const getDedicatedPoolerChart = (project: Project) => {
  const chart = getReportAttributesV2(ENTITLED_FEATURES, project).find(
    (attribute) => attribute.id === 'pgbouncer-connections'
  )
  if (!chart) throw new Error('Expected the dedicated pooler chart to exist')
  return chart
}

const getClientConnectionsAttribute = (chart: ReturnType<typeof getDedicatedPoolerChart>) => {
  const attribute = chart.attributes?.find(
    (attr) => attr !== false && attr.attribute === 'client_connections_pgbouncer'
  )
  if (!attribute) throw new Error('Expected the client connections attribute to exist')
  return attribute
}

const getBurstBalanceChart = (project: Project, showDiskIOBurstBalanceChart = true) =>
  getReportAttributesV2(
    ENTITLED_FEATURES,
    project,
    undefined,
    undefined,
    undefined,
    false,
    showDiskIOBurstBalanceChart
  ).find((chart) => chart.id === 'disk-io-burst-balance')

describe('getReportAttributesV2 dedicated pooler chart', () => {
  it('uses PgBouncer copy and links to the docs for standard projects', () => {
    const chart = getDedicatedPoolerChart(buildProject())
    const attribute = getClientConnectionsAttribute(chart)

    expect(chart.titleTooltip).toBeUndefined()
    expect(chart.docsUrl).toContain('/guides/platform/compute-and-disk#limits-and-constraints')
    expect(attribute).toMatchObject({ label: 'pgbouncer', tooltip: 'PgBouncer connections' })
  })

  it('uses multipooler copy and drops the docs link for High Availability projects', () => {
    const chart = getDedicatedPoolerChart(buildProject({ high_availability: true }))
    const attribute = getClientConnectionsAttribute(chart)

    expect(chart.docsUrl).toBeUndefined()
    expect(chart.titleTooltip).toContain('multipooler')
    expect(chart.titleTooltip).toContain('docs coming soon')
    expect(attribute).toMatchObject({ label: 'multipooler', tooltip: 'Multipooler connections' })
  })
})

const getSupavisorChart = (project: Project) =>
  getReportAttributesV2(ENTITLED_FEATURES, project).find(
    (chart) => chart.id === 'supavisor-connections-active'
  )

describe('getReportAttributesV2 shared pooler chart', () => {
  it('shows the chart for standard projects', () => {
    expect(getSupavisorChart(buildProject())?.hide).toBe(false)
  })

  it('hides the chart for high availability projects', () => {
    expect(getSupavisorChart(buildProject({ high_availability: true }))?.hide).toBe(true)
  })

  it('hides the chart when the database entitlement is missing', () => {
    expect(
      getReportAttributesV2([], buildProject()).find(
        (chart) => chart.id === 'supavisor-connections-active'
      )?.hide
    ).toBe(true)
  })
})

describe('getReportAttributesV2 disk-io-burst-balance chart', () => {
  it('shows the chart for burstable non high availability projects', () => {
    expect(getBurstBalanceChart(buildProject())?.hide).toBe(false)
  })

  it('hides the chart for high availability projects', () => {
    expect(getBurstBalanceChart(buildProject({ high_availability: true }))?.hide).toBe(true)
  })

  it('hides the chart when the feature flag is off', () => {
    expect(getBurstBalanceChart(buildProject(), false)?.hide).toBe(true)
  })

  it('hides the chart for non burstable compute sizes', () => {
    expect(getBurstBalanceChart(buildProject({ infra_compute_size: '16xlarge' }))?.hide).toBe(true)
  })
})

describe('shouldShowDiskIOBurstBalanceChart', () => {
  it('shows the chart for burstable non high availability projects when the flag is on', () => {
    expect(shouldShowDiskIOBurstBalanceChart(buildProject(), true)).toBe(true)
  })

  it('hides the chart when the flag is off', () => {
    expect(shouldShowDiskIOBurstBalanceChart(buildProject(), false)).toBe(false)
  })

  it('hides the chart for non burstable compute sizes', () => {
    expect(
      shouldShowDiskIOBurstBalanceChart(buildProject({ infra_compute_size: '4xlarge' }), true)
    ).toBe(false)
  })

  it('hides the chart for high availability projects', () => {
    expect(
      shouldShowDiskIOBurstBalanceChart(
        buildProject({ high_availability: true, infra_compute_size: 'large' }),
        true
      )
    ).toBe(false)
  })

  it('hides the chart when the project is unknown', () => {
    expect(shouldShowDiskIOBurstBalanceChart(undefined, true)).toBe(false)
  })
})

describe('resource warning metrics chart IDs', () => {
  it('keeps every configured chart target visible in the database report', () => {
    const visibleChartIds = new Set(
      getReportAttributesV2(ENTITLED_FEATURES, buildProject())
        .filter((chart) => !chart.hide)
        .map((chart) => chart.id)
    )
    const missingChartIds = Object.values(RESOURCE_WARNING_MESSAGES)
      .flatMap((message) => message.metricsChartId ?? [])
      .filter((chartId) => !visibleChartIds.has(chartId))

    expect(missingChartIds).toEqual([])
  })
})

describe('getReportAttributesV2 memory commitment chart', () => {
  it.each(['multi', 'single'] as const)(
    'prevents missing capacity from turning normal commitment into a Severe warning in 2m %s responses',
    (format) => {
      const chart = getReportAttributesV2(ENTITLED_FEATURES, buildProject()).find(
        (chart) => chart.id === 'memory-commitment'
      )
      if (!chart) throw new Error('Expected the memory commitment chart')

      const GIB = 1024 ** 3
      const samples = [
        { period_start: '2024-01-02T03:00:00Z', ram_commit_limit: String(5 * GIB) },
        { period_start: '2024-01-02T03:01:00Z', ram_commit_limit: undefined },
        { period_start: '2024-01-02T03:02:00Z', ram_commit_limit: String(5 * GIB) },
        { period_start: '2024-01-02T03:03:00Z', ram_commit_limit: String(5 * GIB) },
      ].map((sample) => ({ ...sample, ram_commit_used: String(4 * GIB) }))
      const metadata = { format: 'bytes', total: 0, totalAverage: 0, yAxisLimit: 9 * GIB }
      const attributes = ['ram_commit_used', 'ram_commit_limit'] as const
      const mapped = attributes.map((attribute) => {
        const response: InfraMonitoringMultiData =
          format === 'multi'
            ? {
                _originalInterval: '2m',
                data: samples.map(({ period_start, ...values }) => ({ period_start, values })),
                series: { [attribute]: metadata },
              }
            : { ...metadata, _originalInterval: '2m', data: samples }
        return mapResponseToAnalyticsData(
          response,
          [attribute],
          undefined,
          chart.thresholdZoneAttribute
        )[attribute].data
      })
      const data = mapped[0].map((point, index) => ({ ...point, ...mapped[1][index] }))
      const guidance = getThresholdZoneChart(
        data,
        chart.thresholdZones,
        chart.thresholdZoneAttribute
      )

      expect(guidance.selectedZone).toBeUndefined()
      expect(data[0].ram_commit_limit).toBeUndefined()
      expect(data.map((point) => point.ram_commit_used)).toEqual([4 * GIB, 4 * GIB])
      expect(data[1].ram_commit_limit).toBe(5 * GIB)
    }
  )

  it.each([true, false])(
    'controls risk guidance without hiding the commitment chart when risk zones are %s',
    (showMemoryCommitmentRiskZones) => {
      const chart = getReportAttributesV2(
        ENTITLED_FEATURES,
        buildProject(),
        undefined,
        undefined,
        undefined,
        false,
        false,
        true,
        showMemoryCommitmentRiskZones
      ).find((chart) => chart.id === 'memory-commitment')
      if (!chart) throw new Error('Expected the memory commitment chart')

      const GIB = 1024 ** 3
      const guidance = getThresholdZoneChart(
        [{ ram_commit_limit: 5 * GIB, ram_commit_used: 8.5 * GIB }],
        chart.thresholdZones,
        chart.thresholdZoneAttribute
      )

      expect(chart.hide).toBe(false)
      expect(guidance.selectedZone?.badgeLabel).toBe(
        showMemoryCommitmentRiskZones ? 'Severe' : undefined
      )
      expect(guidance.zones.map((zone) => zone.label)).toEqual(
        showMemoryCommitmentRiskZones ? ['Severe', 'Full commitment capacity'] : []
      )
    }
  )

  it('keeps capacity tied to compute size so overcommitment cannot raise the reference', () => {
    const chart = getReportAttributesV2(ENTITLED_FEATURES, buildProject()).find(
      (chart) => chart.id === 'memory-commitment'
    )
    const capacity = chart?.thresholdZones?.find((zone) => zone.isAlwaysVisible)
    const GIB = 1024 ** 3

    expect(
      capacity?.getRanges([
        { ram_commit_limit: 5 * GIB, ram_commit_used: 12 * GIB },
        { ram_commit_limit: 2 * GIB, ram_commit_used: 6 * GIB },
      ])
    ).toEqual([
      [9 * GIB, 9 * GIB],
      [3 * GIB, 3 * GIB],
    ])
  })
})
