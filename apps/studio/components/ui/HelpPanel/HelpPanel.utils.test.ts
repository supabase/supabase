import { describe, expect, it } from 'vitest'

import { getSupportLinkQueryParams } from './HelpPanel.utils'

describe('getSupportLinkQueryParams', () => {
  it('prefers parent_project_ref over routerRef', () => {
    expect(
      getSupportLinkQueryParams(
        { parent_project_ref: 'main-project' },
        { slug: 'my-org' },
        'router-ref'
      )
    ).toEqual({ projectRef: 'main-project' })
  })

  it('returns { projectRef } from routerRef when project has no parent_project_ref', () => {
    expect(getSupportLinkQueryParams({}, { slug: 'my-org' }, 'router-ref')).toEqual({
      projectRef: 'router-ref',
    })
  })

  it('returns { projectRef } from routerRef when project is undefined', () => {
    expect(getSupportLinkQueryParams(undefined, { slug: 'my-org' }, 'router-ref')).toEqual({
      projectRef: 'router-ref',
    })
  })

  it('returns { orgSlug } when no projectRef (no project, no routerRef)', () => {
    expect(getSupportLinkQueryParams(undefined, { slug: 'my-org' }, undefined)).toEqual({
      orgSlug: 'my-org',
    })
  })

  it('returns undefined when project, org and routerRef give no ref', () => {
    expect(getSupportLinkQueryParams(undefined, undefined, undefined)).toBeUndefined()
  })

  it('returns undefined when org has no slug and no projectRef', () => {
    expect(getSupportLinkQueryParams(undefined, {}, undefined)).toBeUndefined()
  })
})
