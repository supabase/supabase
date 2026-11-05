import { describe, expect, it } from 'vitest'

import { resolveBreadcrumbs } from './breadcrumbs'

describe('resolveBreadcrumbs', () => {
  it('drops a crumb that repeats its parent', () => {
    const names = resolveBreadcrumbs('/guides/database/connecting-to-postgres').map(
      (crumb) => crumb.title || crumb.name
    )
    expect(names).toEqual(['Database', 'Fundamentals', 'Connecting to your database'])
  })

  it('adds no crumb for the overview row of a section', () => {
    const names = resolveBreadcrumbs('/guides/getting-started').map(
      (crumb) => crumb.title || crumb.name
    )
    expect(names).toEqual(['Start with Supabase'])
  })

  it('names a reference library the way the reference menu does', () => {
    expect(resolveBreadcrumbs('/reference/cli/supabase-init')).toMatchObject([
      { name: 'Home', url: '/reference' },
      { name: 'CLI Commands', url: '/reference/cli/introduction' },
    ])
  })

  it('falls back to the reference data for a library outside the reference menu', () => {
    expect(resolveBreadcrumbs('/reference/self-hosting-auth/start')).toMatchObject([
      { name: 'Home', url: '/reference' },
      { name: 'Self-Hosting Auth', url: '/reference/self-hosting-auth' },
    ])
  })

  it('gives the library crumb the version in the url, or the latest one', () => {
    expect(resolveBreadcrumbs('/reference/javascript/v1/select')[1]).toMatchObject({
      version: { library: 'javascript', current: 'v1' },
    })
    expect(resolveBreadcrumbs('/reference/javascript/select')[1]).toMatchObject({
      version: { library: 'javascript', current: 'v2' },
    })
  })

  it('gives no version to a library with only one version', () => {
    expect(resolveBreadcrumbs('/reference/server/introduction')[1].version).toBeUndefined()
  })

  it('adds no crumbs for an unknown reference library', () => {
    expect(resolveBreadcrumbs('/reference/not-a-library')).toEqual([])
  })
})
