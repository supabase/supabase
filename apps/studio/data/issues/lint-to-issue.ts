import { getUniqueIssueResources } from './issue-resource'
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

const RESOURCE_TYPE_BY_ENTITY = new Map<string, IssueResource['type']>(
  Object.entries({
    table: 'table',
    view: 'view',
    'materialized view': 'materialized_view',
    'foreign table': 'foreign_table',
    auth: 'auth',
    function: 'function',
    extension: 'extension',
    compliance: 'project',
    health: 'project',
    bucket: 'bucket',
  } satisfies Record<LintEntityType | 'bucket', IssueResource['type']>)
)

const unescapeBackticks = (text: string) => text.replace(/\\`/g, '`')

function getLintResource({ metadata }: Lint): IssueResource {
  const name = metadata?.entity ?? metadata?.name
  if (!name) return { type: 'project', name: 'Project', schema: null }
  const args =
    metadata && 'arguments' in metadata && typeof metadata.arguments === 'string'
      ? metadata.arguments
      : undefined
  return {
    type:
      RESOURCE_TYPE_BY_ENTITY.get(metadata?.type ?? '') ??
      (args !== undefined ? 'function' : 'project'),
    name: !metadata?.entity && args !== undefined ? `${name}(${args})` : name,
    schema: metadata?.entity ? null : (metadata?.schema ?? null),
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

export function sortIssues(issues: Issue[]) {
  return issues
    .map((issue) => ({ issue, resourceCount: getUniqueIssueResources(issue.affected).length }))
    .sort(
      (a, b) =>
        SEVERITY_ORDER.indexOf(a.issue.severity) - SEVERITY_ORDER.indexOf(b.issue.severity) ||
        b.resourceCount - a.resourceCount ||
        a.issue.title.localeCompare(b.issue.title)
    )
    .map(({ issue }) => issue)
}
