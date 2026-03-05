import { describe, expect, it } from 'vitest'

import { getSupportLinkQueryParams } from './HelpPanel.utils'

describe('getSupportLinkQueryParams', () => {
  it('returns { projectRef } when project has parent_project_ref', () => {
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

  it('returns { orgSlug } when project and routerRef are undefined but org has slug', () => {
    expect(getSupportLinkQueryParams(undefined, { slug: 'acme' }, undefined)).toEqual({
      orgSlug: 'acme',
    })
  })

  it('returns undefined when project, org and routerRef give no ref', () => {
    expect(getSupportLinkQueryParams(undefined, undefined, undefined)).toBeUndefined()
  })

  it('returns undefined when org has no slug and no projectRef', () => {
    expect(getSupportLinkQueryParams(undefined, {}, undefined)).toBeUndefined()
  })

  it('returns undefined when org is undefined and no projectRef', () => {
    expect(getSupportLinkQueryParams(undefined, undefined, undefined)).toBeUndefined()
  })

  it('prefers parent_project_ref over routerRef when both are present', () => {
    expect(
      getSupportLinkQueryParams({ parent_project_ref: 'parent-ref' }, { slug: 'org' }, 'router-ref')
    ).toEqual({ projectRef: 'parent-ref' })
  })
})
