import { describe, expect, it } from 'vitest'

import {
  buildIssuePrompt,
  filterIssues,
  getIssueTelemetryProperties,
  sortAffected,
  summarizeAffected,
} from './Issues.utils'
import type {
  Issue,
  IssueAffectedResource,
  IssueResourceType,
  IssueSeverity,
} from '@/data/issues/issue.types'

const makeAffected = (
  name: string,
  type: IssueResourceType = 'table',
  severity: IssueSeverity = 'warning'
): IssueAffectedResource => ({
  id: name,
  resource: { type, schema: 'public', name },
  detail: `${name} needs attention`,
  severity,
  lint: null,
  action: null,
})

const makeIssue = (overrides: Partial<Issue> = {}): Issue => ({
  id: 'rls_disabled_in_public',
  title: 'RLS Disabled in Public',
  description: 'Tables in public need RLS.',
  severity: 'critical',
  category: 'security',
  source: 'lint',
  docsUrl: 'https://example.com',
  affected: [makeAffected('posts')],
  ...overrides,
})

describe('summarizeAffected', () => {
  it('names a single resource, since a count would hide which one it is', () => {
    expect(summarizeAffected([makeAffected('posts')])).toBe('public.posts')
  })

  it('counts by type once there are several, so a row stays one line', () => {
    expect(
      summarizeAffected([makeAffected('a'), makeAffected('b'), makeAffected('c', 'view')])
    ).toBe('2 tables and 1 view')
  })

  it('names one table once when several policies or indexes affect it', () => {
    expect(summarizeAffected([makeAffected('posts'), makeAffected('posts')])).toBe('public.posts')
  })

  it('keeps different schemas and resource types distinct', () => {
    const archived = makeAffected('posts')
    archived.resource.schema = 'archive'

    expect(
      summarizeAffected([makeAffected('posts'), archived, makeAffected('posts', 'view')])
    ).toBe('2 tables and 1 view')
  })

  it('has no summary when nothing is affected', () => {
    expect(summarizeAffected([])).toBeNull()
  })
})

describe('sortAffected', () => {
  it('puts the most severe first, then alphabetical, so a long list leads with what matters', () => {
    const sorted = sortAffected([
      makeAffected('b'),
      makeAffected('z', 'table', 'critical'),
      makeAffected('a'),
    ])

    expect(sorted.map((item) => item.resource.name)).toEqual(['z', 'a', 'b'])
  })
})

describe('filterIssues', () => {
  const security = makeIssue()
  const performance = makeIssue({
    id: 'unused_index',
    title: 'Unused Index',
    description: 'Indexes that are never used.',
    severity: 'info',
    category: 'performance',
    affected: [makeAffected('orders')],
  })
  const issues = [security, performance]
  const noFilters = { severity: [], category: [], search: '' }

  it('shows everything when no filter is set', () => {
    expect(filterIssues(issues, noFilters)).toEqual(issues)
  })

  it('narrows by category and severity, which is how old advisor links land on a filtered list', () => {
    expect(filterIssues(issues, { ...noFilters, category: ['performance'] })).toEqual([performance])
    expect(filterIssues(issues, { ...noFilters, severity: ['critical'] })).toEqual([security])
  })

  it('finds an issue by what it affects, so searching a table name surfaces its problems', () => {
    expect(filterIssues(issues, { ...noFilters, search: 'public.orders' })).toEqual([performance])
  })
})

describe('buildIssuePrompt', () => {
  it('gives an agent each affected resource and its detail, so it can act without opening Studio', () => {
    const prompt = buildIssuePrompt(makeIssue())

    expect(prompt).toContain('Title: RLS Disabled in Public')
    expect(prompt).toContain('- public.posts: posts needs attention')
    expect(prompt).toContain('Tables in public need RLS.')
  })
})

describe('getIssueTelemetryProperties', () => {
  it('reports in the shape advisor events already use, so dashboards keep counting across the rename', () => {
    expect(getIssueTelemetryProperties(makeIssue())).toEqual({
      advisorCategory: 'SECURITY',
      advisorType: 'rls_disabled_in_public',
      advisorLevel: 'ERROR',
    })
  })
})
