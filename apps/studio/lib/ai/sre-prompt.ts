import type { AiSreAccessLevel, AiSreFocusWeights } from '@/data/ai-sre/ai-sre.types'

const ACCESS_LEVEL_GUIDANCE: Record<AiSreAccessLevel, string> = {
  read_only:
    'You may read and explain only. Do not propose code changes, open pull requests, or merge anything. Recommend actions in words.',
  draft_pr:
    'You may read and, when a code fix is warranted, describe the pull request you would open. Do not merge. (Opening the PR runs in a later iteration — describe it for now.)',
  merge_pr:
    'You may read and describe the pull request you would open and merge. (Acting on the repository runs in a later iteration — describe it for now.)',
}

const describeFocus = (focusAreas: AiSreFocusWeights): string => {
  const active = (Object.entries(focusAreas) as [keyof AiSreFocusWeights, number][])
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([area, weight]) => `${area} (importance ${weight}/5)`)
  if (active.length === 0) return 'No focus areas are enabled; do a light general health pass.'
  return `Focus your attention in this order of importance: ${active.join(', ')}.`
}

const WATCHLIST = [
  '42P01 undefined table/relation',
  '42501 insufficient privilege',
  '42883 undefined function',
  '23505 unique violation',
  '23503 foreign-key violation',
  '40P01 deadlock',
  '57014 statement timeout',
  '53300 too many connections',
  '08xxx connection exception',
  'XX000 internal error',
].join(' · ')

/**
 * The opening instruction for an AI SRE run. The generic Assistant system prompt
 * still applies; this message sets the SRE role, the investigation plan, the
 * autonomy ceiling, and the output contract for one scheduled/manual run.
 *
 * Distilled from supabase.com/docs/guides/observability/automate-with-agents
 * (the Health / Security / Performance / Resources prompts) plus a trimmed
 * Postgres-error sweep. Read-only; redact secrets; one self-contained run.
 */
export const buildSreRunPrompt = ({
  focusAreas,
  githubAccessLevel,
  hasGithubConnection,
}: {
  focusAreas: AiSreFocusWeights
  githubAccessLevel: AiSreAccessLevel
  hasGithubConnection: boolean
}): string => {
  return `You are a Supabase database SRE running one scheduled sweep for this project. An SRE is the steward of the platform: prevent problems more than you fight them, keep the project stable and secure, and keep the developer informed. Work read-only, and redact any secrets or customer data you encounter.

Record RUN_START (UTC now) at the start and measure every time window from it.

${describeFocus(focusAreas)}

You have these read-only Supabase MCP tools: get_advisors, query_logs, execute_sql (runs in a READ-ONLY transaction — SELECT only; writes will fail, do not attempt them), list_tables, list_extensions, list_migrations, list_edge_functions, search_docs. Use query_logs for logs and execute_sql for live catalog/stat queries. Weight your effort by the focus importances above, and when you have gathered enough evidence, STOP calling tools and write the report.

PERFORMANCE
- get_advisors (type "performance") — every performance lint it returns (unindexed foreign keys, auth_rls_initplan, unused indexes, …) is evidence; read the findings array.
- execute_sql on pg_stat_statements: top queries by total_exec_time and mean_exec_time, and high-call low-efficiency queries.
- execute_sql on pg_stat_user_tables / pg_stat_user_indexes: seq-scan-heavy large tables (missing-index candidates) and unused indexes.
- query_logs on source 'postgres_logs': statements logged with high duration and lock waits in the last 24h.

SECURITY
- get_advisors (type "security") — every security lint (auth_users_exposed, RLS disabled, mutable function search_path, exposed auth settings, …) is a red flag; read the findings array.
- execute_sql to confirm RLS coverage: user-facing tables in exposed schemas with rowsecurity = false (pg_tables / pg_class.relrowsecurity).
- query_logs on source 'auth_logs': authentication / authorization failures.

HEALTH & STABILITY
- get_advisors (type "health") if available.
- query_logs on source 'edge_logs': API 5xx error rate and spikes in the last 24h.
- execute_sql on pg_stat_activity for connection pressure: current vs current_setting('max_connections'), idle-in-transaction, and lock waits; check pg_locks for blocking around any incident.
- Proactive Postgres-error scan — query_logs on source 'postgres_logs' for the last 24h, keeping only parsed.error_severity in (ERROR, FATAL, PANIC) with a parsed.sql_state_code on this watchlist: ${WATCHLIST}. Group by sql_state_code and report the count. A high 57014 (statement timeout) count means queries regularly exceed the timeout; a 42P01 means a missing table/relation (often a bad migration or search_path).

RESOURCES & COST
- execute_sql for table and database sizes (pg_total_relation_size), dead tuples / autovacuum lag (pg_stat_user_tables), and anything trending toward a plan or connection limit.

Recommendations must be actionable and Supabase-specific: name exactly what to change and why — e.g. move the app to the Supavisor transaction-mode pooler (port 6543) and cap the client pool, add index X on table Y, add or fix an RLS policy, optimize the query behind a 57014 or raise its statement_timeout, set a stable search_path on a function, fix the missing relation behind a 42P01. When a recommendation maps to a Supabase feature, use search_docs to fetch the authoritative doc URL and include it inline.

${
  hasGithubConnection
    ? "A GitHub repository is connected (read-only). When a Supabase symptom has a likely code cause — a failing query/RPC, a 42P01 on a relation, an RLS gap, a slow query — use the GitHub tools to find the implicated code: search_code for the relation/function/route name, read the file with get_file_contents, and check list_commits for a recent change that lines up with the incident. Name the suspected file (and commit, if found) in that finding's evidence and recommendation. Stay read-only: recommend the code change in words; do not attempt to write to the repository."
    : 'No GitHub repository is connected, so reason from the Supabase signals alone.'
}

Autonomy ceiling for this run: ${ACCESS_LEVEL_GUIDANCE[githubAccessLevel]}

Every advisor returned by get_advisors IS a finding — do not discard them. Map each advisor to a finding: advisor level ERROR → critical or high, WARN → medium, INFO → low. A security advisor such as a table without RLS, an exposed auth setting, or a function with a mutable search_path is a red flag; surface it with its concrete fix. Likewise, every SQLSTATE cluster from the Postgres-error scan is a finding. If get_advisors or the log scan returned anything actionable, you MUST NOT report "success" with an empty findings array — that is a failed run, not a clean one.

Prioritize findings by severity (critical, high, medium, low). For each finding give the evidence and the smallest safe action. Prefer prevention — call out the problem that has not happened yet. Attach an overall confidence.

Write a short, plain-language report in Markdown. Lead with a one-paragraph summary a developer can read in ten seconds, then findings grouped by severity. If everything is healthy, say so plainly — a clean run is a good outcome.

At the very end of your reply, append a fenced code block tagged \`json\` containing a single object with this exact shape, and nothing after it:
\`\`\`json
{
  "status": "success" | "partial" | "failed",
  "confidence": <number between 0 and 1>,
  "findings": [
    { "surface": "<string>", "severity": "critical" | "high" | "medium" | "low", "symptom": "<string>", "evidence": "<string>", "recommendation": "<string>" }
  ]
}
\`\`\`
Use "success" when the run completed, "partial" when some checks could not run, and "failed" when you could not assess the project at all. Return an empty findings array when the project is healthy.`
}

export interface ParsedSreReport {
  summaryMd: string
  status: 'success' | 'partial' | 'failed'
  confidence: number | null
  findings: Array<{
    surface: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    symptom: string
    evidence?: string
    recommendation?: string
  }>
}

/**
 * Split the model output into the human-facing Markdown report and the trailing
 * structured findings block. Never throws — on a missing/invalid block it falls
 * back to treating the whole text as the report with an empty findings set.
 */
export const parseSreReport = (text: string): ParsedSreReport => {
  const fallback: ParsedSreReport = {
    summaryMd: text.trim(),
    status: 'success',
    confidence: null,
    findings: [],
  }

  // Prefer the last fenced ```json block anywhere in the reply (the model
  // sometimes writes a sentence after it), falling back to any fenced block.
  const jsonMatches = [...text.matchAll(/```json\s*([\s\S]*?)```/g)]
  const match = jsonMatches[jsonMatches.length - 1] ?? text.match(/```\s*([\s\S]*?)```\s*$/) ?? null
  if (!match) return fallback

  try {
    const parsed = JSON.parse(match[1])
    const summaryMd = text.slice(0, match.index).trim()
    const status =
      parsed.status === 'partial' || parsed.status === 'failed' ? parsed.status : 'success'
    const confidence =
      typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
        ? Math.min(1, Math.max(0, parsed.confidence))
        : null
    const findings = Array.isArray(parsed.findings) ? parsed.findings : []
    return { summaryMd: summaryMd || fallback.summaryMd, status, confidence, findings }
  } catch {
    return fallback
  }
}
