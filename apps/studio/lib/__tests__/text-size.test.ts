import { describe, expect, it } from 'vitest'

import { applyTextSize, parseTextSize, TEXT_SIZE_OPTIONS } from '@/lib/text-size'

describe('text size', () => {
  it('provides the three supported options', () => {
    expect(TEXT_SIZE_OPTIONS).toEqual([
      { label: 'Small', value: 'small' },
      { label: 'Default', value: 'default' },
      { label: 'Large', value: 'large' },
    ])
  })

  it.each(['small', 'default', 'large'] as const)('parses %s', (textSize) => {
    expect(parseTextSize(textSize)).toBe(textSize)
  })

  it.each([undefined, null, 'compact', 1, {}])('defaults malformed data: %j', (value) => {
    expect(parseTextSize(value)).toBe('default')
  })

  it('applies the root data attribute', () => {
    const root = document.createElement('html')

    applyTextSize(root, 'large')

    expect(root.dataset.textSize).toBe('large')
  })
})
