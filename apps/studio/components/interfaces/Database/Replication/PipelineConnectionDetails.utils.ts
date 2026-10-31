import type { ReplicationDestinationByIdData } from '@/data/replication/destination-by-id-query'

export const getDestinationStorageRegion = (config?: ReplicationDestinationByIdData['config']) => {
  if (!config) return undefined
  if ('ducklake' in config) return config.ducklake.s3_region?.trim() || undefined
  if ('iceberg' in config && 'supabase' in config.iceberg) {
    return config.iceberg.supabase.s3_region?.trim() || undefined
  }
  return undefined
}
