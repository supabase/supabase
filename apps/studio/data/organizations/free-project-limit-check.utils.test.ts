import { describe, expect, it } from 'vitest'

import { groupByOrganization } from './free-project-limit-check.utils'

const member = (email: string, orgs: { slug: string; refs: string[] }[]) => ({
  username: email.split('@')[0],
  primary_email: email,
  free_project_limit: 2,
  free_plan_organizations: orgs.map((o) => ({
    slug: o.slug,
    organization_name: `Org ${o.slug}`,
    projects: o.refs.map((ref) => ({ ref, name: `Project ${ref}` })),
  })),
})

describe('groupByOrganization', () => {
  it('lists each organization once with all affected members', () => {
    const result = groupByOrganization([
      member('a@x.com', [{ slug: 'one', refs: ['p1', 'p2'] }]),
      member('b@x.com', [
        { slug: 'one', refs: ['p2', 'p3'] },
        { slug: 'two', refs: ['p4'] },
      ]),
    ])

    expect(result).toHaveLength(2)
    expect(result[0].projects.map((p) => p.ref)).toEqual(['p1', 'p2', 'p3'])
    expect(result[0].members.map((m) => m.email)).toEqual(['a@x.com', 'b@x.com'])
    expect(result[1].members.map((m) => m.email)).toEqual(['b@x.com'])
  })

  it('keeps organizations and projects without access, with null slug and ref', () => {
    const result = groupByOrganization([
      {
        username: 'a',
        primary_email: 'a@x.com',
        free_project_limit: 2,
        free_plan_organizations: [
          {
            slug: null,
            organization_name: 'Hidden Org',
            projects: [
              { ref: null, name: 'Hidden Project' },
              { ref: null, name: 'Hidden Project' },
            ],
          },
        ],
      },
    ])

    expect(result).toHaveLength(1)
    expect(result[0].slug).toBeNull()
    expect(result[0].projects).toEqual([
      { key: 'name:Hidden Project', ref: null, name: 'Hidden Project' },
    ])
  })
})
