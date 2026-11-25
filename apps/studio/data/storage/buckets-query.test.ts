import { describe, expect, it } from 'vitest'

import { shouldRetryBucketsQuery } from './buckets-query'
import { classifyResponseError } from '@/data/error-classification'

describe('shouldRetryBucketsQuery', () => {
  it('does not retry client errors', () => {
    for (const code of [400, 402, 403, 404]) {
      expect(shouldRetryBucketsQuery(0, classifyResponseError({ message: 'error', code }))).toBe(
        false
      )
    }
  })

  it('retries rate limits and server errors up to the limit', () => {
    for (const code of [429, 500, 503]) {
      const error = classifyResponseError({ message: 'error', code })
      expect(shouldRetryBucketsQuery(0, error)).toBe(true)
      expect(shouldRetryBucketsQuery(3, error)).toBe(false)
    }
  })

  it('does not retry when the project has no active API keys', () => {
    const error = classifyResponseError({ message: 'Project has no active API keys', code: 500 })
    expect(shouldRetryBucketsQuery(0, error)).toBe(false)
  })
})
