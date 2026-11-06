import type { ReactNode } from 'react'
import { cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { IssueAffectedResources } from './IssueAffectedResources'
import { CATEGORY_ICONS, CATEGORY_LABELS } from './Issues.constants'
import type { Issue } from '@/data/issues/issue.types'

// Stacked label over value in a narrow side column, label beside value once there's width.
// A value of several lines aligns its label with the first one.
const IssueProperty = ({
  label,
  align = 'center',
  children,
}: {
  label: string
  align?: 'center' | 'start'
  children: ReactNode
}) => (
  <div
    className={cn(
      'flex min-w-0 flex-col gap-1.5 @3xs:grid @3xs:grid-cols-[6rem_minmax(0,1fr)] @3xs:gap-x-4',
      align === 'center' ? '@3xs:items-center' : '@3xs:items-start'
    )}
  >
    <dt className={cn('heading-meta text-foreground-lighter', align === 'start' && '@3xs:pt-1')}>
      {label}
    </dt>
    <dd className="flex min-w-0 items-center gap-2 text-sm text-foreground">{children}</dd>
  </div>
)

const IssuePropertiesList = ({ children }: { children: ReactNode }) => (
  <div className="@container">
    <dl className="flex flex-col gap-6 @3xs:gap-3">{children}</dl>
  </div>
)

const SKELETON_ROWS = [
  { label: 'Category', width: 'w-20' },
  { label: 'Affected', width: 'w-28' },
]

export const IssuePropertiesSkeleton = () => (
  <IssuePropertiesList>
    {SKELETON_ROWS.map(({ label, width }, index) => (
      <IssueProperty key={label} label={label}>
        <span className="flex h-5 w-full items-center">
          <ShimmeringLoader className={cn('h-3 py-0', width)} delayIndex={index} />
        </span>
      </IssueProperty>
    ))}
  </IssuePropertiesList>
)

export const IssueProperties = ({ issue }: { issue: Issue }) => {
  const CategoryIcon = CATEGORY_ICONS[issue.category]

  return (
    <IssuePropertiesList>
      <IssueProperty label="Category">
        <CategoryIcon size={14} className="shrink-0 text-foreground-lighter" aria-hidden />
        {CATEGORY_LABELS[issue.category]}
      </IssueProperty>
      <IssueProperty label="Affected" align="start">
        <IssueAffectedResources key={issue.id} issue={issue} />
      </IssueProperty>
    </IssuePropertiesList>
  )
}
