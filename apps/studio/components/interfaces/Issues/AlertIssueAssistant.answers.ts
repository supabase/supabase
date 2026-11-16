import { ident } from '@supabase/pg-meta'

import type {
  AssistantContext,
  AssistantRow,
  AssistantStepResult,
  LogEventSummary,
} from './AlertIssueAssistant.utils'
import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'

/**
 * Scripted answers for the simulated Supabase Assistant, keyed by alert rule. Each template
 * interpolates the real results of the run's tool calls.
 */

type AnswerInput = {
  issue: AlertIssue
  rows: AssistantRow[]
  logs: LogEventSummary | null
  relation: string
}

const text = (value: unknown) => (value === undefined || value === null ? '' : String(value))
const sqlBlock = (sql: string) => `\`\`\`sql\n${sql}\n\`\`\``
const nextSteps = (...items: string[]) =>
  `**Next steps**\n${items.map((item) => `- ${item}`).join('\n')}`
const paragraphs = (...parts: (string | false | undefined)[]) =>
  parts.filter((part): part is string => !!part).join('\n\n')

const AUTH_CALL = /(?<!select )\bauth\.(uid|jwt|role)\(\)/gi
const wrapAuthCalls = (expression: string) =>
  expression.replace(AUTH_CALL, (_call, fn: string) => `( select auth.${fn}() )`)

const firstValue = (rows: AssistantRow[], column: string) =>
  rows.find((row) => row[column] !== undefined && row[column] !== null)?.[column]

const rlsDisabled = ({ rows, relation }: AnswerInput) => {
  const exposed = firstValue(rows, 'exposed_rows')
  return paragraphs(
    exposed !== undefined
      ? `**${text(exposed)} rows** in \`${relation}\` can be read and changed by anyone with your anon key.`
      : `Anyone with your anon key can read and change \`${relation}\`.`,
    'The table is in a schema exposed through the Data API, but row level security is off, so no policy filters the rows. Enabling RLS denies all API access to the table until you add policies, so add the ones your app needs in the same migration:',
    sqlBlock(
      `alter table ${relation} enable row level security;\n\ncreate policy "Owners can read their rows"\non ${relation} for select\nto authenticated\nusing ( (select auth.uid()) = user_id ); -- use your ownership column`
    ),
    nextSteps(
      'Ask me to draft insert, update and delete policies.',
      'Check which client queries read this table before you enable RLS.'
    )
  )
}

const policiesNotEnforced = ({ rows, relation }: AnswerInput) => {
  const names = rows.map((row) => `"${text(row.policyname)}"`).filter((name) => name !== '""')
  return paragraphs(
    names.length > 0
      ? `\`${relation}\` has ${names.length === 1 ? 'a policy' : `${names.length} policies`} that Postgres isn't enforcing: ${names.join(', ')}.`
      : `\`${relation}\` has policies that Postgres isn't enforcing.`,
    'Policies only apply once row level security is enabled on the table. Until then every row is visible through the Data API, whatever the policies say.',
    sqlBlock(`alter table ${relation} enable row level security;`),
    nextSteps(
      'Make sure the policies cover every operation your app uses: with RLS on, an operation without a matching policy is denied.'
    )
  )
}

const securityDefinerView = ({ rows, relation }: AnswerInput) => {
  const definition = text(firstValue(rows, 'definition')).trim()
  return paragraphs(
    `\`${relation}\` runs with the privileges of its owner, so it bypasses the row level security of the tables it reads. Anyone who can select from the view sees every row.`,
    definition && `It's defined as:\n\n${sqlBlock(definition)}`,
    'Make the view check permissions as the querying user (Postgres 15 and later):',
    sqlBlock(`alter view ${relation} set (security_invoker = on);`),
    nextSteps(
      `If the anon role doesn't need the view, also run \`revoke select on ${relation} from anon;\`.`
    )
  )
}

const mutableSearchPath = ({ rows, relation }: AnswerInput) => {
  const isDefiner = ['true', 't'].includes(text(firstValue(rows, 'security_definer')))
  return paragraphs(
    `\`${relation}()\` doesn't pin its \`search_path\`.${isDefiner ? " It's `SECURITY DEFINER`, so it runs as its owner, which makes this more serious." : ''} A role that can create objects in a schema earlier on the search path could make the function resolve names to its own tables or functions.`,
    sqlBlock(`alter function ${relation}() set search_path = '';`),
    'Then schema-qualify every object the function uses, for example `public.profiles`. Add the argument types to the `alter function` if it takes any.',
    nextSteps('Ask me to list the other functions in this project without a fixed `search_path`.')
  )
}

const authInitPlan = ({ rows, relation }: AnswerInput) => {
  const policies = rows.filter((row) => /auth\.(uid|jwt|role)\(\)/i.test(text(row.qual)))
  const fixes = policies.map(
    (row) =>
      `alter policy ${ident(text(row.policyname))} on ${relation} using (${wrapAuthCalls(text(row.qual))});`
  )
  return paragraphs(
    policies.length > 0
      ? `${policies.map((row) => `"${text(row.policyname)}"`).join(', ')} on \`${relation}\` calls \`auth.uid()\` once for every row it checks.`
      : `A policy on \`${relation}\` calls an \`auth\` function once for every row it checks.`,
    'Wrapping the call in a subquery lets Postgres evaluate it once per statement instead, which matters on large scans:',
    fixes.length > 0 && sqlBlock(fixes.join('\n')),
    nextSteps(
      'Run `explain analyze` on a slow query against this table before and after the change.'
    )
  )
}

const multiplePermissive = ({ rows, relation }: AnswerInput) => {
  const policies = rows.filter((row) => text(row.policyname) !== '')
  const combined = policies.map((row) => `(${wrapAuthCalls(text(row.qual))})`).join(' or ')
  const command = text(firstValue(policies, 'cmd')).toLowerCase() || 'select'
  return paragraphs(
    `Postgres runs every permissive policy for a role and action and ORs the results, so ${policies.length} ${command.toUpperCase()} policies run for every row of \`${relation}\`: ${policies.map((row) => `"${text(row.policyname)}"`).join(', ')}.`,
    'Combine them into one policy:',
    sqlBlock(
      [
        ...policies.map((row) => `drop policy ${ident(text(row.policyname))} on ${relation};`),
        `\ncreate policy "Combined ${command} policy" on ${relation}\nfor ${command} to authenticated\nusing (${combined});`,
      ].join('\n')
    ),
    nextSteps('Keep the policy names descriptive: they show up in errors and in the advisors.')
  )
}

const unindexedForeignKey = ({ rows, relation, issue }: AnswerInput) => {
  const definition = text(firstValue(rows, 'definition'))
  const columns =
    /FOREIGN KEY \(([^)]+)\)/i
      .exec(definition)?.[1]
      .split(',')
      .map((column) => column.trim()) ?? []
  const table = text(issue.identifiers.table)
  const liveRows = firstValue(rows, 'n_live_tup')
  const seqScans = firstValue(rows, 'seq_scan')
  return paragraphs(
    `\`${text(firstValue(rows, 'conname')) || 'A foreign key'}\` on \`${relation}\` has no covering index. Joins on it, and deletes or updates on the table it references, have to scan the whole table${liveRows !== undefined ? `, which has ${text(liveRows)} rows` : ''}${seqScans !== undefined ? ` and has been scanned sequentially ${text(seqScans)} times` : ''}.`,
    columns.length > 0 &&
      sqlBlock(
        `create index concurrently ${ident(`${table}_${columns.join('_')}_idx`)} on ${relation} (${columns.join(', ')});`
      ),
    "`concurrently` avoids blocking writes while the index builds, but it can't run inside a transaction.",
    nextSteps('Ask me which other foreign keys in this project are missing an index.')
  )
}

const leakedPasswords = () =>
  paragraphs(
    "Supabase Auth isn't checking new passwords against the HaveIBeenPwned database, so users can sign up with passwords that are already in public breaches.",
    'Turn on **Prevent use of leaked passwords** in Authentication → Attack Protection. On a self-hosted project, set `GOTRUE_PASSWORD_HIBP_ENABLED=true` on the Auth service and restart it.',
    nextSteps('Pair it with a minimum password length and required character types.')
  )

const groupsLine = (logs: LogEventSummary) =>
  logs.groups.map((group) => `${group.label} (${group.count})`).join(', ')

const edgeErrors = ({ logs, issue }: AnswerInput) => {
  const fn = text(issue.identifiers.function_id) || 'This function'
  if (!logs || logs.total === 0) {
    return paragraphs(
      `I couldn't find recent failed requests for \`${fn}\`; the errors may have stopped.`
    )
  }
  const has504 = logs.groups.some((group) => group.label.includes('504'))
  return paragraphs(
    `\`${fn}\` had **${logs.total} failed requests** in the last 24 hours: ${groupsLine(logs)}.`,
    '500s mean the function threw or returned a server error.' +
      (has504
        ? " 504s mean it didn't respond before the request timed out, usually because it was waiting on an upstream call."
        : ''),
    nextSteps(
      `Filter \`function_logs\` to \`${fn}\` around these times to find the stack traces.`,
      'Add a timeout and retries with backoff to the upstream calls.'
    )
  )
}

const edgeLatency = ({ logs, issue }: AnswerInput) => {
  const fn = text(issue.identifiers.function_id) || 'This function'
  return paragraphs(
    logs && logs.total > 0
      ? `\`${fn}\` had **${logs.total} requests slower than 5 seconds** in the last 24 hours${logs.medianMs !== undefined ? `; the median was ${logs.medianMs} ms and the slowest ${logs.slowestMs} ms` : ''}.`
      : `\`${fn}\` has been responding slowly.`,
    "Respond as soon as you have what the caller needs, and move the rest after the response with `EdgeRuntime.waitUntil()`. Put timeouts on upstream `fetch` calls so one slow dependency can't hold the request open.",
    nextSteps('Ask me to compare these requests with the error log for the same function.')
  )
}

const fallback = ({ issue, rows, logs }: AnswerInput) =>
  paragraphs(
    `Here's what I found for **${issue.title}**.`,
    logs &&
      (logs.total > 0
        ? `There are ${logs.total} matching log events in the last 24 hours. The most frequent: ${groupsLine(logs)}.`
        : 'There are no matching log events in the last 24 hours.'),
    rows.length > 0 &&
      `The queries returned ${rows.length === 1 ? '1 row' : `${rows.length} rows`}.`,
    nextSteps(
      'Ask me a specific question about these events, or open the log events above to inspect them.'
    )
  )

const TEMPLATES: Record<string, (input: AnswerInput) => string> = {
  'supabase.advisor.rls_disabled_in_public': rlsDisabled,
  'supabase.advisor.policy_exists_rls_disabled': policiesNotEnforced,
  'supabase.advisor.security_definer_view': securityDefinerView,
  'supabase.advisor.function_search_path_mutable': mutableSearchPath,
  'supabase.advisor.auth_rls_initplan': authInitPlan,
  'supabase.advisor.multiple_permissive_policies': multiplePermissive,
  'supabase.advisor.unindexed_foreign_keys': unindexedForeignKey,
  'supabase.advisor.auth_leaked_password_protection': leakedPasswords,
  'supabase.edge-function-5xx': edgeErrors,
  'supabase.edge-function-latency': edgeLatency,
}

const relationOf = (issue: AlertIssue) => {
  const { schema, table } = issue.identifiers
  if (typeof table !== 'string' || table === '') return ''
  return typeof schema === 'string' && schema !== ''
    ? `${ident(schema)}.${ident(table)}`
    : ident(table)
}

const describeRows = (rows: AssistantRow[]) => {
  const columns = Object.keys(rows[0])
  if (rows.length === 1 && columns.length === 1)
    return `\`${columns[0]} = ${text(rows[0][columns[0]])}\``
  return rows.length === 1 ? '1 row' : `${rows.length} rows`
}

const cellIntro = (context: AssistantContext, rows: AssistantRow[]) => {
  if (context.kind !== 'sql_cell' || rows.length === 0) return undefined
  return `"${context.label}" returned ${describeRows(rows)}.`
}

export function buildAssistantAnswer(
  issue: AlertIssue,
  context: AssistantContext,
  results: AssistantStepResult[]
): string {
  const rows = results.flatMap((result) =>
    result.kind === 'run_sql' && 'rows' in result ? [...result.rows] : []
  )
  const logs = results.find((result) => result.kind === 'read_logs')
  const input: AnswerInput = {
    issue,
    rows,
    logs: logs?.kind === 'read_logs' ? logs.summary : null,
    relation: relationOf(issue),
  }
  const template = (issue.rule_key && TEMPLATES[issue.rule_key]) || fallback
  return paragraphs(cellIntro(context, rows), template(input))
}
