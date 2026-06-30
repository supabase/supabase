import { beforeEach, describe, expect, it } from 'vitest'

import { findClippingAncestor } from './Row.utils'

describe('findClippingAncestor', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('returns null when no ancestor clips horizontal overflow', () => {
    const parent = document.createElement('div')
    const child = document.createElement('div')
    parent.appendChild(child)
    document.body.appendChild(parent)

    expect(findClippingAncestor(child)).toBeNull()
  })

  it.each(['hidden', 'auto', 'scroll', 'clip'])(
    'finds an ancestor with overflow-x: %s',
    (value) => {
      const clip = document.createElement('div')
      clip.style.overflowX = value
      const child = document.createElement('div')
      clip.appendChild(child)
      document.body.appendChild(clip)

      expect(findClippingAncestor(child)).toBe(clip)
    }
  )

  it('returns the nearest clipping ancestor, skipping non-clipping ones', () => {
    const outer = document.createElement('div')
    outer.style.overflowX = 'hidden'
    const middle = document.createElement('div')
    const inner = document.createElement('div')
    inner.style.overflowX = 'scroll'
    const child = document.createElement('div')

    outer.appendChild(middle)
    middle.appendChild(inner)
    inner.appendChild(child)
    document.body.appendChild(outer)

    expect(findClippingAncestor(child)).toBe(inner)
  })
})
