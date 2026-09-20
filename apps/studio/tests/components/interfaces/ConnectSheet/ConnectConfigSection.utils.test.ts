import { describe, expect, test } from 'vitest'

import { getOptionMatchScore } from '@/components/interfaces/ConnectSheet/ConnectConfigSection.utils'

describe('ConnectConfigSection utils: getOptionMatchScore', () => {
  test.each(['', '   '])('matches a blank search (%j)', (search) => {
    expect(getOptionMatchScore('Next.js', search, ['nextjs'])).toBe(1)
  })

  test('matches a substring of the option label', () => {
    expect(getOptionMatchScore('Next.js', 'xt.j')).toBe(1)
  })

  test('matches a substring of an option keyword', () => {
    expect(getOptionMatchScore('Next.js', 'nextjs', ['nextjs'])).toBe(1)
  })

  test('matches case-insensitively and ignores surrounding search whitespace', () => {
    expect(getOptionMatchScore('React Native', '  NATIVE  ')).toBe(1)
  })

  test('does not match when the search is absent from the label and keywords', () => {
    expect(getOptionMatchScore('Next.js', 'flutter', ['nextjs'])).toBe(0)
  })

  test('does not require keywords', () => {
    expect(getOptionMatchScore('Next.js', 'nextjs')).toBe(0)
  })
})
