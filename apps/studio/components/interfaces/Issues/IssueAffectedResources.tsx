import { useParams } from 'common'
import Link from 'next/link'
import { useState } from 'react'
import { Button, Popover, PopoverContent, PopoverTrigger } from 'ui'

import { LintCTA } from '../Linter/Linter.utils'
import { Markdown } from '../Markdown'
import { RESOURCE_TYPE_ICONS } from './Issues.constants'
import { formatIssueResource, sortAffected } from './Issues.utils'
import type { Issue, IssueAffectedResource } from '@/data/issues/issue.types'

// Enough to see the shape of a long list without stretching the properties column
const COLLAPSED_ROW_COUNT = 5

const AffectedResourceRow = ({ affected }: { affected: IssueAffectedResource }) => {
  const { ref } = useParams()
  const label = formatIssueResource(affected.resource)
  const Icon = RESOURCE_TYPE_ICONS[affected.resource.type]

  return (
    <li className="min-w-0">
      <Popover modal={false}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title={label}
            className="-mx-1 flex h-6 w-full min-w-0 items-center gap-2 rounded px-1 text-left hover:bg-surface-200"
          >
            <Icon size={14} aria-hidden className="shrink-0 text-foreground-lighter" />
            <span className="min-w-0 flex-1 truncate">{label}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="flex w-80 flex-col gap-3 p-3">
          <p className="break-words text-sm text-foreground">{label}</p>
          {affected.detail && (
            <Markdown className="text-sm text-foreground-light">{affected.detail}</Markdown>
          )}
          {ref && affected.lint && (
            <div>
              <LintCTA
                title={affected.lint.name}
                projectRef={ref}
                metadata={affected.lint.metadata}
              />
            </div>
          )}
          {affected.action && (
            <div>
              <Button asChild variant="default">
                <Link href={affected.action.href}>{affected.action.label}</Link>
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </li>
  )
}

/**
 * Every resource the issue is failing on right now, e.g. each public table without RLS.
 * Opening one shows what's wrong with it and how to fix it.
 */
export const IssueAffectedResources = ({ issue }: { issue: Issue }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const affected = sortAffected(issue.affected)

  const visible = isExpanded ? affected : affected.slice(0, COLLAPSED_ROW_COUNT)
  const hiddenCount = affected.length - visible.length

  return (
    <div className="flex min-w-0 flex-1 flex-col items-start">
      <ul aria-label="Affected resources" className="flex w-full min-w-0 flex-col">
        {visible.map((item) => (
          <AffectedResourceRow key={item.id} affected={item} />
        ))}
      </ul>
      {hiddenCount > 0 && (
        <Button
          variant="text"
          size="tiny"
          className="-ml-2 px-2 text-foreground-lighter"
          onClick={() => setIsExpanded(true)}
        >
          Show {hiddenCount.toLocaleString()} more
        </Button>
      )}
    </div>
  )
}
