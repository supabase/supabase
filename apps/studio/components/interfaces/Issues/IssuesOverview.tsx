import { useFlag, useParams } from 'common'
import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
  SEVERITY_DOT_CLASSES,
  SEVERITY_LABELS,
} from './Issues.constants'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { useProjectIssues } from '@/data/issues/useProjectIssues'
import { DOCS_URL } from '@/lib/constants'

const countBy = <T extends string>(values: T[]) =>
  values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})

export const IssuesOverview = () => {
  const { ref } = useParams()
  const isHealthAdvisorEnabled = useFlag('healthAdvisor')
  const { issues, error, isLoading, isError, isSuccess } = useProjectIssues({ projectRef: ref })

  const severityCounts = countBy(issues.map((issue) => issue.severity))
  const categoryCounts = countBy(issues.map((issue) => issue.category))
  const categories = ISSUE_CATEGORIES.filter(
    (category) => category !== 'health' || isHealthAdvisorEnabled
  )

  return (
    <div className="h-full overflow-y-auto bg-card">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 pb-16 pt-10">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl text-foreground">Issues</h1>
            <p className="text-sm text-foreground-light">
              Problems found in this project by Supabase checks
            </p>
          </div>
          <DocsButton href={`${DOCS_URL}/guides/observability/advisors`} />
        </header>

        {isLoading && <GenericSkeletonLoader />}
        {isError && <AlertError error={error} subject="Failed to retrieve issues" />}
        {isSuccess && (
          <>
            <section
              aria-label="Open issues by severity"
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              <StatCard label="Open" value={issues.length} href={`/project/${ref}/issues`} />
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
              <h2 id="issues-by-category" className="text-sm text-foreground">
                Open by category
              </h2>
              <ul className="flex flex-col divide-y rounded-md border">
                {categories.map((category) => {
                  const Icon = CATEGORY_ICONS[category]
                  return (
                    <li key={category}>
                      <Link
                        href={`/project/${ref}/issues?category=${category}`}
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
    href={href}
    className="flex flex-col gap-1 rounded-md border bg-card px-4 py-3 hover:border-strong"
  >
    <span className="flex items-center gap-1.5 text-xs text-foreground-lighter">
      {dotClassName && <span className={cn('size-1.5 rounded-full', dotClassName)} />}
      {label}
    </span>
    <span className="text-2xl tabular-nums text-foreground">{value}</span>
  </Link>
)
