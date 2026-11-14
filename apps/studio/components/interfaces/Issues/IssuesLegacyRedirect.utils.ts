import type { Issue, IssueCategory, IssueSeverity } from '@/data/issues/issue.types'

const LEGACY_SEVERITIES = new Map<string, IssueSeverity>([
  ['ERROR', 'critical'],
  ['WARN', 'warning'],
  ['INFO', 'info'],
])

export function getIssuesCategoryDestination(url: URL, category: IssueCategory, pathname: string) {
  const destination = new URL(url)
  destination.pathname = pathname
  destination.searchParams.set('category', category)
  return `${destination.pathname}${destination.search}${destination.hash}`
}

export function getLegacyIssueDestination(
  url: URL,
  issues: Issue[],
  pathname: string
): string | null {
  const destination = new URL(url)
  const { searchParams } = destination
  if (!searchParams.has('id') && !searchParams.has('preset')) return null

  const findingId = searchParams.get('id')
  const issue = issues.find((candidate) =>
    candidate.affected.some((affected) => affected.lint !== null && affected.id === findingId)
  )
  const severity = LEGACY_SEVERITIES.get(searchParams.get('preset') ?? '')
  if (severity && !searchParams.has('severity')) searchParams.set('severity', severity)
  searchParams.delete('id')
  searchParams.delete('preset')
  destination.pathname = issue ? `${pathname}/${encodeURIComponent(issue.id)}` : pathname
  return `${destination.pathname}${destination.search}${destination.hash}`
}
