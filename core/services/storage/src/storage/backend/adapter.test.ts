import { ERRORS, StorageBackendError } from '@internal/errors'
import { describe, expect, it } from 'vitest'
import {
  isMissingBackendObject,
  SEPARATOR,
  splitOptionalVersion,
  withOptionalVersion,
} from './adapter'

describe('isMissingBackendObject', () => {
  it('recognizes confirmed object absence and filesystem ENOENT', () => {
    expect(isMissingBackendObject(Object.assign(new Error('missing'), { code: 'ENOENT' }))).toBe(
      true
    )
    expect(
      isMissingBackendObject(
        StorageBackendError.fromError(
          Object.assign(new Error('missing'), {
            name: 'NoSuchKey',
            $metadata: { httpStatusCode: 404 },
          })
        )
      )
    ).toBe(true)
  })

  it('does not infer backend absence from missing database metadata', () => {
    expect(isMissingBackendObject(ERRORS.NoSuchKey('key'))).toBe(false)
  })

  it.each([
    'NoSuchBucket',
    'NotFound',
    'AccessDenied',
  ])('does not treat %s as proven object absence', (name) => {
    const error = StorageBackendError.fromError(
      Object.assign(new Error(name), {
        name,
        $metadata: { httpStatusCode: 404 },
      })
    )
    expect(isMissingBackendObject(error)).toBe(false)
  })

  it('does not trust a NoSuchKey label without a matching 404 status', () => {
    const error = StorageBackendError.fromError(
      Object.assign(new Error('missing'), {
        name: 'NoSuchKey',
        $metadata: { httpStatusCode: 503 },
      })
    )
    expect(isMissingBackendObject(error)).toBe(false)
  })
})

describe('withOptionalVersion', () => {
  it('keeps legacy and absent versions on the unsuffixed physical key', () => {
    expect(withOptionalVersion('bucket/key')).toBe('bucket/key')
    expect(withOptionalVersion('bucket/key', null)).toBe('bucket/key')
  })

  it('suffixes ordinary internal versions', () => {
    expect(withOptionalVersion('bucket/key', 'version-id')).toBe(`bucket/key${SEPARATOR}version-id`)
  })

  it('splits a physical revision using the configured separator', () => {
    expect(splitOptionalVersion(`bucket/key${SEPARATOR}version-id`)).toEqual({
      key: 'bucket/key',
      version: 'version-id',
    })
  })

  it('treats a key without the configured separator as a legacy revision', () => {
    expect(splitOptionalVersion('object')).toEqual({
      key: 'object',
      version: null,
    })
  })
})
