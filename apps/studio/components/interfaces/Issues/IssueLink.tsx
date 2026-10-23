import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useParams } from 'common'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { cn } from 'ui'

import { issueQueryOptions } from '@/data/issues/issue-query'
import type { Issue } from '@/data/issues/issue-schema'

// A check's refiled issues share a title, so a link names the other one by its dates
const getIssueLinkLabel = (issue: Issue | undefined) => {
  if (!issue) return 'View issue'
  if (issue.resolved_at) return `Resolved ${dayjs(issue.resolved_at).format('MMM D')}`
  return `Opened ${dayjs(issue.created_at).format('MMM D')}`
}

/** A link to another issue in this project, with its title on hover. */
export const IssueLink = ({
  id,
  className,
  children,
}: {
  id: string
  className?: string
  children?: ReactNode
}) => {
  const { ref } = useParams()
  const { data: issue } = useQuery(issueQueryOptions({ projectRef: ref, id }))

  return (
    <Link
      to="/project/$ref/issues/$id"
      params={{ ref: ref ?? '', id }}
      title={issue?.title}
      className={cn('truncate text-link', className)}
    >
      {children ?? getIssueLinkLabel(issue)}
    </Link>
  )
}
