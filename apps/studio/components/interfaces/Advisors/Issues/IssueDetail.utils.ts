import type { LintInfo } from '@/components/interfaces/Linter/Linter.constants'
import { lintInfoMap } from '@/components/interfaces/Linter/Linter.utils'
import type { AdvisorIssue, AdvisorRule } from 'data/advisors/types'

export function createIssueSummaryPrompt(issue: AdvisorIssue, rule?: AdvisorRule | null): string {
  const entity =
    issue.metadata?.schema && issue.metadata?.name
      ? `${issue.metadata.schema}.${issue.metadata.name}`
      : (issue.metadata?.entity as string) ?? 'N/A'

  const schema = (issue.metadata?.schema as string) ?? 'N/A'

  const suggestedActionsSummary =
    issue.suggested_actions.length > 0
      ? issue.suggested_actions.map((a) => `- [${a.type}] ${a.label}`).join('\n')
      : 'None'

  const parts = [
    `Analyze this database issue and suggest specific fixes:`,
    `Title: ${issue.title}`,
    `Severity: ${issue.severity}`,
    `Category: ${issue.category}`,
    `Entity: ${entity}`,
    `Schema: ${schema}`,
  ]

  if (issue.description) {
    parts.push(`Description: ${issue.description}`)
  }

  if (rule) {
    parts.push(`Rule: ${rule.name}`)
    if (rule.remediation) {
      parts.push(`Documentation: ${rule.remediation}`)
    }
  }

  parts.push(`Suggested Actions:\n${suggestedActionsSummary}`)

  if (issue.metadata && Object.keys(issue.metadata).length > 0) {
    parts.push(`Metadata: ${JSON.stringify(issue.metadata)}`)
  }

  return parts.join('\n')
}

export interface KnownIssueInfo {
  lintInfo: LintInfo
  docsLink: string
  navLink: string
  navLinkText: string
}

export function getKnownIssueInfo(
  ruleName: string,
  projectRef: string,
  metadata: Record<string, unknown>
): KnownIssueInfo | null {
  const lintInfo = lintInfoMap.find((item) => item.name === ruleName)
  if (!lintInfo) return null

  return {
    lintInfo,
    docsLink: lintInfo.docsLink,
    navLink: lintInfo.link({ projectRef, metadata }),
    navLinkText: lintInfo.linkText,
  }
}
