import type { AttributeColor } from '../Usage.colors'
import type { StorageRetentionTotals } from '@/data/storage/versioning/storage-retention-usage-query'

interface StorageSizeSegment {
  /** The stacked chart series key, matching what the usage endpoint emits. */
  attributeKey: string
  /** The corresponding field on the retention totals. */
  totalsKey: keyof StorageRetentionTotals
  name: string
  color: AttributeColor
}

/**
 * What makes up Storage Size once versioning is in play. Single source of truth
 * for both the stacked bars and the breakdown table, so they can't drift.
 */
export const STORAGE_SIZE_SEGMENTS: readonly StorageSizeSegment[] = [
  { attributeKey: 'current', totalsKey: 'current', name: 'Current objects', color: 'white' },
  {
    attributeKey: 'noncurrent',
    totalsKey: 'noncurrent',
    name: 'Noncurrent objects',
    color: 'yellow',
  },
]
