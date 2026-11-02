import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { memoryCommitmentThresholds } from '@/components/ui/Charts/Charts.test-fixtures'
import {
  getHighestCrossedThresholdZone,
  getThresholdZoneRuns,
} from '@/components/ui/Charts/ComposedChartThresholdZones.utils'

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllEnvs())

const START = '2026-10-16T10:00:00Z'
const END = '2026-10-16T11:00:00Z'
const GIB = 1024 ** 3

describe('memory commitment preview fixtures', () => {
  it.each([
    { preview: 'warn', expectedBadge: 'Warning' },
    { preview: 'problematic', expectedBadge: 'Problematic' },
    { preview: 'severe', expectedBadge: 'Severe' },
  ] as const)(
    'makes $preview trigger the expected warning even when infrastructure capacity changes',
    async ({ preview, expectedBadge }) => {
      vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'staging')
      const { getMemoryCommitmentPreviewData } = await import('./MetricsTab.utils')
      const data = getMemoryCommitmentPreviewData(preview, START, END)
      expect(data).toBeDefined()
      if (!data) throw new Error('Expected fixture data')

      const zones = memoryCommitmentThresholds.map((zone) => ({
        ...zone,
        runs: getThresholdZoneRuns(zone.getRanges(data)),
      }))
      const selectedIndex = getHighestCrossedThresholdZone(data, zones, 'ram_commit_used')
      const selectedZone = selectedIndex === undefined ? undefined : zones[selectedIndex]
      expect(selectedZone?.badgeLabel).toBe(expectedBadge)
      expect(data[0].period_start).toBe(new Date(START).toISOString())
      expect(data.at(-1)?.period_start).toBe(new Date(END).toISOString())
      const capacityZone = memoryCommitmentThresholds.find((zone) => zone.isAlwaysVisible)
      if (!capacityZone) throw new Error('Expected the full capacity threshold')
      const capacity = capacityZone.getRanges(data)
      expect(capacity[0]).toEqual([9 * GIB, 9 * GIB])
      expect(capacity.at(-1)).toEqual([3 * GIB, 3 * GIB])
    }
  )

  it('stops supplying simulated data when Default is selected', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'local')
    const { getMemoryCommitmentPreviewData } = await import('./MetricsTab.utils')

    expect(getMemoryCommitmentPreviewData('default', START, END)).toBeUndefined()
  })

  it.each(['prod', 'preview'])(
    'prevents simulated metrics from replacing real data in %s',
    async (environment) => {
      vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', environment)
      const { getMemoryCommitmentPreviewData } = await import('./MetricsTab.utils')
      expect(getMemoryCommitmentPreviewData('severe', START, END)).toBeUndefined()
    }
  )
})
