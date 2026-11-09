import { ISSUE_SEVERITIES, RESOURCE_TYPE_NOUNS } from './Issues.constants'
import { getUniqueIssueResources } from '@/data/issues/issue-resource'
import type {
  Issue,
  IssueAffectedResource,
  IssueCategory,
  IssueResource,
  IssueSeverity,
} from '@/data/issues/issue.types'

export function formatIssueResource(resource: IssueResource) {
  return resource.schema ? `${resource.schema}.${resource.name}` : resource.name
}

/** `a`, `a and b`, `a, b and c`. */
function formatLabelList(labels: string[]) {
  if (labels.length <= 1) return labels[0] ?? ''
  return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
}

/**
 * What an issue affects, in a few words: the resource itself when there's one, otherwise a
 * count by type, e.g. `3 tables` or `2 tables and 1 view`. Null when there's nothing.
 */
export function summarizeAffected(affected: Pick<IssueAffectedResource, 'resource'>[]) {
  const resources = getUniqueIssueResources(affected)
  if (resources.length === 0) return null
  if (resources.length === 1) return formatIssueResource(resources[0])

  // Keyed by the plural so types that share a noun count together
  const counts = new Map<string, { noun: { one: string; other: string }; count: number }>()
  for (const resource of resources) {
    const noun = RESOURCE_TYPE_NOUNS[resource.type]
    counts.set(noun.other, { noun, count: (counts.get(noun.other)?.count ?? 0) + 1 })
  }
  return formatLabelList(
    Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .map(({ noun, count }) => `${count} ${count === 1 ? noun.one : noun.other}`)
  )
}

/** By severity and then name, so what needs fixing most leads a long list. */
export function sortAffected(affected: IssueAffectedResource[]) {
  return [...affected].sort(
    (a, b) =>
      ISSUE_SEVERITIES.indexOf(a.severity) - ISSUE_SEVERITIES.indexOf(b.severity) ||
      formatIssueResource(a.resource).localeCompare(formatIssueResource(b.resource))
  )
}

export type IssueListFilters = {
  severity: IssueSeverity[]
  category: IssueCategory[]
  search: string
}

/** Matches what a person can see on a row: the title, the description and what's affected. */
export function filterIssues(issues: Issue[], { severity, category, search }: IssueListFilters) {
  const query = search.trim().toLowerCase()

  return issues.filter((issue) => {
    if (severity.length > 0 && !severity.includes(issue.severity)) return false
    if (category.length > 0 && !category.includes(issue.category)) return false
    if (!query) return true
    return [
      issue.title,
      issue.description,
      ...issue.affected.map((item) => formatIssueResource(item.resource)),
    ].some((text) => text.toLowerCase().includes(query))
  })
}

/** Context handed to the Assistant, or copied for another agent, about an issue. */
export function buildIssuePrompt(issue: Issue) {
  const affectedLines = issue.affected.map((item) => {
    const label = formatIssueResource(item.resource)
    return `- ${label}${item.detail ? `: ${item.detail}` : ''}`
  })

  return [
    'Look into this Supabase issue in my project and suggest a fix.',
    '',
    `Title: ${issue.title}`,
    `Severity: ${issue.severity}`,
    `Category: ${issue.category}`,
    ...(affectedLines.length > 0 ? ['', 'Where it shows up:', ...affectedLines] : []),
    '',
    issue.description,
  ].join('\n')
}

const LEVEL_BY_SEVERITY = { critical: 'ERROR', warning: 'WARN', info: 'INFO' } as const
const TELEMETRY_CATEGORY = {
  security: 'SECURITY',
  performance: 'PERFORMANCE',
  health: 'HEALTH',
} as const

/** The properties advisor events already report, so existing dashboards keep counting. */
export function getIssueTelemetryProperties(issue: Issue) {
  return {
    advisorCategory: TELEMETRY_CATEGORY[issue.category],
    advisorType: issue.id,
    advisorLevel: LEVEL_BY_SEVERITY[issue.severity],
  }
}
