import { describe, expect, it } from 'vitest'

import { ANY_PROJECT_REF, getLinkProjectRef, getNanoProjects } from './PlanUpgradeSuccess.utils'
import { createMockOrgProject } from '@/tests/helpers'

describe('getNanoProjects', () => {
  it('returns running projects on Nano compute', () => {
    const projects = [
      createMockOrgProject({ ref: 'nano-active', computeSize: 'nano' }),
      createMockOrgProject({ ref: 'micro-active', computeSize: 'micro' }),
      createMockOrgProject({ ref: 'nano-paused', computeSize: 'nano', status: 'INACTIVE' }),
    ]

    expect(getNanoProjects(projects).map((project) => project.ref)).toEqual(['nano-active'])
  })

  it('reads the compute size of the primary database, not a read replica', () => {
    const project = createMockOrgProject({ ref: 'primary', computeSize: 'micro' })
    project.databases.push({
      ...project.databases[0],
      identifier: 'replica',
      type: 'READ_REPLICA',
      infra_compute_size: 'nano',
    })

    expect(getNanoProjects([project])).toEqual([])
  })
})

describe('getLinkProjectRef', () => {
  it('links straight to the only running project', () => {
    const projects = [
      createMockOrgProject({ ref: 'only-active' }),
      createMockOrgProject({ ref: 'paused', status: 'INACTIVE' }),
    ]

    expect(getLinkProjectRef(projects)).toBe('only-active')
  })

  it('falls back to the project picker when there are several or none', () => {
    const projects = [createMockOrgProject({ ref: 'a' }), createMockOrgProject({ ref: 'b' })]

    expect(getLinkProjectRef(projects)).toBe(ANY_PROJECT_REF)
    expect(getLinkProjectRef([])).toBe(ANY_PROJECT_REF)
  })
})
