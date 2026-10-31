import { describe, expect, it } from 'vitest'

import { metadata } from '../app/example/layout'

describe('example routes', () => {
  it('are excluded from search indexes', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})
