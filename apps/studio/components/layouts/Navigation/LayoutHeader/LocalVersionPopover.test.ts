import { describe, expect, test } from 'vitest'

import { semverGte, semverLte } from './LocalVersionPopover.utils'

const v = (version: string) => {
  const [major, minor, patch] = version.split('.').map(Number)
  return { major, minor, patch }
}

describe('LocalVersionPopover.utils:semverLte', () => {
  test.each([
    ['1.2.2', '2.1.1', true],
    ['2.1.0', '1.0.0', false],
    ['2.1.2', '1.99.99', false],
    ['2.1.2', '2.1.2', true],
  ])('%s <= %s is %s', (version, compare, expected) => {
    expect(semverLte(v(version), v(compare))).toBe(expected)
  })
})

describe('LocalVersionPopover.utils:semverGte', () => {
  test.each([
    ['2.0.0', '1.99.99', true],
    ['1.99.99', '2.0.1', false],
    ['2.1.2', '2.1.2', true],
  ])('%s >= %s is %s', (version, compare, expected) => {
    expect(semverGte(v(version), v(compare))).toBe(expected)
  })
})
