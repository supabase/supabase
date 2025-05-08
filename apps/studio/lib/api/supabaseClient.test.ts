import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readOnly } from './supabaseClient'

vi.mock('lib/constants', () => ({
  IS_PLATFORM: true,
}))

const readOnlyErrMessage = 'Read only error'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: () => {
        throw readOnlyErrMessage
      },
      delete: () => {
        throw readOnlyErrMessage
      },
      update: () => {
        throw readOnlyErrMessage
      },
    })),
    rpc: () => {
      throw readOnlyErrMessage
    },
  })),
}))

describe('supabaseClient', () => {
  it('should be defined', () => {
    expect(readOnly).toBeDefined()
  })

  it('should throw on inserts', () => {
    expect(() => readOnly.from('').insert({})).toThrowError()
  })

  it('should throw on deletes', () => {
    expect(() => readOnly.from('').delete({})).toThrowError()
  })

  it('should throw on updates', () => {
    expect(() => readOnly.from('').update({})).toThrowError()
  })

  it('should throw on rpc', () => {
    expect(() => readOnly.rpc({})).toThrowError()
  })
})
