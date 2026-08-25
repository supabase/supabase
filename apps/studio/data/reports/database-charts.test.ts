import { describe, expect, it } from 'vitest'

import { getReportAttributesV2 } from './database-charts'
import { Project } from '@/data/projects/project-detail-query'

const buildProject = (overrides: Partial<Project> = {}) =>
  ({
    infra_compute_size: 'micro',
    high_availability: false,
    ...overrides,
  }) as Project

const getBurstBalanceChart = (project: Project, showDiskIOBurstBalanceChart = true) =>
  getReportAttributesV2(
    [],
    project,
    undefined,
    undefined,
    undefined,
    false,
    showDiskIOBurstBalanceChart
  ).find((chart) => chart.id === 'disk-io-burst-balance')

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
