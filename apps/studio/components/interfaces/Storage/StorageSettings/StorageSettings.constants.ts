export const STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_FREE_PLAN = 50 * 1024 * 1024 // 50 MB
/** Max bytes for capped storage (i.e. Pro with spend cap) */
export const STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_CAPPED = 50 * 1024 * 1024 * 1024 // 50 GB
/** Max bytes for uncapped storage (i.e. Pro without spend cap, Team, Enterprise) */
export const STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED = 500 * 1024 * 1024 * 1024 // 500 GB

export enum StorageSizeUnits {
  BYTES = 'bytes',
  KB = 'KB',
  MB = 'MB',
  GB = 'GB',
}
