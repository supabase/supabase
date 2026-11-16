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

function formatLabelList(labels: string[]) {
  if (labels.length <= 1) return labels[0] ?? ''
  return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
}

export function summarizeAffected(affected: Pick<IssueAffectedResource, 'resource'>[]) {
  const resources = getUniqueIssueResources(affected)
  if (resources.length === 0) return null
  if (resources.length === 1) return formatIssueResource(resources[0])

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

export function getIssueTelemetryProperties(issue: Issue) {
  return {
    advisorCategory: TELEMETRY_CATEGORY[issue.category],
    advisorType: issue.id,
    advisorLevel: LEVEL_BY_SEVERITY[issue.severity],
  }
}
