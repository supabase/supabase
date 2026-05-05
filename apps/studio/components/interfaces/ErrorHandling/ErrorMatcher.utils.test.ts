import { describe, expect, it } from 'vitest'

import { getMappingForError } from './ErrorMatcher.utils'
import { ConnectionTimeoutError, UnknownAPIResponseError } from '@/types/api-errors'

describe('getMappingForError', () => {
  it('returns the mapping for a classified error with a known errorType', () => {
    const error = new ConnectionTimeoutError('connection terminated due to connection timeout')
    const mapping = getMappingForError(error)
    expect(mapping).not.toBeNull()
    expect(mapping?.id).toBe('connection-timeout')
  })

  it('returns null for UnknownAPIResponseError (no troubleshooting guide)', () => {
    const error = new UnknownAPIResponseError('something went wrong')
    expect(getMappingForError(error)).toBeNull()
  })

  it('returns null for a plain string', () => {
    expect(getMappingForError('some error message')).toBeNull()
  })

  it('returns null for null', () => {
    expect(getMappingForError(null)).toBeNull()
  })

  it('returns null for an object with no errorType', () => {
    expect(getMappingForError({ message: 'error' })).toBeNull()
  })

  it('returns null for an object with an unrecognised errorType', () => {
    expect(getMappingForError({ errorType: 'not-a-real-type' })).toBeNull()
  })
})
