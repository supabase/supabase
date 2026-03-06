import { StorageSizeUnits } from './StorageSettings.constants'

const k = 1024

export const BUCKET_LIMIT_ERROR_PREFIX = 'bucketLimit:'

type BucketLimitErrorBucket = { name: string; limit: number }

export const convertFromBytes = (bytes: number, unit?: StorageSizeUnits) => {
  // Up to GB since that's our storage upload limit
  if (bytes <= 0) return { value: 0, unit: StorageSizeUnits.BYTES }

  const i =
    unit !== undefined
      ? Object.values(StorageSizeUnits).indexOf(unit)
      : Math.floor(Math.log(bytes) / Math.log(k))

  const formattedIdx = unit !== undefined ? (i < 0 ? 0 : i) : i > 3 ? 3 : i

  const formattedUnit = Object.values(StorageSizeUnits)[formattedIdx]
  const value = bytes / Math.pow(k, formattedIdx)
  return { value, unit: formattedUnit }
}

export const convertToBytes = (size: number, unit: StorageSizeUnits = StorageSizeUnits.BYTES) => {
  const i = Object.values(StorageSizeUnits).indexOf(unit)
  if (size < 0 || i < 0) return 0

  return size * Math.pow(k, i)
}

function getStorageURL(projectRef: string, protocol: string, endpoint?: string) {
  const projUrl = endpoint
    ? `${protocol}://${endpoint}`
    : `https://${projectRef}.storage.supabase.co`
  const url = new URL(projUrl)
  return url
}

export function getConnectionURL(projectRef: string, protocol: string, endpoint?: string) {
  const url = getStorageURL(projectRef, protocol, endpoint)
  url.pathname = '/storage/v1/s3'
  return url.toString()
}

export function getCatalogURI(projectRef: string, protocol: string, endpoint?: string) {
  const url = getStorageURL(projectRef, protocol, endpoint)
  url.pathname = '/storage/v1/iceberg'
  return url.toString()
}

export function getVectorURI(projectRef: string, protocol: string, endpoint?: string) {
  const url = getStorageURL(projectRef, protocol, endpoint)
  url.pathname = '/storage/v1/vector'
  return url.toString()
}

export const formatBytesForDisplay = (bytes: number) => {
  const { value, unit } = convertFromBytes(bytes)
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`
}

export const encodeBucketLimitErrorMessage = (buckets: BucketLimitErrorBucket[]) => {
  const encodedBuckets = buckets
    .map(({ name, limit }) => `${encodeURIComponent(name)}|${limit}`)
    .join(',')
  return `${BUCKET_LIMIT_ERROR_PREFIX}${encodedBuckets}`
}

export const isBucketLimitErrorMessage = (message?: string) => {
  return message?.startsWith(BUCKET_LIMIT_ERROR_PREFIX)
}

export const decodeBucketLimitErrorMessage = (message?: string): BucketLimitErrorBucket[] => {
  if (!isBucketLimitErrorMessage(message)) return []

  const payload = message?.slice(BUCKET_LIMIT_ERROR_PREFIX.length) ?? ''
  if (payload.length === 0) return []

  return payload
    .split(',')
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split('|')
      if (parts.length !== 2) return undefined

      const name = decodeURIComponent(parts[0])
      if (!name) return undefined

      const limitString = parts[1]
      const limit = Number(limitString ?? 0)
      if (Number.isNaN(limit)) return undefined

      return { name, limit }
    })
    .filter((entry) => entry !== undefined)
}
