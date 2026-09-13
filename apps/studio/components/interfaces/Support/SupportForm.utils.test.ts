import { describe, expect, it } from 'vitest'

import { createSupportFormUrl } from './SupportForm.utils'

describe('createSupportFormUrl', () => {
  it('returns base URL with no params', () => {
    expect(createSupportFormUrl({})).toBe('/support/new')
  })

  it('does not append a bare ? when params are empty', () => {
    expect(createSupportFormUrl({})).not.toContain('?')
  })

  it('includes provided params in the query string', () => {
    const url = createSupportFormUrl({ projectRef: 'my-project' })
    expect(url).toContain('projectRef=my-project')
  })

  it('includes multiple params', () => {
    const url = createSupportFormUrl({ projectRef: 'my-project', subject: 'help' })
    expect(url).toContain('projectRef=my-project')
    expect(url).toContain('subject=help')
  })
})
