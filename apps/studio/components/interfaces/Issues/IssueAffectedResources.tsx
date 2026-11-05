import { useParams } from 'common'
import Link from 'next/link'
import { useState } from 'react'
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

import { LintCTA } from '../Linter/Linter.utils'
import { Markdown } from '../Markdown'
import { formatIssueResource, sortAffected } from './Issues.utils'
import type { Issue, IssueAffectedResource } from '@/data/issues/issue.types'

// Enough to see the shape of a long list without pushing everything else off the page
const COLLAPSED_ROW_COUNT = 5

const AffectedResourceFix = ({ affected }: { affected: IssueAffectedResource }) => {
  const { ref } = useParams()

  if (ref && affected.lint) {
    return <LintCTA title={affected.lint.name} projectRef={ref} metadata={affected.lint.metadata} />
  }
  if (affected.action) {
    return (
      <Button asChild variant="default">
        <Link href={affected.action.href}>{affected.action.label}</Link>
      </Button>
    )
  }
  return null
}

const AffectedResourceRow = ({ affected }: { affected: IssueAffectedResource }) => (
  <TableRow>
    {/* Names stay on one line; a narrow screen scrolls the table instead */}
    <TableCell className="whitespace-nowrap align-top text-foreground">
      {formatIssueResource(affected.resource)}
    </TableCell>
    <TableCell className="min-w-64 align-top">
      {affected.detail && <Markdown className="text-foreground-light">{affected.detail}</Markdown>}
    </TableCell>
    <TableCell className="text-right align-top">
      <AffectedResourceFix affected={affected} />
    </TableCell>
  </TableRow>
)

const AffectedResourceTable = ({ issue }: { issue: Issue }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const affected = sortAffected(issue.affected)

  const visible = isExpanded ? affected : affected.slice(0, COLLAPSED_ROW_COUNT)
  const hiddenCount = affected.length - visible.length

  return (
    <section aria-labelledby="issue-affected-heading" className="flex flex-col gap-3">
      <h2 id="issue-affected-heading" className="text-sm text-foreground">
        Affected resources
      </h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Fix</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((item) => (
              <AffectedResourceRow key={item.id} affected={item} />
            ))}
          </TableBody>
        </Table>
      </Card>
      {hiddenCount > 0 && (
        <div>
          <Button variant="default" size="tiny" onClick={() => setIsExpanded(true)}>
            Show {hiddenCount.toLocaleString()} more
          </Button>
        </div>
      )}
    </section>
  )
}

/** Every resource the issue is failing on, each with what's wrong and how to fix it. */
export const IssueAffectedResources = ({ issue }: { issue: Issue }) => {
  if (issue.affected.length === 0) return null
  return <AffectedResourceTable issue={issue} />
}
