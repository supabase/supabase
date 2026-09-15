import { literal, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'
import { z } from 'zod'

/**
 * A NOTICE/WARNING/INFO message Postgres emitted while a query ran, e.g.
 * `WARNING:  no privileges were granted for "messages"`. The query still succeeded, so this is
 * not an error, but psql prints these and users expect to see them. Mirrors `PostgresNotice`
 * in postgres-meta.
 */
const postgresNoticeSchema = z.object({
  severity: z.string().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
  detail: z.string().optional(),
  hint: z.string().optional(),
  where: z.string().optional(),
})
export type PostgresNotice = z.infer<typeof postgresNoticeSchema>

/** Response shape of pg-meta's `POST /query?withnotice=1`. */
const queryResponseWithNoticesSchema = z.object({
  data: z.array(z.unknown()),
  notices: z.array(postgresNoticeSchema),
})

/**
 * Normalizes the two response shapes of the pg-meta query endpoint: the bare rows array it
 * has always returned, and the `{ data, notices }` object it returns when notices are
 * requested. Callers only ever see rows plus a (possibly empty) notices list, so a backend
 * that does not forward notices yet degrades to "no notices" instead of breaking.
 */
export function parseExecuteSqlResponse<T = unknown>(
  response: unknown
): { rows: T; notices: PostgresNotice[] } {
  if (Array.isArray(response)) return { rows: response as T, notices: [] }

  const parsed = queryResponseWithNoticesSchema.safeParse(response)
  if (parsed.success) return { rows: parsed.data.data as T, notices: parsed.data.notices }

  return { rows: response as T, notices: [] }
}

/**
 * Formats a notice the way psql prints it, one line per field:
 *
 *     WARNING:  no privileges were granted for "messages"
 *     DETAIL:  ...
 *     HINT:  ...
 *     CONTEXT:  ...
 */
export function getSqlNoticeLines(notice: PostgresNotice): string[] {
  const lines = [`${notice.severity ?? 'NOTICE'}:  ${notice.message ?? ''}`.trimEnd()]
  if (notice.detail) lines.push(`DETAIL:  ${notice.detail}`)
  if (notice.hint) lines.push(`HINT:  ${notice.hint}`)
  if (notice.where) lines.push(`CONTEXT:  ${notice.where}`)
  return lines
}

/**
 * Pick which lines to render for a SQL editor error.
 *
 * pg-meta returns `formattedError` with multi-line ERROR/HINT/LINE output from Postgres.
 * Historically only `message` was reliably populated end-to-end, which is why the UI also
 * falls back to splitting `message` on newlines — e.g. the enhanced permission-denied HINT
 * added by supabase/postgres#2084 arrives in the message body on some paths.
 *
 * Returns an empty array when the error is single-line (message only) — callers fall back to
 * a plain "Error: {message}" rendering in that case.
 */
export function getSqlErrorLines(error: { message?: string; formattedError?: string }): string[] {
  const formattedLines = (error.formattedError?.split('\n') ?? []).filter((x) => x.length > 0)
  if (formattedLines.length > 0) return formattedLines

  const messageLines = (error.message?.split('\n') ?? []).filter((x) => x.length > 0)
  return messageLines.length > 1 ? messageLines : []
}

/**
 * Removes trailing `;` characters from a safe SQL fragment. Only ever removes
 * existing terminators — never adds text — so the result is exactly as safe
 * as the input; the brand carries over intentionally. This is the one place
 * in the file allowed to reassert `SafeSqlFragment` on a derived string —
 * every other function composes new fragments through `safeSql`/`literal`.
 */
export function trimTrailingSemicolons(sql: SafeSqlFragment): SafeSqlFragment {
  return sql.replace(/;+\s*$/, '') as SafeSqlFragment
}

// [Joshen] Just FYI as well the checks here on whether to append limit is quite restricted
// This is to prevent dashboard from accidentally appending limit to the end of a query
// thats not supposed to have any, since there's too many cases to cover.
// We can however look into making this logic better in the future
// i.e It's harder to append the limit param, than just leaving the query as it is
// Otherwise we'd need a full on parser to do this properly
//
// Only accepts `SafeSqlFragment`: this decides whether to build (and builds)
// a new SQL fragment that gets executed, so every caller — including ones
// that only want the `appendAutoLimit` flag for a display hint — must already
// hold safe SQL. Composes the ` limit N;` suffix through `safeSql`/`literal`
// rather than gluing raw template-literal text onto the fragment and casting
// the result, so the only new content this function ever stamps safe is an
// internally-generated integer literal, never arbitrary concatenated text.
export function applyAutoLimit(
  sql: SafeSqlFragment,
  limit: number = 0
): { sql: SafeSqlFragment; appendAutoLimit: boolean } {
  // Remove lines and whitespaces to use for checking
  const cleanedSql = sql.trim().replaceAll('\n', ' ').replaceAll(/\s+/g, ' ')

  // Check how many queries
  const regMatch = cleanedSql.matchAll(/[a-zA-Z]*[0-9]*[;]+/g)
  const queries = new Array(...regMatch)
  const indexSemiColon = cleanedSql.lastIndexOf(';')
  const hasComments = cleanedSql.includes('--')
  const hasMultipleQueries =
    queries.length > 1 || (indexSemiColon > 0 && indexSemiColon !== cleanedSql.length - 1)

  // Check if need to auto limit rows
  const appendAutoLimit =
    limit > 0 &&
    !hasComments &&
    !hasMultipleQueries &&
    cleanedSql.toLowerCase().startsWith('select') &&
    !cleanedSql.toLowerCase().match(/fetch\s+first/i) &&
    !cleanedSql.match(/limit$/i) &&
    !cleanedSql.match(/limit;$/i) &&
    !cleanedSql.match(/limit [0-9]* offset [0-9]*\s*[;]?$/i) &&
    !cleanedSql.match(/limit [0-9]*\s*[;]?$/i)

  if (!appendAutoLimit) return { sql, appendAutoLimit: false }

  const core = cleanedSql.endsWith(';') ? trimTrailingSemicolons(sql) : sql
  const suffixed = safeSql`${core} limit ${literal(limit)};`

  return { sql: suffixed, appendAutoLimit: true }
}
