import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useParams } from 'common'
import { ChevronRightIcon } from 'lucide-react'
import { cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { IssueAgentPrompt } from './IssueAgentPrompt'
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
  SEVERITY_DOT_CLASSES,
  SEVERITY_LABELS,
} from './Issues.constants'
import { AlertError } from '@/components/ui/AlertError'
import { issuesQueryOptions } from '@/data/issues/issues-query'

export const IssuesOverview = () => {
  const { ref } = useParams()
  const { data, error, isPending, isError } = useQuery(
    issuesQueryOptions({ projectRef: ref, filters: { status: ['open'] } })
  )

  const openIssues = data?.issues ?? []
  const countBy = <T extends string>(values: T[]) =>
    values.reduce<Record<string, number>>((counts, value) => {
      counts[value] = (counts[value] ?? 0) + 1
      return counts
    }, {})
  const severityCounts = countBy(openIssues.map((issue) => issue.severity))
  const categoryCounts = countBy(openIssues.map((issue) => issue.category))

  return (
    <div className="h-full overflow-y-auto bg-card">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 pb-16 pt-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl text-foreground">Issues</h1>
          <p className="text-sm text-foreground-light">
            Problems found in this project by checks, people and agents
          </p>
        </header>

        {isPending && <GenericSkeletonLoader />}
        {isError && <AlertError error={error} subject="Failed to retrieve issues" />}
        {data && (
          <>
            <section
              aria-label="Open issues by severity"
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              <StatCard label="Open" value={openIssues.length} href={`/project/${ref}/issues`} />
              {ISSUE_SEVERITIES.map((severity) => (
                <StatCard
                  key={severity}
                  label={SEVERITY_LABELS[severity]}
                  value={severityCounts[severity] ?? 0}
                  dotClassName={SEVERITY_DOT_CLASSES[severity]}
                  href={`/project/${ref}/issues?severity=${severity}`}
                />
              ))}
            </section>

            <section aria-labelledby="issues-by-category" className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <h2 id="issues-by-category" className="text-sm text-foreground">
                  Open by category
                </h2>
              </div>
              <ul className="flex flex-col divide-y rounded-md border">
                {ISSUE_CATEGORIES.map((category) => {
                  const Icon = CATEGORY_ICONS[category]
                  return (
                    <li key={category}>
                      <Link
                        to="/project/$ref/issues"
                        params={{ ref: ref ?? '' }}
                        search={{ category }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-light hover:bg-muted hover:text-foreground"
                      >
                        <Icon size={14} className="shrink-0 text-foreground-lighter" />
                        <span className="flex-1">{CATEGORY_LABELS[category]}</span>
                        <span className="tabular-nums text-foreground-lighter">
                          {categoryCounts[category] ?? 0}
                        </span>
                        <ChevronRightIcon size={14} className="shrink-0 text-foreground-muted" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          </>
        )}
        {ref && <IssueAgentPrompt projectRef={ref} />}
      </div>
    </div>
  )
}

const StatCard = ({
  label,
  value,
  href,
  dotClassName,
}: {
  label: string
  value: number
  href: string
  dotClassName?: string
}) => (
  <Link
    to={href}
    className="flex flex-col gap-1 rounded-md border bg-card px-4 py-3 hover:border-strong"
  >
    <span className="flex items-center gap-1.5 text-xs text-foreground-lighter">
      {dotClassName && <span className={cn('size-1.5 rounded-full', dotClassName)} />}
      {label}
    </span>
    <span className="text-2xl tabular-nums text-foreground">{value}</span>
  </Link>
)
