import { useParams } from 'common'
import { CircleDotIcon, ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { asGraphqlExposureLint, GraphqlExposureCallout } from '../Linter/GraphqlExposureLintCTA'
import { Markdown } from '../Markdown'
import { IssueAffectedResources } from './IssueAffectedResources'
import { IssueDetailToolbar } from './IssueDetailToolbar'
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  SEVERITY_DOT_CLASSES,
  SEVERITY_LABELS,
} from './Issues.constants'
import {
  ExplorerToolbar,
  ExplorerToolbarIcon,
} from '@/components/interfaces/Explorer/ExplorerToolbar'
import { AlertError } from '@/components/ui/AlertError'
import type { Issue } from '@/data/issues/issue.types'
import { useProjectIssues } from '@/data/issues/useProjectIssues'

/** The column both the loaded issue and its skeleton render into, so they line up. */
const IssueDetailLayout = ({
  toolbar,
  header,
  children,
  ...props
}: {
  toolbar: ReactNode
  header: ReactNode
  children: ReactNode
} & Omit<ComponentProps<'div'>, 'className'>) => (
  // Fills the pane with the same raised surface as an Explorer tab
  <div className="flex h-full flex-col bg-card" {...props}>
    {toolbar}
    <div className="min-h-0 flex-1 overflow-y-auto">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-2">{header}</header>
        <div className="flex min-w-0 flex-col gap-8">{children}</div>
      </article>
    </div>
  </div>
)

/** Severity, category and the docs link, which sit in the same place on every issue. */
const IssueMeta = ({ issue }: { issue: Issue }) => {
  const CategoryIcon = CATEGORY_ICONS[issue.category]

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground-light">
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className={cn('size-1.5 rounded-full', SEVERITY_DOT_CLASSES[issue.severity])}
        />
        {SEVERITY_LABELS[issue.severity]}
      </span>
      <span aria-hidden className="text-foreground-muted">
        ·
      </span>
      <span className="flex items-center gap-1.5">
        <CategoryIcon size={14} aria-hidden className="text-foreground-lighter" />
        {CATEGORY_LABELS[issue.category]}
      </span>
      <span aria-hidden className="text-foreground-muted">
        ·
      </span>
      <Link
        href={issue.docsUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 hover:text-foreground"
      >
        View docs
        <ExternalLinkIcon size={14} aria-hidden />
      </Link>
    </p>
  )
}

// Each bar sits in a box the height of the line it stands in for, so nothing shifts on load
const DESCRIPTION_LINE_WIDTHS = ['w-full', 'w-11/12', 'w-4/5', 'w-2/3']

const IssueDetailSkeleton = () => (
  <IssueDetailLayout
    role="status"
    aria-label="Loading issue"
    toolbar={
      <ExplorerToolbar aria-hidden className="md:h-(--header-height)">
        <ExplorerToolbarIcon>
          <CircleDotIcon size={16} strokeWidth={2} />
        </ExplorerToolbarIcon>
        <ShimmeringLoader className="h-3 w-48 py-0" />
      </ExplorerToolbar>
    }
    header={
      <>
        <div className="flex h-8 items-center">
          <ShimmeringLoader className="h-6 w-2/3 py-0" />
        </div>
        <div className="flex h-5 items-center">
          <ShimmeringLoader className="h-3 w-64 py-0" delayIndex={1} />
        </div>
      </>
    }
  >
    <div className="flex flex-col gap-1">
      {DESCRIPTION_LINE_WIDTHS.map((width, index) => (
        <div key={width} className="flex h-5 items-center">
          <ShimmeringLoader className={`h-3 py-0 ${width}`} delayIndex={index} />
        </div>
      ))}
    </div>
  </IssueDetailLayout>
)

export const IssueDetail = () => {
  const { ref, id } = useParams()
  const { issues, error, isLoading, isError, isHealthLoading } = useProjectIssues({
    projectRef: ref,
  })
  const issue = issues.find((item) => item.id === id)

  if (!issue && (isLoading || isHealthLoading)) return <IssueDetailSkeleton />
  if (isError) {
    return (
      <div className="h-full bg-card px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <AlertError error={error} subject="Failed to retrieve issue" />
        </div>
      </div>
    )
  }
  if (!issue) {
    return (
      <div className="flex h-full items-center justify-center bg-card p-6">
        <Admonition
          type="default"
          className="max-w-md"
          title="Issue not found"
          description="The check may have stopped failing, or the link points to another project."
        />
      </div>
    )
  }

  return (
    <IssueDetailLayout
      toolbar={<IssueDetailToolbar issue={issue} />}
      header={
        <>
          <h1 className="text-2xl text-foreground">{issue.title}</h1>
          <IssueMeta issue={issue} />
        </>
      }
    >
      <section aria-label="Issue description" className="min-w-0">
        <Markdown className="text-base text-foreground-light">{issue.description}</Markdown>
      </section>
      {ref && asGraphqlExposureLint(issue.id) && <GraphqlExposureCallout projectRef={ref} />}
      <IssueAffectedResources key={issue.id} issue={issue} />
    </IssueDetailLayout>
  )
}
