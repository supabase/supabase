import { describe, expect, it } from 'vitest'

import { guideSlug, troubleshootingSlug } from './markdown-sources'

describe('guideSlug', () => {
  it('strips the content/guides prefix and .mdx extension, keeping nested path', () => {
    expect(guideSlug('content/guides/ai/vector-columns.mdx')).toBe('ai/vector-columns')
  })

  it('handles a top-level guide', () => {
    expect(guideSlug('content/guides/getting-started.mdx')).toBe('getting-started')
  })
})

describe('troubleshootingSlug', () => {
  it('flattens to a troubleshooting/<filename> slug', () => {
    expect(troubleshootingSlug('content/troubleshooting/all-about-egress-a_Sg_e.mdx')).toBe(
      'troubleshooting/all-about-egress-a_Sg_e'
    )
  })
})
