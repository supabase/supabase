import { describe, expect, it } from 'vitest'

import { cn } from './cn'

describe('cn', () => {
  it('joins conditional inputs like clsx', () => {
    expect(cn('a', ['b', { c: true, d: false }], undefined, null, false && 'e')).toBe('a b c')
  })

  it('resolves conflicting Tailwind utilities, last one wins', () => {
    expect(cn('p-2 text-foreground', 'p-4', 'text-foreground-light')).toBe(
      'p-4 text-foreground-light'
    )
    expect(cn('h-full', 'h-96')).toBe('h-96')
  })

  it('treats the custom card/content spacing scale as spacing utilities', () => {
    expect(cn('p-4', 'p-card')).toBe('p-card')
    expect(cn('px-content', 'px-6')).toBe('px-6')
    expect(cn('gap-2', 'gap-card')).toBe('gap-card')
  })

  it('keeps variants separate from base utilities', () => {
    expect(cn('p-2 hover:p-4', 'md:p-6')).toBe('p-2 hover:p-4 md:p-6')
  })
})
