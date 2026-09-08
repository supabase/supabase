import { describe, expect, it } from 'vitest'

import { getDefaultValueSuggestions } from './ColumnEditor.utils'

describe('getDefaultValueSuggestions', () => {
  it('prepends the NULL suggestion for a nullable column with type-specific suggestions', () => {
    const suggestions = getDefaultValueSuggestions('uuid', true)

    expect(suggestions[0]).toMatchObject({ name: 'Set as NULL', value: null })
    expect(suggestions.slice(1)).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'gen_random_uuid()' })])
    )
  })

  it('prepends the NULL suggestion for a nullable column with no type-specific suggestions', () => {
    const suggestions = getDefaultValueSuggestions('bool', true)

    expect(suggestions).toEqual([expect.objectContaining({ name: 'Set as NULL', value: null })])
  })

  it('omits the NULL suggestion for a non-nullable column', () => {
    const suggestions = getDefaultValueSuggestions('uuid', false)

    expect(suggestions.some((s) => s.value === null)).toBe(false)
    expect(suggestions).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'gen_random_uuid()' })])
    )
  })

  it('returns an empty array for a non-nullable column with no type-specific suggestions', () => {
    expect(getDefaultValueSuggestions('bool', false)).toEqual([])
  })
})
