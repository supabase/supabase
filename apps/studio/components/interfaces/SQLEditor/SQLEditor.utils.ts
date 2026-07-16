import {
  literal,
  safeSql,
  untrustedSql,
  type SafeSqlFragment,
  type UntrustedSqlFragment,
} from '@supabase/pg-meta'
import { TABLE_EVENT_ACTIONS } from 'common/telemetry-constants'

import {
  alterDatabasePreventConnectionStatements,
  destructiveSqlRegex,
  NEW_SQL_SNIPPET_SKELETON,
  sqlAiDisclaimerComment,
  untitledSnippetTitle,
  updateWithoutWhereRegex,
} from './SQLEditor.constants'
import { ContentDiff, type IStandaloneCodeEditor, type PotentialIssues } from './SQLEditor.types'
import type { SnippetWithContent } from '@/data/content/sql-folders-query'
import type { DatabaseEventTrigger } from '@/data/database-event-triggers/database-event-triggers-query'
import type { Database } from '@/data/read-replicas/replicas-query'
import { generateUuid } from '@/lib/api/snippets.browser'
import { removeCommentsFromSql } from '@/lib/helpers'
import { wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import { sqlEventParser } from '@/lib/sql-event-parser'
import {
  isRoleImpersonationEnabled,
  type RoleImpersonationState,
} from '@/state/role-impersonation-state'

export type CreateTableWithoutRLS = {
  schema?: string
  tableName: string
}

// The ensure_rls event trigger only auto-enables RLS on tables in the public
// schema (see AUTO_ENABLE_RLS_EVENT_TRIGGER_SQL).
const ENSURE_RLS_TRIGGER_SCHEMAS = new Set(['public'])

export function hasActiveEnsureRLSTrigger(triggers: DatabaseEventTrigger[] | undefined) {
  return (
    triggers?.some(
      (t) =>
        (t.name === 'ensure_rls' || t.function_name === 'rls_auto_enable') &&
        t.enabled_mode !== 'DISABLED'
    ) ?? false
  )
}

/**
 * Filters out CREATE TABLE entries that will be covered by the project's
 * ensure_rls event trigger (which only handles tables in the public schema).
 * Tables in any other schema are returned unchanged so the user is still warned.
 */
export function filterTablesCoveredByEnsureRLSTrigger(
  tables: CreateTableWithoutRLS[],
  hasTrigger: boolean
): CreateTableWithoutRLS[] {
  if (!hasTrigger) return tables
  return tables.filter((t) => !ENSURE_RLS_TRIGGER_SCHEMAS.has((t.schema ?? 'public').toLowerCase()))
}

export const createSqlSnippetSkeletonV2 = ({
  name,
  sql,
  owner_id,
  project_id,
  folder_id,
  idOverride,
}: {
  name: string
  sql: string
  owner_id: number
  project_id: number
  folder_id?: string
  /**
   * Optionally, provide a specific snippetId to use for the snippet. This is used to ensure the snippet is created
   * with a known id, such as to prevent flicker in the SQL editor when adding new unsaved snippets.
   */
  idOverride?: string
}): SnippetWithContent => {
  const id = idOverride ?? generateUuid([folder_id, `${name}.sql`])

  return {
    ...NEW_SQL_SNIPPET_SKELETON,
    id,
    owner_id,
    project_id,
    name,
    folder_id,
    favorite: false,
    inserted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: {
      ...NEW_SQL_SNIPPET_SKELETON.content,
      content_id: id ?? '',
      unchecked_sql: untrustedSql(sql ?? ''),
    } as any,
    status: 'new',
  }
}

export function checkDestructiveQuery(sql: string) {
  const cleanedSql = removeCommentsFromSql(sql)
  return destructiveSqlRegex.some((regex) => regex.test(cleanedSql))
}

// Replace the contents of single-quoted string literals and double-quoted
// identifiers with empty quotes, so a downstream `where` scan can't be fooled
// by tokens like `UPDATE "where table" SET ...` or `SET name = 'where x'`.
// Postgres uses doubled quotes to escape, so `''` and `""` are matched as
// part of the same span rather than terminating it.
const stripQuotedSpans = (sql: string) =>
  sql.replace(/'(?:''|[^'])*'/g, "''").replace(/"(?:""|[^"])*"/g, '""')

// Function to check for UPDATE queries without WHERE clause
export function isUpdateWithoutWhere(sql: string): boolean {
  const updateStatements = sql
    .split(';')
    .filter((statement) => statement.trim().toLowerCase().startsWith('update'))
  return updateStatements.some(
    (statement) =>
      updateWithoutWhereRegex.test(statement) && !/where\s/i.test(stripQuotedSpans(statement))
  )
}

/**
 * Returns CREATE TABLE statements in `sql` that do not have a matching
 * ALTER TABLE ... ENABLE ROW LEVEL SECURITY in the same SQL submission.
 *
 * Operates on the SQL passed in (which is the user's selection if any, or the
 * full editor contents otherwise) so partial-execution selects work naturally.
 */
export function getCreateTablesMissingRLS(sql: string): CreateTableWithoutRLS[] {
  const events = sqlEventParser.getTableEvents(sql)

  // Match case-sensitively. Lowercasing would let quoted identifiers like
  // "MyTable" and "mytable" — which are different tables in Postgres — collide
  // and silently suppress the warning. The trade-off is rare false positives
  // when users mix case for *unquoted* identifiers (Postgres would have folded
  // them anyway), which is annoying but safe.
  const key = (e: { schema?: string; tableName?: string }) => `${e.schema ?? ''}.${e.tableName}`

  const rlsEnabled = new Set(
    events.filter((e) => e.type === TABLE_EVENT_ACTIONS.TableRLSEnabled && e.tableName).map(key)
  )

  return events
    .filter((e) => e.type === TABLE_EVENT_ACTIONS.TableCreated && e.tableName)
    .filter((e) => !rlsEnabled.has(key(e)))
    .map((e) => ({ schema: e.schema, tableName: e.tableName as string }))
}

/**
 * Appends `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements to `sql`
 * for each provided table.
 */
export function appendEnableRLSStatements(sql: string, tables: CreateTableWithoutRLS[]) {
  if (tables.length === 0) return sql

  // Postgres folds unquoted identifiers to lowercase, so any identifier that
  // isn't strictly lowercase-safe (e.g. "MyTable", "user table") must be quoted
  // to refer back to the original table.
  const quote = (identifier: string) =>
    /^[a-z_][a-z0-9_]*$/.test(identifier) ? identifier : `"${identifier.replace(/"/g, '""')}"`

  const additions = tables
    .map(({ schema, tableName }) => {
      const target = schema ? `${quote(schema)}.${quote(tableName)}` : quote(tableName)
      return `ALTER TABLE ${target} ENABLE ROW LEVEL SECURITY;`
    })
    .join('\n')

  const trimmed = sql.replace(/\s+$/, '')
  // If the SQL ends with a line comment, the appended ';' would be swallowed,
  // so put the terminator on its own line.
  const endsWithLineComment = /--[^\r\n]*$/.test(trimmed)
  const separator = trimmed.endsWith(';') ? '\n\n' : endsWithLineComment ? '\n;\n\n' : ';\n\n'

  return `${trimmed}${separator}-- Added by Supabase: enable Row Level Security on newly created tables\n${additions}\n`
}

export function checkAlterDatabaseConnection(sql: string): boolean {
  const cleanedSql = removeCommentsFromSql(sql)
  const statements = cleanedSql
    .split(';')
    .filter((statement) => statement.trim().toLowerCase().startsWith('alter database'))
  return statements.some((statement) =>
    alterDatabasePreventConnectionStatements.some((x) => statement.toLowerCase().includes(x))
  )
}

/**
 * Runs every pre-execution safety check on a query and packages the results as
 * `PotentialIssues`, used both to decide whether to show the warning modal and
 * to render its content.
 */
export function analyzeQueryIssues(
  sql: string,
  eventTriggers: DatabaseEventTrigger[] | undefined
): PotentialIssues {
  return {
    hasDestructiveOperations: checkDestructiveQuery(sql),
    hasUpdateWithoutWhere: isUpdateWithoutWhere(sql),
    hasAlterDatabasePreventConnection: checkAlterDatabaseConnection(sql),
    createTablesMissingRLS: filterTablesCoveredByEnsureRLSTrigger(
      getCreateTablesMissingRLS(sql),
      hasActiveEnsureRLSTrigger(eventTriggers)
    ),
  }
}

/**
 * Whether `issues` should block an unforced run behind the warning modal.
 */
export function hasBlockingIssues(issues: PotentialIssues, force: boolean): boolean {
  return (
    !force &&
    (!!issues.hasDestructiveOperations ||
      !!issues.hasUpdateWithoutWhere ||
      !!issues.hasAlterDatabasePreventConnection ||
      (issues.createTablesMissingRLS?.length ?? 0) > 0)
  )
}

/**
 * Resolves the connection string for the currently selected database (primary
 * or read replica) from the read-replicas list. Shared by the run and explain
 * flows so the lookup isn't duplicated.
 */
export function resolveConnectionString(
  databases: Database[] | undefined,
  selectedDatabaseId: string | undefined
): string | undefined {
  return (
    databases?.find((db) => db.identifier === selectedDatabaseId)?.connectionString ?? undefined
  )
}

/**
 * Whether a query run should lazily kick off AI title generation for the
 * snippet: only when the org has AI enabled (not disabled/HIPAA — which would
 * silently forward the query to the AI provider without consent), the
 * snippet still has its placeholder name, and we're running on the hosted
 * platform.
 */
export function shouldAutoGenerateTitle({
  aiOptInLevel,
  snippetName,
  isPlatform,
}: {
  aiOptInLevel: string
  snippetName: string | undefined
  isPlatform: boolean
}): boolean {
  return (
    aiOptInLevel !== 'disabled' && !!snippetName?.startsWith(untitledSnippetTitle) && isPlatform
  )
}

/**
 * Builds the params passed to `useExecuteSqlMutation`'s `execute`: applies the
 * auto-limit suffix and role impersonation to the SQL, and derives the
 * `autoLimit`/`isRoleImpersonationEnabled` flags. Callers still attach their
 * own `handleError`.
 */
export function buildExecuteParams({
  sql,
  limit,
  connectionString,
  projectRef,
  impersonatedRoleState,
}: {
  sql: SafeSqlFragment
  limit: number
  connectionString: string | undefined
  projectRef: string
  impersonatedRoleState: RoleImpersonationState
}) {
  const { sql: formattedSql, appendAutoLimit } = applyAutoLimit(sql, limit)

  return {
    projectRef,
    connectionString,
    sql: wrapWithRoleImpersonation(formattedSql, impersonatedRoleState),
    autoLimit: appendAutoLimit ? limit : undefined,
    isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRoleState.role),
    isStatementTimeoutDisabled: true as const,
    contextualInvalidation: true as const,
  }
}

export const generateMigrationCliCommand = (id: string, name: string, isNpx = false) =>
  `
${isNpx ? 'npx ' : ''}supabase snippets download ${id} |
${isNpx ? 'npx ' : ''}supabase migration new ${name}
`.trim()

export const generateSeedCliCommand = (id: string, isNpx = false) =>
  `
${isNpx ? 'npx ' : ''}supabase snippets download ${id} >> \\
  supabase/seed.sql
`.trim()

export const generateFileCliCommand = (id: string, name: string, isNpx = false) =>
  `
${isNpx ? 'npx ' : ''}supabase snippets download ${id} > \\
  ${name}.sql
`.trim()

export const compareAsModification = (sqlDiff: ContentDiff) => {
  const formattedModified = sqlDiff.modified.replace(sqlAiDisclaimerComment, '').trim()

  return {
    original: sqlDiff.original,
    modified: `${formattedModified}`,
  }
}

export const compareAsAddition = (sqlDiff: ContentDiff) => {
  const formattedOriginal = sqlDiff.original.replace(sqlAiDisclaimerComment, '').trim()
  const formattedModified = sqlDiff.modified.replace(sqlAiDisclaimerComment, '').trim()
  const newModified = (formattedOriginal ? formattedOriginal + '\n\n' : '') + formattedModified

  return {
    original: sqlDiff.original,
    modified: newModified,
  }
}

export const compareAsNewSnippet = (sqlDiff: ContentDiff) => {
  return {
    original: '',
    modified: sqlDiff.modified,
  }
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

/**
 * Resolves the SQL to act on from the editor: the current selection if there is
 * one, otherwise the full editor contents, falling back to the snippet's stored
 * SQL. Mirrors the logic that used to be duplicated inline across the run,
 * prettify and explain flows.
 *
 * Returns an `UntrustedSqlFragment`: editor contents (and snippet
 * `unchecked_sql`) can be influenced by third parties (e.g. URL-prefilled
 * snippets), so the value must only be promoted to executable via
 * `acceptUntrustedSql` inside an explicit run/explain user action.
 */
export function getEditorSql(
  editor: IStandaloneCodeEditor,
  snippetContent?: UntrustedSqlFragment
): UntrustedSqlFragment {
  const selection = editor.getSelection()
  const selectedValue = selection ? editor.getModel()?.getValueInRange(selection) : undefined
  return untrustedSql((selectedValue || editor.getValue()) ?? snippetContent)
}

/**
 * Parses a Postgres `formattedError` (e.g. `... LINE 3: ...`) into the 1-based
 * editor line to highlight, offset by the selection's start line. Returns `NaN`
 * when the error carries no parseable `LINE` marker; callers guard on that.
 */
export function computeErrorHighlightLine(
  error: { formattedError?: string },
  startLineNumber: number
): number {
  const formattedError = error.formattedError ?? ''
  const lineError = formattedError.slice(formattedError.indexOf('LINE'))
  return startLineNumber + Number(lineError.slice(0, lineError.indexOf(':')).split(' ')[1])
}

/**
 * Reassembles the original vs. modified SQL for an AI completion diff from the
 * completion metadata (text before/after the cursor + selection) and the
 * generated replacement text.
 */
export function assembleCompletionDiff(
  meta: { textBeforeCursor?: string; textAfterCursor?: string; selection?: string },
  text: string
): ContentDiff {
  const beforeSelection = meta.textBeforeCursor ?? ''
  const afterSelection = meta.textAfterCursor ?? ''
  const selection = meta.selection ?? ''
  return {
    original: beforeSelection + selection + afterSelection,
    modified: beforeSelection + text + afterSelection,
  }
}

/**
 * Builds the prompt text used to ask the assistant to debug a failing snippet.
 */
export function buildDebugPromptText(sql: string, errorMessage: string): string {
  const prompt = `Help me to debug the attached sql snippet which gives the following error: \n\n${errorMessage}`
  return `${prompt}\n\nSQL Query:\n\`\`\`sql\n${sql}\n\`\`\``
}
