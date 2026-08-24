import { untrustedSql, type SafeSqlFragment, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { TABLE_EVENT_ACTIONS } from 'common/telemetry-constants'

import { isLogsSource, sqlSourceToFenceLanguage, type SqlSnippetSource } from './querySource'
import {
  alterDatabasePreventConnectionStatements,
  destructiveSqlRegex,
  NEW_SQL_SNIPPET_SKELETON,
  sqlAiDisclaimerComment,
  untitledSnippetTitle,
  updateWithoutWhereRegex,
} from './SQLEditor.constants'
import {
  ContentDiff,
  DiffType,
  type IStandaloneCodeEditor,
  type PotentialIssues,
} from './SQLEditor.types'
import type { SnippetWithContent } from '@/data/content/sql-folders-query'
import type { DatabaseEventTrigger } from '@/data/database-event-triggers/database-event-triggers-query'
import { untrustedLogSql, type UntrustedLogSqlFragment } from '@/data/logs/safe-analytics-sql'
import type { Database } from '@/data/read-replicas/replicas-query'
import { applyAutoLimit } from '@/data/sql/utils'
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
  source = 'database',
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
  /**
   * Which backend the new snippet targets.
   */
  source?: SqlSnippetSource
}): SnippetWithContent => {
  const id = idOverride ?? generateUuid([folder_id, `${name}.sql`])

  const base = {
    ...NEW_SQL_SNIPPET_SKELETON,
    id,
    owner_id,
    project_id,
    name,
    folder_id,
    favorite: false,
    inserted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'new' as const,
  }

  if (source === 'logs') {
    return {
      ...base,
      type: 'log_sql',
      content: {
        schema_version: NEW_SQL_SNIPPET_SKELETON.content.schema_version,
        content_id: id ?? '',
        unchecked_sql: untrustedLogSql(sql ?? ''),
      },
    }
  }

  return {
    ...base,
    type: 'sql',
    content: {
      ...NEW_SQL_SNIPPET_SKELETON.content,
      content_id: id ?? '',
      unchecked_sql: untrustedSql(sql ?? ''),
    },
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

/**
 * Derives the stable snippet id + loading state for the editor from the URL.
 */
export function deriveSnippetIdentity({
  urlId,
  generatedId,
  snippets,
}: {
  urlId: string | undefined
  generatedId: string
  snippets: Record<string, { snippet: { content?: unknown } }>
}): { id: string; isLoading: boolean } {
  const id = !urlId || urlId === 'new' ? generatedId : urlId

  const snippetIsLoading = !(id in snippets && snippets[id].snippet.content !== undefined)
  const isLoading = urlId === 'new' ? false : snippetIsLoading

  return { id, isLoading }
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
  snippetContent?: string
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
 * The SQL dialect the AI writes. Mirrors the `dialect` enum the completion API
 * route accepts — a snippet's dialect follows its source and never flips, so a
 * logs snippet always gets ClickHouse SQL and a database snippet Postgres.
 */
export type SqlDialect = 'postgres' | 'clickhouse'
export type SqlCompletionIntent = 'edit' | 'rewrite' | 'generate'

/**
 * Maps a snippet's query source to the dialect the AI should write in. Logs
 * snippets run against the ClickHouse-backed analytics endpoint; everything
 * else runs against the user's Postgres database.
 */
export function sqlSourceToDialect(source: SqlSnippetSource): SqlDialect {
  return isLogsSource(source) ? 'clickhouse' : 'postgres'
}

/**
 * Builds the request body sent to the AI completion endpoint. `dialect` is
 * omitted when undefined so callers that don't care keep the route's Postgres
 * default. `options` is the caller-provided extra fields (e.g.
 * `completionMetadata`), merged in last so it can override the defaults if it
 * ever needs to.
 */
export function buildCompletionRequestBody({
  projectRef,
  connectionString,
  orgSlug,
  dialect,
  options,
}: {
  projectRef: string | undefined
  connectionString: string | undefined | null
  orgSlug: string | undefined
  dialect?: SqlDialect
  options?: { completionMetadata?: unknown; intent?: SqlCompletionIntent }
}): {
  projectRef: string | undefined
  connectionString: string | undefined | null
  language: 'sql'
  orgSlug: string | undefined
  dialect?: SqlDialect
  completionMetadata?: unknown
  intent?: SqlCompletionIntent
} {
  return {
    projectRef,
    connectionString,
    language: 'sql',
    orgSlug,
    ...(dialect !== undefined && { dialect }),
    ...(options ?? {}),
  }
}

/**
 * Names the dialect for a logs snippet, whose SQL is ClickHouse against the `logs`
 * table. The in-app assistant also learns this from the message's `sqlSource`
 * metadata, but the same text is offered as "Copy prompt" and pasted into external
 * models, so it has to stand on its own — otherwise a logs error gets Postgres advice.
 */
const CLICKHOUSE_LOGS_DEBUG_HINT =
  'This query runs against the Supabase logs table on a ClickHouse-backed engine, not Postgres.'

/** The shared ask + error + dialect preamble behind both debug entry points. */
function buildDebugRequestText(errorMessage: string, source: SqlSnippetSource): string {
  const ask = `Help me to debug the attached sql snippet which gives the following error: \n\n${errorMessage}`
  return isLogsSource(source) ? `${ask}\n\n${CLICKHOUSE_LOGS_DEBUG_HINT}` : ask
}

/**
 * Builds the prompt text used to ask the assistant to debug a failing snippet, and
 * offered verbatim as the dropdown's copyable prompt.
 */
export function buildDebugPromptText(
  sql: string,
  errorMessage: string,
  source: SqlSnippetSource
): string {
  const fence = sqlSourceToFenceLanguage(source)
  return `${buildDebugRequestText(errorMessage, source)}\n\nSQL Query:\n\`\`\`${fence}\n${sql}\n\`\`\``
}

// Accepts either brand: the debug flow only reads the SQL as text (it's stripped
// and interpolated into a prompt), so a logs-branded fragment is fine here.
type DebugSnippet =
  | { snippet: { content?: { unchecked_sql?: UntrustedSqlFragment | UntrustedLogSqlFragment } } }
  | undefined
type DebugResult = { error?: { message?: string } } | undefined

/**
 * Extracts the SQL (disclaimer stripped) and error message used to debug a
 * failing snippet, shared by `buildDebugPrompt` and `onDebug`. Falls back to
 * an empty query / `'Unknown error'` rather than throwing when the snippet or
 * its last result aren't available yet.
 */
export function extractDebugContext(
  snippet: DebugSnippet,
  result: DebugResult
): { sql: string; errorMessage: string } {
  const sql = (snippet?.snippet.content?.unchecked_sql ?? '')
    .replace(sqlAiDisclaimerComment, '')
    .trim()
  const errorMessage = result?.error?.message ?? 'Unknown error'
  return { sql, errorMessage }
}

/**
 * Builds the `aiSnap.newChat(...)` payload for the debug-this-snippet flow.
 */
export function buildDebugChatArgs(
  snippet: DebugSnippet,
  result: DebugResult,
  source: SqlSnippetSource
): {
  name: string
  sqlSnippets: Array<{ label: string; content: string; source: SqlSnippetSource }>
  initialInput: string
} {
  const { sql, errorMessage } = extractDebugContext(snippet, result)
  return {
    name: 'Debug SQL snippet',
    sqlSnippets: [{ label: 'Current Query', content: sql, source }],
    initialInput: buildDebugRequestText(errorMessage, source),
  }
}

/** What `drainDiffRequest` should do with a pending diff request, given the editor's current value. */
export type DiffRequestPlan =
  | { kind: 'replace'; text: string }
  | { kind: 'diff'; diff: ContentDiff; diffType: DiffType }

/**
 * Decides how to apply a pending diff request to the editor: if the editor is
 * empty, just copy the request's SQL straight in; otherwise open a diff
 * between what's there and the requested SQL. Pure decision only — the
 * effect (`drainDiffRequest`) is left to actually touch the editor/diff state.
 */
export function planDiffRequestApplication({
  existingValue,
  request,
}: {
  existingValue: string
  request: { diffType: DiffType; sql: string }
}): DiffRequestPlan {
  if (existingValue.length === 0) {
    return { kind: 'replace', text: request.sql }
  }
  return {
    kind: 'diff',
    diff: { original: existingValue, modified: request.sql },
    diffType: request.diffType,
  }
}

/** What the window keydown handler should do for a key event, given the diff/prompt state. */
export type DiffKeyAction =
  | { type: 'accept' }
  | { type: 'escape'; shouldDiscard: boolean }
  | { type: 'none' }

/**
 * Decides how the SQL editor's window-level keydown handler should react:
 * accept an open diff on Cmd/Ctrl+Enter, or discard-and-dismiss on Escape.
 * No-ops when neither a diff nor the AI prompt is open, or for any other key.
 */
export function resolveDiffKeyAction(
  e: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'>,
  {
    isDiffOpen,
    isPromptOpen,
    os,
  }: { isDiffOpen: boolean; isPromptOpen: boolean; os: 'macos' | 'windows' | undefined }
): DiffKeyAction {
  if (!isDiffOpen && !isPromptOpen) return { type: 'none' }

  switch (e.key) {
    case 'Enter':
      if ((os === 'macos' ? e.metaKey : e.ctrlKey) && isDiffOpen) return { type: 'accept' }
      return { type: 'none' }
    case 'Escape':
      return { type: 'escape', shouldDiscard: isDiffOpen }
    default:
      return { type: 'none' }
  }
}
