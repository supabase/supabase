import { describe, expect, it } from 'vitest'

import {
  GENERATED_PAGE_QUERY_STATE_RULE_PROMPT,
  GENERATED_PAGE_STUDIO_MARKUP_RULES_PROMPT,
} from './generated-page-markup'
import {
  findGeneratedLogsSqlIssue,
  MAX_GENERATED_PAGE_QUERIES,
  renderPageInputSchema,
} from './generated-page-schema'

const validHtml = [
  '<main>',
  '<p role="status">Loading…</p>',
  '<p role="alert" hidden></p>',
  '<table></table>',
  '</main>',
].join('')

const validInput = {
  title: 'Auth debugging console',
  design: 'studio',
  layout: 'dashboard',
  design_plan: 'Lead with failed sign-ins over the last hour, then the errors behind them.',
  html: validHtml,
  database_queries: [
    { id: 'recent_users', title: 'Recent users', sql: 'select id from auth.users', row_limit: 50 },
  ],
  log_queries: [
    {
      id: 'auth_errors',
      title: 'Auth errors',
      sql: "select timestamp from logs where source = 'auth_logs' limit 100",
      time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
    },
  ],
  enable_supabase_client: true,
}

describe('renderPageInputSchema', () => {
  it('accepts a well-formed page', () => {
    expect(renderPageInputSchema.safeParse(validInput).success).toBe(true)
  })

  it('rejects duplicate ids across both query lists', () => {
    const result = renderPageInputSchema.safeParse({
      ...validInput,
      log_queries: [{ ...validInput.log_queries[0], id: 'recent_users' }],
    })

    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('Duplicate query id')
  })

  it('rejects row limits outside 1–1000', () => {
    for (const row_limit of [0, -1, 1001, 1.5]) {
      const result = renderPageInputSchema.safeParse({
        ...validInput,
        database_queries: [{ ...validInput.database_queries[0], row_limit }],
      })
      expect(result.success).toBe(false)
    }
  })

  it('caps each query list', () => {
    const many = Array.from({ length: MAX_GENERATED_PAGE_QUERIES + 1 }, (_, index) => ({
      id: `q${index}`,
      title: `Query ${index}`,
      sql: 'select 1',
      row_limit: 10,
    }))

    expect(renderPageInputSchema.safeParse({ ...validInput, database_queries: many }).success).toBe(
      false
    )
  })

  it('rejects ids the wrapper document could not safely address', () => {
    for (const id of ['Recent Users', 'recent-users', '', '1users', 'a'.repeat(64)]) {
      const result = renderPageInputSchema.safeParse({
        ...validInput,
        database_queries: [{ ...validInput.database_queries[0], id }],
        log_queries: [],
      })
      expect(result.success).toBe(false)
    }
  })

  it('rejects unknown top-level keys', () => {
    expect(
      renderPageInputSchema.safeParse({ ...validInput, allow_service_role: true }).success
    ).toBe(false)
  })

  it('rejects logs SQL without a source filter or a limit', () => {
    const result = renderPageInputSchema.safeParse({
      ...validInput,
      log_queries: [{ ...validInput.log_queries[0], sql: 'select timestamp from logs' }],
    })

    expect(result.success).toBe(false)
  })
})

describe('renderPageInputSchema design mode', () => {
  it('requires custom_design_request when the design is custom', () => {
    const result = renderPageInputSchema.safeParse({ ...validInput, design: 'custom' })

    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('custom_design_request is missing')
  })

  it('exempts a custom design from the Studio markup checks', () => {
    const result = renderPageInputSchema.safeParse({
      ...validInput,
      design: 'custom',
      custom_design_request: 'make it look like an old terminal',
      html: `<div style="color:#33ff66">${validHtml}</div>`,
    })

    expect(result.success).toBe(true)
  })

  it('still requires query states on a custom design', () => {
    const result = renderPageInputSchema.safeParse({
      ...validInput,
      design: 'custom',
      custom_design_request: 'make it look like an old terminal',
      html: '<pre>rows</pre>',
    })

    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('role=\\"status\\"')
  })
})

describe('renderPageInputSchema Studio markup checks', () => {
  const parseHtml = (html: string) => renderPageInputSchema.safeParse({ ...validInput, html })

  it('rejects literal colors but allows declared chart tokens', () => {
    expect(parseHtml(`<div style="color:#0f0f0f">x</div>${validHtml}`).success).toBe(false)
    expect(parseHtml(`<div style="color:rgb(1,2,3)">x</div>${validHtml}`).success).toBe(false)
    expect(
      parseHtml(`<style>:root{--chart-1:#2a9d63;}.bar{fill:var(--chart-1)}</style>${validHtml}`)
        .success
    ).toBe(true)
  })

  it('allows hsl() wrapping a legacy brand token', () => {
    expect(parseHtml(`<div style="color:hsl(var(--brand-link))">x</div>${validHtml}`).success).toBe(
      true
    )
  })

  it('ignores a literal color inside a comment', () => {
    expect(parseHtml(`<!-- was #ff0000 -->${validHtml}`).success).toBe(true)
  })

  it('ignores a numeric character reference that reads as a hex color', () => {
    expect(parseHtml(`<p>1,204 rows &#8212; last hour</p>${validHtml}`).success).toBe(true)
    expect(parseHtml(`<p>&#8226; failed</p>${validHtml}`).success).toBe(true)
  })

  it('ignores a fragment link whose target reads as a hex color', () => {
    expect(parseHtml(`<a href="#feed">Jump</a>${validHtml}`).success).toBe(true)
  })

  it('rejects character-level wrapping applied to every cell', () => {
    expect(parseHtml(`<style>td { overflow-wrap: anywhere; }</style>${validHtml}`).success).toBe(
      false
    )
    expect(
      parseHtml(`<style>table, th, td { word-break: break-all; }</style>${validHtml}`).success
    ).toBe(false)
    expect(
      parseHtml(`<style>.log-message { overflow-wrap: anywhere; }</style>${validHtml}`).success
    ).toBe(true)
  })

  it('rejects a page with queries but no loading or error state', () => {
    const result = parseHtml('<main><table></table></main>')

    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('declared quer')
  })

  it('allows a page with no queries and no states', () => {
    const result = renderPageInputSchema.safeParse({
      ...validInput,
      html: '<h1>Static</h1>',
      database_queries: [],
      log_queries: [],
    })

    expect(result.success).toBe(true)
  })
})

describe('findGeneratedLogsSqlIssue', () => {
  it('accepts a bounded, source-filtered query', () => {
    expect(
      findGeneratedLogsSqlIssue("select count() from logs where source = 'edge_logs' limit 10")
    ).toBeNull()
    expect(
      findGeneratedLogsSqlIssue("select 1 from logs where source in ('edge_logs') limit 10")
    ).toBeNull()
  })

  it('flags a missing source filter', () => {
    expect(findGeneratedLogsSqlIssue('select count() from logs limit 10')).toContain('source')
  })

  it('flags a missing limit', () => {
    expect(
      findGeneratedLogsSqlIssue("select count() from logs where source = 'edge_logs'")
    ).toContain('limit')
  })
})

/**
 * The prompt lines exist so the model meets each rule before it writes a page rather than
 * as a rejection afterwards, which costs it the whole generation. These assert the two
 * halves still say the same thing — the previous split let the prompt drift into
 * advertising three checks that no longer existed and none of the ones that did.
 */
describe('mechanical checks stated in the prompt', () => {
  it('states every Studio markup rule', () => {
    const { issues } = renderPageInputSchema.safeParse({
      ...validInput,
      html: `<style>td { word-break: break-all; }</style><div style="color:#0f0f0f">x</div>${validHtml}`,
    }).error!

    for (const rule of ['literal-color', 'table-wide-break']) {
      expect(JSON.stringify(issues)).toContain(rule)
    }
    expect(GENERATED_PAGE_STUDIO_MARKUP_RULES_PROMPT).toContain('--chart-')
    expect(GENERATED_PAGE_STUDIO_MARKUP_RULES_PROMPT).toContain('word-break: break-all')
    expect(GENERATED_PAGE_STUDIO_MARKUP_RULES_PROMPT.split('\n')).toHaveLength(2)
  })

  it('asks for the two roles the query-state check looks for literally', () => {
    expect(GENERATED_PAGE_QUERY_STATE_RULE_PROMPT).toContain('role="status"')
    expect(GENERATED_PAGE_QUERY_STATE_RULE_PROMPT).toContain('role="alert"')
  })
})
