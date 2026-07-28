import { PROD_URL } from '~/lib/constants'
import { describe, expect, it, vi } from 'vitest'

import { mdAlternate } from './md-alternates'

vi.mock('~/public/markdown/manifest.json', () => ({
  default: [
    'getting-started/quickstarts/react',
    'troubleshooting/all-about-supabase-egress-a_Sg_e',
    'troubleshooting',
    'index',
  ],
}))

describe('mdAlternate', () => {
  it('returns the absolute .md sibling for a manifest-listed guide slug', () => {
    expect(mdAlternate('getting-started/quickstarts/react')).toEqual({
      'text/markdown': `${PROD_URL}/guides/getting-started/quickstarts/react.md`,
    })
  })

  it('returns the sibling for a troubleshooting entry', () => {
    expect(mdAlternate('troubleshooting/all-about-supabase-egress-a_Sg_e')).toEqual({
      'text/markdown': `${PROD_URL}/guides/troubleshooting/all-about-supabase-egress-a_Sg_e.md`,
    })
  })

  it('returns the sibling for the troubleshooting index', () => {
    expect(mdAlternate('troubleshooting')).toEqual({
      'text/markdown': `${PROD_URL}/guides/troubleshooting.md`,
    })
  })

  it('maps the index slug to the root sibling, not a guides URL', () => {
    expect(mdAlternate('index')).toEqual({
      'text/markdown': `${PROD_URL}/index.md`,
    })
  })

  it('returns undefined for slugs without generated markdown', () => {
    expect(mdAlternate('database/extensions/wrappers/s3')).toBeUndefined()
    expect(mdAlternate('local-development/cli/config')).toBeUndefined()
  })
})
