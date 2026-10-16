import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getHighestCrossedThresholdZone,
  getThresholdZoneRuns,
} from '@/components/ui/Charts/ComposedChartThresholdZones.utils'
import { getMemoryCommitmentRanges } from '@/data/reports/database-charts.utils'

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllEnvs())

const START = '2026-10-16T10:00:00Z'
const END = '2026-10-16T11:00:00Z'
const GIB = 1024 ** 3

describe('memory commitment preview fixtures', () => {
  it.each([
    { preview: 'warn', selectedIndex: 0 },
    { preview: 'problematic', selectedIndex: 1 },
    { preview: 'severe', selectedIndex: 2 },
  ] as const)(
    'produces the real chart risk level for $preview across a resize',
    async ({ preview, selectedIndex }) => {
      vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'staging')
      const { getMemoryCommitmentPreviewData } = await import('./MetricsTab.utils')
      const data = getMemoryCommitmentPreviewData(preview, START, END)
      expect(data).toBeDefined()
      if (!data) throw new Error('Expected fixture data')

      const zones = [
        { runs: getThresholdZoneRuns(getMemoryCommitmentRanges(data, 0.5, 0.8)) },
        { runs: getThresholdZoneRuns(getMemoryCommitmentRanges(data, 0.8, 0.9)) },
        { runs: getThresholdZoneRuns(getMemoryCommitmentRanges(data, 0.9)) },
      ]
      expect(getHighestCrossedThresholdZone(data, zones, 'ram_commit_used')).toBe(selectedIndex)
      expect(data[0].period_start).toBe(new Date(START).toISOString())
      expect(data.at(-1)?.period_start).toBe(new Date(END).toISOString())
      const capacity = getMemoryCommitmentRanges(data, 1, 1)
      expect(capacity[0]).toEqual([9 * GIB, 9 * GIB])
      expect(capacity.at(-1)).toEqual([3 * GIB, 3 * GIB])
    }
  )

  it('returns no override for Default or an invalid date range', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'local')
    const { getMemoryCommitmentPreviewData } = await import('./MetricsTab.utils')

    expect(getMemoryCommitmentPreviewData('default', START, END)).toBeUndefined()
    expect(getMemoryCommitmentPreviewData('severe', undefined, END)).toBeUndefined()
    expect(getMemoryCommitmentPreviewData('severe', 'invalid', END)).toBeUndefined()
    expect(getMemoryCommitmentPreviewData('severe', END, START)).toBeUndefined()
  })

  it.each(['prod', 'preview'])('cannot create simulated chart data in %s', async (environment) => {
    vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', environment)
    const { getMemoryCommitmentPreviewData } = await import('./MetricsTab.utils')
    expect(getMemoryCommitmentPreviewData('severe', START, END)).toBeUndefined()
  })
})
