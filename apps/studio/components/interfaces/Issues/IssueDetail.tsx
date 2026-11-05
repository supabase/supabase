import { useParams } from 'common'
import { CircleDotIcon, ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { Button, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { asGraphqlExposureLint, GraphqlExposureCallout } from '../Linter/GraphqlExposureLintCTA'
import { Markdown } from '../Markdown'
import { IssueDetailToolbar } from './IssueDetailToolbar'
import { IssueProperties, IssuePropertiesSkeleton } from './IssueProperties'
import { SEVERITY_DOT_CLASSES, SEVERITY_LABELS } from './Issues.constants'
import {
  ExplorerToolbar,
  ExplorerToolbarIcon,
} from '@/components/interfaces/Explorer/ExplorerToolbar'
import { AlertError } from '@/components/ui/AlertError'
import { useProjectIssues } from '@/data/issues/useProjectIssues'

/** The grid both the loaded issue and its skeleton render into, so they line up. */
const IssueDetailLayout = ({
  toolbar,
  header,
  properties,
  children,
  ...props
}: {
  toolbar: ReactNode
  header: ReactNode
  properties: ReactNode
  children: ReactNode
} & Omit<ComponentProps<'div'>, 'className'>) => (
  // Fills the pane with the same raised surface as an Explorer tab
  <div className="flex h-full flex-col bg-card" {...props}>
    {toolbar}
    {/* Properties sit under the title in a narrow pane and move to a side column once there's room */}
    <div className="@container min-h-0 flex-1 overflow-y-auto">
      <article className="mx-auto grid w-full max-w-5xl gap-6 px-6 pb-16 pt-12 @4xl:grid-cols-[minmax(0,1fr)_13rem] @4xl:grid-rows-[auto_1fr] @4xl:gap-x-16 @4xl:gap-y-8">
        <header className="flex flex-col gap-2 @4xl:col-start-1">{header}</header>
        <aside
          aria-label="Issue properties"
          className="@4xl:sticky @4xl:top-8 @4xl:col-start-2 @4xl:row-span-2 @4xl:row-start-1 @4xl:self-start @4xl:pt-1"
        >
          {properties}
        </aside>
        <div className="flex min-w-0 flex-col gap-6 @4xl:col-start-1">{children}</div>
      </article>
    </div>
  </div>
)

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
          <ShimmeringLoader className="h-3 w-48 py-0" delayIndex={1} />
        </div>
      </>
    }
    properties={<IssuePropertiesSkeleton />}
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
          <p className="flex items-center gap-1.5 text-sm text-foreground-light">
            <span
              aria-hidden
              className={cn('size-1.5 rounded-full', SEVERITY_DOT_CLASSES[issue.severity])}
            />
            {SEVERITY_LABELS[issue.severity]}
          </p>
        </>
      }
      properties={<IssueProperties issue={issue} />}
    >
      <section aria-label="Issue description" className="min-w-0">
        <Markdown className="text-sm text-foreground-light">{issue.description}</Markdown>
      </section>
      {ref && asGraphqlExposureLint(issue.id) && <GraphqlExposureCallout projectRef={ref} />}
      <div>
        <Button asChild variant="default" iconRight={<ExternalLinkIcon size={14} />}>
          <Link href={issue.docsUrl} target="_blank" rel="noreferrer">
            Learn more
          </Link>
        </Button>
      </div>
    </IssueDetailLayout>
  )
}
