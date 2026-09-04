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

export const renderPageInputSchema = z
  .object({
    title: z.string().trim().min(1).max(120).describe('Title shown above the page in chat.'),
    html: z
      .string()
      .min(1)
      .max(MAX_GENERATED_PAGE_HTML_LENGTH)
      .describe(
        'Self-contained HTML for the page body, including its own <style> and <script> tags.'
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
