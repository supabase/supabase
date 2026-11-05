import { describe, expect, it } from 'vitest'

import { lintsToIssues, signalsToIssues, sortIssues } from './lint-to-issue'
import type { AdvisorSignalItem } from '@/components/ui/AdvisorPanel/AdvisorPanel.types'
import type { Lint } from '@/data/lint/lint-query'

const makeLint = (overrides: Partial<Lint> = {}): Lint => ({
  name: 'rls_disabled_in_public',
  title: 'RLS Disabled in Public',
  level: 'ERROR',
  facing: 'EXTERNAL',
  categories: ['SECURITY'],
  description: 'Detects tables in \\`public\\` without RLS.',
  detail: 'Table \\`public.posts\\` has no RLS.',
  remediation: 'https://example.com/fix',
  metadata: { type: 'table', schema: 'public', name: 'posts' },
  cache_key: 'rls_disabled_in_public_public_posts',
  ...overrides,
})

const makeBannedIp = (ip: string): AdvisorSignalItem => ({
  id: `signal:banned-ip:${ip}:v1`,
  dismissalKey: `signal:banned-ip:${ip}:v1`,
  source: 'signal',
  type: 'banned-ip',
  severity: 'warning',
  category: 'security',
  title: 'Banned IP address',
  summary: `The IP address \`${ip}\` is temporarily blocked.`,
  description: 'This IP address is temporarily blocked.',
  docsUrl: 'https://example.com/bans',
  actions: [{ label: 'Edit network bans', href: '/project/abc/database/settings#banned-ips' }],
  sourceData: { type: 'banned-ip', ip },
})

describe('lintsToIssues', () => {
  it('groups a check failing on several tables into one issue, so the list stays one row per problem', () => {
    const issues = lintsToIssues([
      makeLint(),
      makeLint({
        cache_key: 'rls_disabled_in_public_public_users',
        metadata: { type: 'table', schema: 'public', name: 'users' },
      }),
    ])

    expect(issues).toHaveLength(1)
    expect(issues[0].id).toBe('rls_disabled_in_public')
    expect(issues[0].affected.map((item) => item.resource.name)).toEqual(['posts', 'users'])
  })

  it('keeps separate checks as separate issues', () => {
    const issues = lintsToIssues([
      makeLint(),
      makeLint({ name: 'unused_index', categories: ['PERFORMANCE'], level: 'INFO' }),
    ])

    expect(issues.map((issue) => issue.category)).toEqual(['security', 'performance'])
  })

  it('takes the worst severity among its findings, so one critical table is not hidden by the rest', () => {
    const [issue] = lintsToIssues([
      makeLint({ level: 'INFO', cache_key: 'a' }),
      makeLint({ level: 'ERROR', cache_key: 'b' }),
    ])

    expect(issue.severity).toBe('critical')
  })

  it('shows lint text with its backticks unescaped, so markdown renders as code', () => {
    const [issue] = lintsToIssues([makeLint()])

    expect(issue.description).toBe('Detects tables in `public` without RLS.')
    expect(issue.affected[0].detail).toBe('Table `public.posts` has no RLS.')
  })

  it('still lists a finding without an entity, so a project-wide problem has somewhere to show', () => {
    const [issue] = lintsToIssues([makeLint({ metadata: undefined })])

    expect(issue.affected[0].resource).toEqual({ type: 'project', name: 'Project', schema: null })
  })

  it('falls back to what the API sent for a check Studio does not know yet', () => {
    const [issue] = lintsToIssues([
      // A lint added on the API before Studio's catalog catches up
      makeLint({ name: 'brand_new_lint' as Lint['name'], title: 'Brand new lint' }),
    ])

    expect(issue.title).toBe('Brand new lint')
    expect(issue.docsUrl).toBe('https://example.com/fix')
  })
})

describe('signalsToIssues', () => {
  it('has no issue when nothing is banned', () => {
    expect(signalsToIssues([])).toEqual([])
  })

  it('collects banned IPs into one issue, each with its own way to lift the ban', () => {
    const [issue] = signalsToIssues([makeBannedIp('1.1.1.1'), makeBannedIp('2.2.2.2')])

    expect(issue.source).toBe('signal')
    expect(issue.affected.map((item) => item.resource.name)).toEqual(['1.1.1.1', '2.2.2.2'])
    expect(issue.affected[0].action?.label).toBe('Edit network bans')
  })
})

describe('sortIssues', () => {
  it('leads with the most severe, then the one affecting the most', () => {
    const issues = lintsToIssues([
      makeLint({ name: 'unused_index', title: 'Unused', level: 'INFO', cache_key: 'a' }),
      makeLint({ name: 'no_primary_key', title: 'PK one', level: 'WARN', cache_key: 'b' }),
      makeLint({ name: 'duplicate_index', title: 'Dup', level: 'WARN', cache_key: 'c' }),
      makeLint({ name: 'duplicate_index', title: 'Dup', level: 'WARN', cache_key: 'd' }),
      makeLint({ name: 'rls_disabled_in_public', level: 'ERROR', cache_key: 'e' }),
    ])

    expect(sortIssues(issues).map((issue) => issue.id)).toEqual([
      'rls_disabled_in_public',
      'duplicate_index',
      'no_primary_key',
      'unused_index',
    ])
  })
})
