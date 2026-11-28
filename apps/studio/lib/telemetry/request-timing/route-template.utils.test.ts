import { describe, expect, it } from 'vitest'

import { toRouteTemplate } from './route-template.utils'

describe('toRouteTemplate', () => {
  it.each([
    ['/project/$ref/editor', '/project/[ref]/editor'],
    ['/org/$slug/general', '/org/[slug]/general'],
    ['/project/$ref/sql/$id', '/project/[ref]/sql/[id]'],
    ['/project/$ref/', '/project/[ref]'],
    ['/organizations', '/organizations'],
    ['/', '/'],
    ['', '/'],
  ])('turns %s into %s', (fullPath, template) => {
    expect(toRouteTemplate(fullPath)).toBe(template)
  })
})
