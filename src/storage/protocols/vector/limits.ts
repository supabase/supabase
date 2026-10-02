import type { PutVectorsInput } from '@aws-sdk/client-s3vectors'
import { ERRORS } from '@internal/errors'

export const MIN_VECTOR_DIMENSIONS = 1
export const MAX_S3_QUERY_TOP_K = 10_000
export const MAX_PGVECTOR_QUERY_TOP_K = 100
export const MAX_QUERY_NEXT_TOKEN_LENGTH = 4_096
export const MAX_LIST_RESULTS = 1_000
export const MAX_SEGMENT_COUNT = 16
export const MAX_PUT_VECTORS = 500
export const MAX_GET_VECTOR_KEYS = 100
export const MAX_DELETE_VECTOR_KEYS = 500
export const MAX_VECTOR_KEY_LENGTH = 1_024

export function validateVectorKey(key: unknown, parameterName: string): void {
  if (typeof key !== 'string' || key.length < 1 || key.length > MAX_VECTOR_KEY_LENGTH) {
    throw ERRORS.InvalidParameter(parameterName, {
      message: `${parameterName} must be between 1 and ${MAX_VECTOR_KEY_LENGTH} characters`,
    })
  }
}

export function validateVectorKeys(keys: string[] | undefined, max: number): string[] {
  if (!Array.isArray(keys) || keys.length < 1 || keys.length > max) {
    throw ERRORS.InvalidParameter('keys', {
      message: `keys must contain between 1 and ${max} entries`,
    })
  }

  for (const key of keys) {
    validateVectorKey(key, 'keys')
  }

  return keys
}

export function validatePutVectors(
  vectors: PutVectorsInput['vectors']
): NonNullable<PutVectorsInput['vectors']> {
  if (!Array.isArray(vectors) || vectors.length < 1 || vectors.length > MAX_PUT_VECTORS) {
    throw ERRORS.InvalidParameter('vectors', {
      message: `vectors must contain between 1 and ${MAX_PUT_VECTORS} entries`,
    })
  }

  const seenKeys = new Set<string>()

  for (const vector of vectors) {
    if (!vector || vector.key === undefined) {
      throw ERRORS.MissingParameter('vectors.key')
    }

    validateVectorKey(vector.key, 'vectors.key')

    if (seenKeys.has(vector.key)) {
      throw ERRORS.InvalidParameter('vectors', {
        message: 'Request must not contain duplicate keys',
      })
    }

    seenKeys.add(vector.key)
  }

  return vectors
}
