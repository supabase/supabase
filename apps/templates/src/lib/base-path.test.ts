import { describe, expect, it } from 'vitest'

import { withBasePath } from './base-path'

describe('withBasePath', () => {
  it('prefixes app-relative paths', () => {
    expect(withBasePath('/')).toBe('/templates')
    expect(withBasePath('/kanban')).toBe('/templates/kanban')
    expect(withBasePath('/?category=ai')).toBe('/templates/?category=ai')
  })

  it('leaves full and protocol-relative URLs alone', () => {
    expect(withBasePath('https://example.vercel.app')).toBe('https://example.vercel.app')
    expect(withBasePath('//cdn.example.com/a.png')).toBe('//cdn.example.com/a.png')
  })
})
