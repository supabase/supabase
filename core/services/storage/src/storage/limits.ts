import { ERRORS } from '@internal/errors'
import { getConfig } from '../config'
import {
  getDeleteObjectsLimit as getDeleteObjectsLimitForTenant,
  getFeatures,
  getFileSizeLimit as getFileSizeLimitForTenant,
} from '../internal/database/tenant'

const {
  isMultitenant,
  imageTransformationEnabled,
  icebergBucketDetectionSuffix,
  requestHardLimitsEnabled,
} = getConfig()

export type BucketType = 'STANDARD' | 'ANALYTICS'

export const MAX_OBJECTS_PER_REQUEST = 1000
export const MAX_KEYS_PER_S3_DELETE = 1000
// Versioned object deletes expand to the object key plus a `.info` sidecar key.
export const MAX_OBJECTS_PER_DELETE_BATCH = Math.floor(MAX_KEYS_PER_S3_DELETE / 2)
export const MAX_OBJECTS_PER_LOOKUP_BATCH = MAX_OBJECTS_PER_REQUEST
export const ICEBERG_BUCKET_RESERVED_SUFFIX = icebergBucketDetectionSuffix
export const RESERVED_BUCKET_SUFFIXES = [icebergBucketDetectionSuffix]

export const DELETE_OBJECTS_LIMIT_DESCRIPTION = `At most ${MAX_OBJECTS_PER_REQUEST} objects can be deleted per request.`

export async function getDeleteObjectsLimit(tenantId: string): Promise<number> {
  if (isMultitenant) {
    return (await getDeleteObjectsLimitForTenant(tenantId)) ?? MAX_OBJECTS_PER_REQUEST
  }

  return MAX_OBJECTS_PER_REQUEST
}

export async function enforceDeleteObjectsLimit(
  tenantId: string,
  objectCount: number
): Promise<void> {
  if (!requestHardLimitsEnabled) {
    return
  }

  const deleteObjectsLimit = await getDeleteObjectsLimit(tenantId)
  if (objectCount > deleteObjectsLimit) {
    throw ERRORS.InvalidRequest(
      `Bulk object requests are limited to ${deleteObjectsLimit} objects per request.`
    )
  }
}

/**
 * Get the maximum file size for a specific project
 * @param tenantId
 * @param maxUpperLimit
 */
export async function getFileSizeLimit(
  tenantId: string,
  maxUpperLimit?: number | null
): Promise<number> {
  let { uploadFileSizeLimit } = getConfig()
  if (isMultitenant) {
    uploadFileSizeLimit = await getFileSizeLimitForTenant(tenantId)
  }

  if (maxUpperLimit) {
    return Math.min(uploadFileSizeLimit, maxUpperLimit)
  }

  return uploadFileSizeLimit
}

/**
 * Determines if the image transformation feature is enabled.
 * @param tenantId
 */
export async function isImageTransformationEnabled(tenantId: string) {
  if (!isMultitenant) {
    return imageTransformationEnabled
  }

  const { imageTransformation } = await getFeatures(tenantId)

  return imageTransformation.enabled
}

// Hyphen is last so it stays a literal, not a range.
const VALID_OBJECT_KEY = /^[A-Za-z0-9_/!.*'() &$=@;:+,?-]*$/
const VALID_BUCKET_NAME = /^[A-Za-z0-9_!.*'() &$=@;:+,?-]*$/

/**
 * Validates if a given object key or bucket key is valid
 * @param key
 */
export function isValidKey(key: string): boolean {
  // only allow s3 safe characters and characters which require special handling for now
  // https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
  return key.length > 0 && VALID_OBJECT_KEY.test(key)
}

/**
 * Validates if a given object key or bucket key is valid
 * @param bucketName
 */
export function isValidBucketName(bucketName: string): boolean {
  // only allow s3 safe characters and characters which require special handling for now
  // the slash restriction come from bucket naming rules
  // and the rest of the validation rules are based on S3 object key validation.
  // https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
  // https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html
  return bucketName.length > 0 && bucketName.length < 101 && VALID_BUCKET_NAME.test(bucketName)
}

/**
 * Validates if a given object key is valid
 * throws if invalid
 * @param key
 */
export function mustBeValidKey(key?: string): asserts key is string {
  if (!key || !isValidKey(key)) {
    throw ERRORS.InvalidKey(key || '')
  }
}

/**
 * Validates if a given bucket name is valid
 * throws if invalid
 * @param key
 */
export function mustBeValidBucketName(key?: string): asserts key is string {
  if (!key || !isValidBucketName(key)) {
    throw ERRORS.InvalidBucketName(key || '')
  }
}

/**
 * Validates if a given bucket name is not reserved
 * @param bucketName
 */
export function mustBeNotReservedBucketName(bucketName?: string): asserts bucketName is string {
  if (!bucketName || RESERVED_BUCKET_SUFFIXES.some((suffix) => bucketName.endsWith(suffix))) {
    throw ERRORS.InvalidBucketName(bucketName || '')
  }
}

export function parseFileSizeToBytes(valueWithUnit: string) {
  const valuesRegex = /(^[0-9]+(?:\.[0-9]+)?)(gb|mb|kb|b)$/i

  if (!valuesRegex.test(valueWithUnit)) {
    throw ERRORS.InvalidFileSizeLimit()
  }

  const [, valueS, unit] = valueWithUnit.match(valuesRegex)!
  const value = parseFloat(valueS)

  switch (unit.toUpperCase()) {
    case 'GB':
      return Math.round(value * 1e9)
    case 'MB':
      return Math.round(value * 1e6)
    case 'KB':
      return Math.round(value * 1000)
    case 'B':
      return Math.round(value)
    default:
      throw ERRORS.InvalidFileSizeLimit()
  }
}

export const UUID_PATTERN =
  '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-5][0-9a-fA-F]{3}-[089abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
const UUID_REGEX = new RegExp(UUID_PATTERN)

export function isUuid(value: string) {
  return UUID_REGEX.test(value)
}

export function isEmptyFolder(object: string) {
  return object.endsWith('.emptyFolderPlaceholder')
}

const CLIENT_AGENT_REGEX = {
  // storage-py (storage3) = supabase-py/storage3 v0.12.1
  storage3: /supabase-py\/storage3 v(\d+)\.(\d+)\.(\d+)/i,
  // supabase-py = supabase-py/2.17.0
  'supabase-py': /supabase-py\/(\d+)\.(\d+)\.(\d+)/i,
}
export type ClientAgent = keyof typeof CLIENT_AGENT_REGEX

/**
 * Checks if the client is supabase-py and before the specified version
 *
 * @param client which client type are we checking for
 * @param userAgent user agent header string
 * @param version semver to check against, must be in format '0.0.0'
 */
export function isClientVersionBefore(
  client: ClientAgent,
  userAgent: string,
  version: string
): boolean {
  const [minMajor, minMinor, minPatch] = version.split('.').map(Number)
  const match = userAgent.match(CLIENT_AGENT_REGEX[client])
  if (!match) {
    return false
  }

  const [major, minor, patch] = match.slice(1).map(Number)

  if (major < minMajor) return true
  if (major > minMajor) return false
  if (minor < minMinor) return true
  if (minor > minMinor) return false
  return patch < minPatch
}
