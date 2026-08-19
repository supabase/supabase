import type { AttributeColor } from '../Usage.colors'
import type { StorageRetentionTotals } from '@/data/storage/versioning/storage-retention-usage-query'

interface StorageSizeSegment {
  attributeKey: string
  totalsKey: keyof StorageRetentionTotals
  name: string
  color: AttributeColor
}

export const STORAGE_SIZE_SEGMENTS: readonly StorageSizeSegment[] = [
  { attributeKey: 'current', totalsKey: 'current', name: 'Current objects', color: 'white' },
  {
    attributeKey: 'noncurrent',
    totalsKey: 'noncurrent',
    name: 'Noncurrent objects',
    color: 'yellow',
  },
]
