import { describe, expect, it, vi } from 'vitest'

import { acquireSharedRegistration } from './useAddDefinitions'

describe('acquireSharedRegistration', () => {
  it('only registers once for multiple concurrent callers sharing a key', () => {
    const register = vi.fn(() => ({ dispose: vi.fn() }))

    acquireSharedRegistration('test-key-1', register)
    acquireSharedRegistration('test-key-1', register)
    acquireSharedRegistration('test-key-1', register)

    expect(register).toHaveBeenCalledTimes(1)
  })

  it('registers independently per key', () => {
    const register = vi.fn(() => ({ dispose: vi.fn() }))

    acquireSharedRegistration('test-key-2a', register)
    acquireSharedRegistration('test-key-2b', register)

    expect(register).toHaveBeenCalledTimes(2)
  })

  it('does not dispose while other callers are still holding the registration', () => {
    const dispose = vi.fn()
    const register = vi.fn(() => ({ dispose }))

    const releaseA = acquireSharedRegistration('test-key-3', register)
    acquireSharedRegistration('test-key-3', register)

    releaseA()

    expect(dispose).not.toHaveBeenCalled()
  })

  it('disposes once the last caller releases', () => {
    const dispose = vi.fn()
    const register = vi.fn(() => ({ dispose }))

    const releaseA = acquireSharedRegistration('test-key-4', register)
    const releaseB = acquireSharedRegistration('test-key-4', register)

    releaseA()
    releaseB()

    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('registers again after a full release cycle', () => {
    const register = vi.fn(() => ({ dispose: vi.fn() }))

    const release = acquireSharedRegistration('test-key-5', register)
    release()
    acquireSharedRegistration('test-key-5', register)

    expect(register).toHaveBeenCalledTimes(2)
  })

  it('is safe to release more times than acquired', () => {
    const dispose = vi.fn()
    const register = vi.fn(() => ({ dispose }))

    const release = acquireSharedRegistration('test-key-6', register)
    release()

    expect(() => release()).not.toThrow()
    expect(dispose).toHaveBeenCalledTimes(1)
  })
})
