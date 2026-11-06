import type {
  Issue,
  IssueAffectedResource,
  IssueCategory,
  IssueResource,
  IssueSeverity,
} from './issue.types'
import { lintInfoMap } from '@/components/interfaces/Linter/Linter.utils'
import type { AdvisorSignalItem } from '@/components/ui/AdvisorPanel/AdvisorPanel.types'
import type { Lint } from '@/data/lint/lint-query'
import { DOCS_URL } from '@/lib/constants'

const SEVERITY_ORDER: IssueSeverity[] = ['critical', 'warning', 'info']

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

// Lint text escapes backticks for the JSON it travels in
const unescapeBackticks = (text: string) => text.replace(/\\`/g, '`')

function getLintResource({ metadata }: Lint): IssueResource {
  const name = metadata?.name ?? metadata?.entity
  if (!metadata?.type || !name) return { type: 'project', name: 'Project', schema: null }
  return {
    type: RESOURCE_TYPE_BY_ENTITY[metadata.type],
    name,
    schema: metadata.schema ?? null,
  }
}

function lintToAffected(lint: Lint): IssueAffectedResource {
  return {
    id: lint.cache_key,
    resource: getLintResource(lint),
    detail: unescapeBackticks(lint.detail),
    severity: LEVEL_TO_SEVERITY[lint.level],
    lint,
    action: null,
  }
}

const highestSeverity = (affected: IssueAffectedResource[]) =>
  SEVERITY_ORDER.find((severity) => affected.some((item) => item.severity === severity)) ?? 'info'

/** A check is one issue. Each lint it returns is an affected resource of that issue. */
export function lintsToIssues(lints: Lint[]): Issue[] {
  const lintsByCheck = new Map<string, Lint[]>()
  for (const lint of lints) {
    lintsByCheck.set(lint.name, [...(lintsByCheck.get(lint.name) ?? []), lint])
  }

  return Array.from(lintsByCheck, ([name, checkLints]) => {
    const [lint] = checkLints
    const info = lintInfoMap.find((item) => item.name === name)
    const affected = checkLints.map(lintToAffected)

    return {
      id: name,
      title: info?.title ?? lint.title,
      description: unescapeBackticks(lint.description),
      severity: highestSeverity(affected),
      category: info?.category ?? CATEGORY_BY_LINT_CATEGORY[lint.categories[0] ?? 'SECURITY'],
      source: 'lint',
      docsUrl: info?.docsLink ?? lint.remediation ?? `${DOCS_URL}/guides/observability/advisors`,
      affected,
    }
  })
}

/** Every banned IP is one affected resource of a single issue, like a lint on many tables. */
export function signalsToIssues(signals: AdvisorSignalItem[]): Issue[] {
  const [signal] = signals
  if (!signal) return []

  return [
    {
      id: 'banned_ip_address',
      title: signal.title,
      description: signal.description ?? signal.summary,
      severity: signal.severity,
      category: 'security',
      source: 'signal',
      docsUrl: signal.docsUrl ?? `${DOCS_URL}/guides/observability/advisors`,
      affected: signals.map((item) => ({
        id: item.id,
        resource: { type: 'ip_address', name: item.sourceData.ip, schema: null },
        detail: item.summary,
        severity: item.severity,
        lint: null,
        action: item.actions[0] ?? null,
      })),
    },
  ]
}

/** Most severe first, then whatever affects the most, so what needs fixing most leads. */
export function sortIssues(issues: Issue[]) {
  return [...issues].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
      b.affected.length - a.affected.length ||
      a.title.localeCompare(b.title)
  )
}
