import type { DataPoint } from '@/data/analytics/constants'
import type { MemoryCommitmentPreview } from '@/state/metrics-preview'

const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const IS_ENABLED = env === 'local' || env === 'staging'
const GIB = 1024 ** 3
const FRACTIONS = { warn: 0.65, problematic: 0.85, severe: 0.95 }

export function getMemoryCommitmentPreviewData(
  preview: MemoryCommitmentPreview,
  startDate: string | undefined,
  endDate: string | undefined
): DataPoint[] | undefined {
  if (!IS_ENABLED || preview === 'default' || !startDate || !endDate) return undefined
  const start = Date.parse(startDate)
  const end = Date.parse(endDate)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined

  return Array.from({ length: 40 }, (_, index) => {
    const physicalMemory = (index < 20 ? 8 : 2) * GIB
    const fraction = FRACTIONS[preview] + Math.sin(index / 3) * 0.015
    return {
      period_start: new Date(start + ((end - start) * index) / 39).toISOString(),
      ram_commit_limit: GIB + physicalMemory / 2,
      ram_commit_used: GIB + physicalMemory * fraction,
    }
  })
}
