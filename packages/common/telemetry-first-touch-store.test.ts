import { afterEach, describe, expect, it } from 'vitest'

import {
  clearFirstTouchData,
  getFirstTouchData,
  setFirstTouchData,
} from './telemetry-first-touch-store'

const makeFakeData = (pathname: string) =>
  ({
    page_url: `https://supabase.com${pathname}`,
    pathname,
    page_title: 'Test',
    session_id: 'test-session',
    ph: { referrer: 'https://google.com' },
  }) as ReturnType<typeof getFirstTouchData> & {}

describe('telemetry-first-touch-store', () => {
  // Reset between tests so module-scoped state doesn't leak
  afterEach(() => {
    clearFirstTouchData()
  })

  it('returns null before any write', () => {
    expect(getFirstTouchData()).toBeNull()
  })

  it('stores data and returns it on read', () => {
    const data = makeFakeData('/pricing')
    setFirstTouchData(data)
    expect(getFirstTouchData()).toEqual(data)
  })

  it('is write-once: a second call with different data is a no-op', () => {
    const first = makeFakeData('/pricing')
    const second = makeFakeData('/docs')

    setFirstTouchData(first)
    setFirstTouchData(second)

    expect(getFirstTouchData()).toEqual(first)
  })

  it('clearFirstTouchData resets to null', () => {
    setFirstTouchData(makeFakeData('/pricing'))
    clearFirstTouchData()
    expect(getFirstTouchData()).toBeNull()
  })

  it('allows writing again after clearFirstTouchData', () => {
    const first = makeFakeData('/pricing')
    const second = makeFakeData('/docs')

    setFirstTouchData(first)
    clearFirstTouchData()

    setFirstTouchData(second)
    expect(getFirstTouchData()).toEqual(second)
  })
})
