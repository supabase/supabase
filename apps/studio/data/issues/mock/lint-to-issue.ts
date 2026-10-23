import type {
  IssueCategory,
  IssueCell,
  IssueDocument,
  IssueOrigin,
  IssueResource,
  IssueSeverity,
} from '../issue-schema'
import { lintInfoMap } from '@/components/interfaces/Linter/Linter.utils'
import type { Lint } from '@/data/lint/lint-query'
import { DOCS_URL } from '@/lib/constants'

// How every built-in advisor check becomes an issue check. The backend will own this
// mapping once Issues persist server-side; it lives here so the mock produces the same
// shapes the real ingestion will.
//
// A check is one issue. Each lint row it returns (one per table, function, …) is an
// affected resource of that issue, keyed by the lint's cache key.

export type IssueDraft = {
  title: string
  body: IssueDocument
  severity: IssueSeverity
  category: IssueCategory
  origin: IssueOrigin
  fingerprint: string
}

export type IssueAffectedResourceDraft = {
  key: string
  resource: IssueResource | null
  detail: string | null
  // Defaults to the issue's severity
  severity?: IssueSeverity
  // Threshold checks report what they measured and the limit it crossed
  value?: number | null
  threshold?: number | null
  unit?: string | null
}

const LEVEL_TO_SEVERITY: Record<Lint['level'], IssueSeverity> = {
  ERROR: 'critical',
  WARN: 'warning',
  INFO: 'info',
}

const CATEGORY_BY_LINT_CATEGORY: Record<Lint['categories'][number], IssueCategory> = {
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  HEALTH: 'health',
}

type LintEntityType = NonNullable<NonNullable<Lint['metadata']>['type']>

const RESOURCE_TYPE_BY_ENTITY: Record<LintEntityType, IssueResource['type']> = {
  table: 'table',
  view: 'view',
  'materialized view': 'materialized_view',
  'foreign table': 'foreign_table',
  auth: 'auth',
  function: 'function',
  extension: 'extension',
  compliance: 'project',
  health: 'project',
}

const unescape = (text: string) => text.replace(/\\`/g, '`')

export function getLintResource(lint: Lint): IssueResource | null {
  const { metadata } = lint
  if (!metadata?.type) return null

  const name = metadata.name ?? metadata.entity
  if (!name) return null

  return {
    type: RESOURCE_TYPE_BY_ENTITY[metadata.type],
    name,
    schema: metadata.schema ?? null,
  }
}

const markdown = (text: string): IssueCell => ({ _tag: 'markdown_cell', text })

const databaseQuery = (title: string, sql: string): IssueCell => ({
  _tag: 'database_cell',
  title,
  sql,
  row_limit: 100,
})

/**
 * The check's explanation and fix, plus the query that finds what it flags so anyone
 * reading the issue can rerun it. Checks without a template fall back to the lint's
 * own description.
 */
function buildCheckBody({
  lint,
  docsUrl,
  action,
}: {
  lint: Lint
  docsUrl: string
  action?: { label: string; href: string }
}): IssueDocument {
  const links = [action && `[${action.label}](${action.href})`, `[Learn more](${docsUrl})`]
    .filter(Boolean)
    .join(' · ')

  switch (lint.name) {
    case 'rls_disabled_in_public':
      return {
        schema_version: 1,
        cells: [
          markdown(
            `Tables in the \`public\` schema are reachable through the Data API. Without Row Level Security, anyone with the project's anon key can read and change every row in them.\n\n### How to fix\n\nEnable RLS on each table, then add policies for the roles that need access. Until a table has policies, the Data API returns no rows from it.\n\n\`\`\`sql\nalter table public.<table> enable row level security;\n\`\`\`\n\n${links}`
          ),
          databaseQuery(
            'Tables in public without RLS',
            "select schemaname as schema, tablename as table\nfrom pg_tables\nwhere schemaname = 'public'\n  and not rowsecurity\norder by tablename;"
          ),
        ],
      }
    case 'function_search_path_mutable':
      return {
        schema_version: 1,
        cells: [
          markdown(
            `These functions don't set \`search_path\`, so they resolve names using the caller's search path. A role that can create objects in another schema could get them to run its own code.\n\n### How to fix\n\nPin the search path on each function:\n\n\`\`\`sql\nalter function public.<function> set search_path = '';\n\`\`\`\n\n${links}`
          ),
          databaseQuery(
            'Functions without a fixed search_path',
            "select n.nspname as schema, p.proname as function\nfrom pg_proc p\njoin pg_namespace n on n.oid = p.pronamespace\nwhere n.nspname = 'public'\n  and not exists (\n    select 1 from unnest(coalesce(p.proconfig, '{}')) as c\n    where c like 'search_path=%'\n  )\norder by p.proname;"
          ),
        ],
      }
    case 'unindexed_foreign_keys':
      return {
        schema_version: 1,
        cells: [
          markdown(
            `These foreign keys have no index covering their columns, so joins and cascading deletes on them scan the whole table.\n\n### How to fix\n\nAdd an index on the foreign key columns. Build it concurrently so writes aren't blocked:\n\n\`\`\`sql\ncreate index concurrently on public.<table> (<column>);\n\`\`\`\n\n${links}`
          ),
          databaseQuery(
            'Foreign keys without a covering index',
            "select conrelid::regclass as table, conname as foreign_key\nfrom pg_constraint c\nwhere contype = 'f'\n  and not exists (\n    select 1 from pg_index i\n    where i.indrelid = c.conrelid\n      and (i.indkey::int2[])[0:cardinality(c.conkey) - 1] = c.conkey\n  )\norder by 1;"
          ),
        ],
      }
    default:
      return {
        schema_version: 1,
        cells: [markdown(`${unescape(lint.description)}\n\n${links}`)],
      }
  }
}

export function lintToIssueFinding({ lint, projectRef }: { lint: Lint; projectRef: string }): {
  issue: IssueDraft
  affected: IssueAffectedResourceDraft
} {
  const info = lintInfoMap.find((item) => item.name === lint.name)
  const checkName = info?.title ?? lint.title
  const docsUrl = info?.docsLink ?? lint.remediation ?? `${DOCS_URL}/guides/observability/advisors`
  const action = info
    ? { label: info.linkText, href: info.link({ projectRef, metadata: lint.metadata }) }
    : undefined

  return {
    issue: {
      title: checkName,
      body: buildCheckBody({ lint, docsUrl, action }),
      severity: LEVEL_TO_SEVERITY[lint.level],
      category: CATEGORY_BY_LINT_CATEGORY[lint.categories[0] ?? 'SECURITY'],
      origin: { type: 'check', check_id: lint.name, check_name: checkName },
      fingerprint: `check:${lint.name}`,
    },
    affected: {
      key: lint.cache_key,
      resource: getLintResource(lint),
      detail: unescape(lint.detail),
      severity: LEVEL_TO_SEVERITY[lint.level],
    },
  }
}
