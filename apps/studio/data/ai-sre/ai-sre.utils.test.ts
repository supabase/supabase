import { describe, expect, it } from 'vitest'

import type { AiSreConfig } from './ai-sre.types'
import {
  buildInsertRunSql,
  buildUpsertConfigSql,
  parseConfigRow,
  parseRunRow,
} from './ai-sre.utils'

const baseConfig: AiSreConfig = {
  enabled: true,
  cadence: 'daily',
  focusAreas: { performance: 4, security: 5, billing: 2 },
  githubAccessLevel: 'draft_pr',
  systemPrompt: 'Keep it stable',
  updatedAt: '2026-11-05T00:00:00.000Z',
}

describe('buildUpsertConfigSql', () => {
  it('upserts the singleton config row with sanitized values', () => {
    const sql = buildUpsertConfigSql(baseConfig)
    expect(sql).toContain('insert into supabase_sre.config')
    expect(sql).toContain('on conflict (id) do update set')
    expect(sql).toContain('draft_pr')
    expect(sql).toContain('"performance":4')
  })

  it('clamps out-of-range focus weights and defaults an unknown access level', () => {
    const sql = buildUpsertConfigSql({
      ...baseConfig,
      focusAreas: { performance: 99, security: -3, billing: 2.4 },
      githubAccessLevel: 'root' as AiSreConfig['githubAccessLevel'],
    })
    expect(sql).toContain('"performance":5')
    expect(sql).toContain('"security":0')
    expect(sql).toContain('"billing":2')
    expect(sql).toContain('read_only')
  })

  it('escapes quotes in the system prompt', () => {
    const sql = buildUpsertConfigSql({ ...baseConfig, systemPrompt: "o'brien" })
    expect(sql).not.toContain("o'brien")
    expect(sql).toContain("o''brien")
  })
})

describe('buildInsertRunSql', () => {
  it('writes a finished run with findings and confidence', () => {
    const sql = buildInsertRunSql({
      trigger: 'manual',
      status: 'success',
      summaryMd: '# ok',
      findings: [
        { surface: 'db', severity: 'high', symptom: 'slow query', recommendation: 'add index' },
      ],
      confidence: 0.8,
      githubPrUrl: null,
      finished: true,
      transcript: [{ type: 'tool-call', toolName: 'get_advisors', input: '{}' }],
    })
    expect(sql).toContain('insert into supabase_sre.runs')
    expect(sql).toContain('now()')
    expect(sql).toContain('0.8')
    expect(sql).toContain('slow query')
    expect(sql).toContain('get_advisors')
    expect(sql).toContain('null')
  })

  it('handles null confidence and unfinished runs', () => {
    const sql = buildInsertRunSql({
      trigger: 'schedule',
      status: 'failed',
      summaryMd: '',
      findings: [],
      confidence: null,
      githubPrUrl: null,
      finished: false,
      transcript: [],
    })
    expect(sql).toContain("'[]'::jsonb")
  })
})

describe('parseConfigRow', () => {
  it('returns null for a missing row', () => {
    expect(parseConfigRow(undefined)).toBeNull()
  })

  it('maps a db row to a typed config', () => {
    const config = parseConfigRow({
      enabled: true,
      cadence: 'weekly',
      focus_areas: { performance: 1, security: 2, billing: 3 },
      github_access_level: 'merge_pr',
      system_prompt: 'x',
      updated_at: '2026-11-05',
    })
    expect(config?.enabled).toBe(true)
    expect(config?.cadence).toBe('weekly')
    expect(config?.githubAccessLevel).toBe('merge_pr')
    expect(config?.focusAreas.billing).toBe(3)
  })
})

describe('parseRunRow', () => {
  it('maps a db run row to a typed run, defaulting findings', () => {
    const run = parseRunRow({
      id: 'abc',
      started_at: '2026-11-05',
      finished_at: null,
      trigger: 'manual',
      status: 'success',
      summary_md: '# report',
      findings: null,
      confidence: 0.5,
      github_pr_url: null,
      transcript: null,
    })
    expect(run.id).toBe('abc')
    expect(run.findings).toEqual([])
    expect(run.transcript).toEqual([])
    expect(run.confidence).toBe(0.5)
  })
})
