/**
 * Wire schema shared by the `render_page` tool (server) and the chat renderer that hosts
 * the generated page (client).
 *
 * It lives apart from `generated-page-tools.ts` because that module is only ever loaded on
 * the server — it pulls in the AI SDK's tool factory — while the renderer needs the exact
 * same parsing rules to decide what it is about to run. Both sides parse the model's raw
 * input through these schemas; neither trusts the other's copy.
 *
 * Nothing here promotes SQL. Every `sql` field stays a plain string until the renderer's
 * approval click handler brands it — see `GeneratedPageRenderer`.
 */
import { z } from 'zod'

import { findGeneratedPageMarkupIssues, findGeneratedPageStateIssue } from './generated-page-markup'
import { timeRangeSchema } from '@/data/content/notebooks/notebook-schema'

/** Per-kind cap on declared queries. Keeps one page's approval surface reviewable. */
export const MAX_GENERATED_PAGE_QUERIES = 10

export const MIN_GENERATED_PAGE_ROW_LIMIT = 1
export const MAX_GENERATED_PAGE_ROW_LIMIT = 1000

/** Roughly 200KB of markup — far above any page the assistant writes in practice. */
export const MAX_GENERATED_PAGE_HTML_LENGTH = 200_000

/**
 * Query ids are the only thing the iframe may name, so they are deliberately narrow: a
 * short lowercase slug that can be compared as an exact map key and printed into the
 * wrapper document without escaping concerns.
 */
const queryIdSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_]{0,47}$/,
    'must start with a lowercase letter and contain only lowercase letters, digits, and underscores (max 48 characters)'
  )

const queryTitleSchema = z.string().trim().min(1).max(120)

const generatedPageDatabaseQuerySchema = z
  .object({
    id: queryIdSchema.describe('Identifier the page passes to window.studio.database.query().'),
    title: queryTitleSchema.describe('Short human-readable name shown in the approval preview.'),
    sql: z.string().trim().min(1).describe('Read-only Postgres SQL. No mutations.'),
    row_limit: z
      .number()
      .int()
      .min(MIN_GENERATED_PAGE_ROW_LIMIT)
      .max(MAX_GENERATED_PAGE_ROW_LIMIT)
      .describe('Maximum rows returned to the page.'),
  })
  .strict()

const generatedPageLogQuerySchema = z
  .object({
    id: queryIdSchema.describe('Identifier the page passes to window.studio.logs.query().'),
    title: queryTitleSchema.describe('Short human-readable name shown in the approval preview.'),
    sql: z
      .string()
      .trim()
      .min(1)
      .describe('ClickHouse logs SQL. Must filter by `source` and include a `limit`.'),
    time_range: timeRangeSchema.describe('Time range resolved at each run.'),
  })
  .strict()

/**
 * A logs query the page can re-run on demand must stay bounded, and the ClickHouse `logs`
 * table holds every service's lines — an unfiltered scan is both slow and useless. These
 * are the two rules the logs skill treats as non-negotiable, checked here so the model
 * gets the failure as a tool-input error rather than at run time.
 */
export function findGeneratedLogsSqlIssue(sql: string): string | null {
  if (!/\bsource\s*(?:=|in\b)/i.test(sql)) {
    return "logs SQL must filter by `source` (e.g. `where source = 'auth_logs'`)"
  }
  if (!/\blimit\b/i.test(sql)) {
    return 'logs SQL must include a `limit`'
  }
  return null
}

/**
 * Field order is load-bearing. The model emits tool input in schema order, so `design`,
 * `layout`, and `design_plan` are declared before `html` to make it commit to an approach
 * and write it down before it writes markup — the cheap, single-round-trip version of a
 * plan-then-build pass. Reordering these to put `html` first removes that effect.
 */
export const renderPageInputSchema = z
  .object({
    title: z.string().trim().min(1).max(120).describe('Title shown above the page in chat.'),
    design: z
      .enum(['studio', 'custom'])
      .describe(
        "'studio' — the default, matching the surrounding dashboard. 'custom' only when the user asked for a different look; it relaxes the Studio design checks, so choosing it without being asked produces an off-brand page."
      ),
    custom_design_request: z
      .string()
      .trim()
      .min(1)
      .max(400)
      .optional()
      .describe(
        "Required when design is 'custom': what the user actually asked for, in their words where possible. Omit entirely for 'studio'."
      ),
    layout: z
      .enum(['dashboard', 'table', 'detail', 'form', 'custom'])
      .describe(
        'The page\'s dominant shape: "dashboard" for metrics and charts, "table" for browsing records, "detail" for one record or issue, "form" for inputs and actions, "custom" when none fit.'
      ),
    design_plan: z
      .string()
      .trim()
      .min(1)
      .max(600)
      .describe(
        'Two or three sentences, written before the markup: the one thing this page leads with, the order of everything else, and what you are deliberately leaving out. Name the real subject, not the page type.'
      ),
    html: z
      .string()
      .min(1)
      .max(MAX_GENERATED_PAGE_HTML_LENGTH)
      .describe(
        'Self-contained HTML for the page body, including inline <style> and <script> tags, written to carry out design_plan. Studio theme variables and base element styles are injected; there is no component library and no Tailwind, so write your own CSS against the tokens. For design "studio", use var(--background), var(--foreground), var(--card), var(--border) etc. rather than literal colors — literal colors are rejected, so declare any unavoidable chart color once as a --chart-* custom property. For design "custom", use whatever palette the request calls for.'
      ),
    database_queries: z
      .array(generatedPageDatabaseQuerySchema)
      .max(MAX_GENERATED_PAGE_QUERIES)
      .describe('Postgres queries the page may run by id. Pass an empty array if none.'),
    log_queries: z
      .array(generatedPageLogQuerySchema)
      .max(MAX_GENERATED_PAGE_QUERIES)
      .describe('Logs queries the page may run by id. Pass an empty array if none.'),
    enable_supabase_client: z
      .boolean()
      .describe(
        'Whether the page needs window.supabase, a supabase-js client using the project publishable key.'
      ),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.design === 'custom' && value.custom_design_request === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['custom_design_request'],
        message:
          "design is 'custom' but custom_design_request is missing. Quote what the user asked for, or use design: 'studio'.",
      })
    }

    // Studio-design pages are held to the dashboard's own conventions. A custom design is
    // an explicit instruction to depart from them, so these checks would be wrong there.
    if (value.design === 'studio') {
      for (const issue of findGeneratedPageMarkupIssues(value.html)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['html'],
          message: `Studio design check (${issue.rule}): ${issue.message}`,
        })
      }
    }

    const stateIssue = findGeneratedPageStateIssue(
      value.html,
      value.database_queries.length + value.log_queries.length
    )
    if (stateIssue !== null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['html'], message: stateIssue })
    }

    const seen = new Set<string>()
    for (const query of [...value.database_queries, ...value.log_queries]) {
      if (seen.has(query.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['database_queries'],
          message: `Duplicate query id "${query.id}" — ids must be unique across database_queries and log_queries.`,
        })
      }
      seen.add(query.id)
    }

    value.log_queries.forEach((query, index) => {
      const issue = findGeneratedLogsSqlIssue(query.sql)
      if (issue !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['log_queries', index, 'sql'],
          message: `Query "${query.id}": ${issue}.`,
        })
      }
    })
  })

export type RenderPageInput = z.infer<typeof renderPageInputSchema>
