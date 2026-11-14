import { describe, expect, it } from 'vitest'

import { getPlaceholders } from '../translate'
import { en, type MessageKey } from './en'
import { ja } from './ja'

const isMessageKey = (key: string): key is MessageKey => Object.hasOwn(en, key)

describe('English catalog', () => {
  it('has no empty messages', () => {
    const empty = Object.entries(en).filter(([, message]) => message.trim() === '')
    expect(empty).toStrictEqual([])
  })
})

describe.each([['ja', ja]])('%s catalog', (_locale, catalog) => {
  const entries = Object.entries(catalog)

  it('only uses keys that exist in English', () => {
    expect(entries.map(([key]) => key).filter((key) => !isMessageKey(key))).toStrictEqual([])
  })

  it('has no empty messages', () => {
    expect(entries.filter(([, message]) => message.trim() === '')).toStrictEqual([])
  })

  it('uses the same placeholders as English', () => {
    const mismatched = entries.filter(([key, message]) => {
      if (!isMessageKey(key)) return false
      const expected = getPlaceholders(en[key]).sort()
      return getPlaceholders(message).sort().join() !== expected.join()
    })
    expect(mismatched).toStrictEqual([])
  })
})
