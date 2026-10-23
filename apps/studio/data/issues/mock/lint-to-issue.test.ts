import { describe, expect, it } from 'vitest'

import { lintToIssueFinding } from './lint-to-issue'
import type { Lint } from '@/data/lint/lint-query'

const rlsLint: Lint = {
  name: 'rls_disabled_in_public',
  title: 'RLS Disabled in Public',
  level: 'ERROR',
  facing: 'EXTERNAL',
  categories: ['SECURITY'],
  description: 'Detects tables without RLS in exposed schemas.',
  detail: 'Table \\`public.profiles\\` is public, but RLS has not been enabled.',
  remediation: 'https://supabase.com/docs/guides/database/database-linter?lint=0013',
  metadata: { schema: 'public', name: 'profiles', type: 'table' },
  cache_key: 'rls_disabled_in_public_public_profiles',
}

describe('lintToIssueFinding', () => {
  it('maps a lint onto an issue check with a stable fingerprint', () => {
    const { issue: draft, affected } = lintToIssueFinding({ lint: rlsLint, projectRef: 'abc' })

    expect(draft.title).toBe('RLS Disabled in Public')
    expect(draft.severity).toBe('critical')
    expect(draft.category).toBe('security')
    expect(draft.origin).toEqual({
      type: 'check',
      check_id: 'rls_disabled_in_public',
      check_name: 'RLS Disabled in Public',
    })
    expect(draft.fingerprint).toBe('check:rls_disabled_in_public')
    expect(affected.resource).toEqual({ type: 'table', schema: 'public', name: 'profiles' })
    expect(affected.severity).toBe('critical')
    expect(affected.detail).toContain('Table `public.profiles` is public')
    expect(draft.body.cells.some((cell) => cell._tag === 'database_cell')).toBe(true)
  })

  it('maps lint levels to severities and project-wide lints to a project resource', () => {
    const { issue: draft, affected } = lintToIssueFinding({
      lint: {
        ...rlsLint,
        name: 'log_data_api_error_rate_high',
        title: 'Data API error rate is high',
        level: 'WARN',
        categories: ['HEALTH'],
        metadata: { type: 'health', entity: 'Data API' },
        cache_key: 'log_data_api_error_rate_high',
      },
      projectRef: 'abc',
    })

    expect(draft.severity).toBe('warning')
    expect(affected.severity).toBe('warning')
    expect(draft.category).toBe('health')
    expect(affected.resource).toEqual({ type: 'project', name: 'Data API', schema: null })
  })
})
