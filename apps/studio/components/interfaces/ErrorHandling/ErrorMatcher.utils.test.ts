import { describe, expect, it } from 'vitest'

import { getMappingForError } from './ErrorMatcher.utils'
import { ConnectionTimeoutError, UnexpectedError } from '@/lib/errors/studio-errors'

describe('getMappingForError', () => {
  it('returns the mapping for a ConnectionTimeoutError', () => {
    const error = new ConnectionTimeoutError({
      message: 'connection terminated due to connection timeout',
    })
    const mapping = getMappingForError(error)
    expect(mapping).not.toBeNull()
    expect(mapping?.id).toBe('connection-timeout')
  })

  it('returns null for UnexpectedError (no troubleshooting guide)', () => {
    const error = new UnexpectedError({ message: 'something went wrong' })
    expect(getMappingForError(error)).toBeNull()
  })

  it('returns null for a plain string', () => {
    expect(getMappingForError('some error message')).toBeNull()
  })

  it('returns null for null', () => {
    expect(getMappingForError(null)).toBeNull()
  })

  it('returns null for a plain object with a message', () => {
    expect(getMappingForError({ message: 'error' })).toBeNull()
  })

  it('returns null for an object that only looks like a tagged error', () => {
    expect(getMappingForError({ _tag: 'DbConnectionTimeout', message: 'error' })).toBeNull()
  })
})
