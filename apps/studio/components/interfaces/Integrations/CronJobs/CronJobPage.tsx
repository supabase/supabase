import { useParams } from 'common'
import { toString as CronToString } from 'cronstrue'
import { useCronJobQuery } from 'data/database-cron-jobs/database-cron-job-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { type ConfirmOnCloseModalProps, useConfirmOnClose } from 'hooks/ui/useConfirmOnClose'
import { Edit3, List } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  BreadcrumbItem_Shadcn_ as BreadcrumbItem,
  BreadcrumbLink_Shadcn_ as BreadcrumbLink,
  BreadcrumbList_Shadcn_ as BreadcrumbList,
  BreadcrumbPage_Shadcn_ as BreadcrumbPage,
  BreadcrumbSeparator_Shadcn_ as BreadcrumbSeparator,
  Button,
  CodeBlock,
  Sheet,
  SheetContent,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { CreateCronJobSheet } from './CreateCronJobSheet/CreateCronJobSheet'
import { isSecondsFormat, parseCronJobCommand } from './CronJobs.utils'
import { PreviousRunsTab } from './PreviousRunsTab'

export const CronJobPage = () => {
  const router = useRouter()
  const { ref, id, pageId, childId } = useParams()
  const childLabel = router?.query?.['child-label'] as string
  const { data: project } = useSelectedProjectQuery()

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

  const jobId = Number(childId)

  const { data: job, isPending: isLoading } = useCronJobQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: jobId,
  })

  const { data: edgeFunctions = [] } = useEdgeFunctionsQuery({ projectRef: project?.ref })

  // Parse the cron job command to check if it's an edge function
  const cronJobValues = parseCronJobCommand(job?.command || '', project?.ref!)
  const edgeFunction =
    cronJobValues.type === 'edge_function' ? cronJobValues.edgeFunctionName : undefined
  const edgeFunctionSlug = edgeFunction?.split('/functions/v1/').pop()
  const isValidEdgeFunction = edgeFunctions.some((x) => x.slug === edgeFunctionSlug)

  const [isDirty, setIsDirty] = useState(false)
  const { confirmOnClose, modalProps: closeConfirmationModalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose: () => {
      setIsDirty(false)
      setIsEditSheetOpen(false)
    },
  })

  const pageTitle = childLabel || childId || 'Cron Job'

  const pageSubtitle = job ? (
    <div className="text-sm text-foreground-light">
      Running{' '}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-pointer underline decoration-dotted lowercase">
            {isSecondsFormat(job.schedule)
              ? job.schedule.toLowerCase()
              : CronToString(job.schedule.toLowerCase())}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          <div className="text-xs">
            <p className="font-mono mb-1">{job.schedule.toLowerCase()}</p>
            {!isSecondsFormat(job.schedule) && (
              <p className="text-foreground-light">{CronToString(job.schedule.toLowerCase())}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>{' '}
      with command{' '}
      <Tooltip>
        <TooltipTrigger asChild>
          <code className="text-code-inline max-w-[200px] inline-block truncate align-bottom cursor-pointer">
            {job.command}
          </code>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="center"
          className="min-w-[200px] max-w-[400px] text-wrap p-0"
        >
          <p className="text-xs font-mono px-2 py-1 border-b bg-surface-100">Command</p>
          <CodeBlock
            hideLineNumbers
            language="sql"
            value={job.command.trim()}
            className={cn(
              'py-0 px-3.5 max-w-full prose dark:prose-dark border-0 rounded-t-none',
              '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap min-h-11',
              '[&>code]:text-xs'
            )}
          />
        </TooltipContent>
      </Tooltip>
    </div>
  ) : null

  // Secondary actions
  const secondaryActions = [
    <Button
      key="edit"
      type="outline"
      icon={<Edit3 strokeWidth={1.5} size="14" />}
      onClick={() => setIsEditSheetOpen(true)}
    >
      Edit
    </Button>,
    <Button key="view-logs" asChild type="outline" icon={<List strokeWidth={1.5} size="14" />}>
      <Link
        target="_blank"
        rel="noopener noreferrer"
        href={`/project/${project?.ref}/logs/pgcron-logs/`}
      >
        View Cron logs
      </Link>
    </Button>,
    ...(isValidEdgeFunction
      ? [
          <Button key="view-edge-logs" asChild type="outline">
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={`/project/${project?.ref}/functions/${edgeFunctionSlug}/logs`}
            >
              View Edge Function logs
            </Link>
          </Button>,
        ]
      : []),
  ]

  return (
    <>
      <PageHeader size="full" className="pb-6">
        <PageHeaderBreadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/project/${ref}/integrations`}>Integrations</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/project/${ref}/integrations/${id}/${pageId}`}>Cron</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{childLabel ?? job?.jobname ?? 'Cron Job'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageHeaderBreadcrumb>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{pageTitle}</PageHeaderTitle>
            <PageHeaderDescription>
              {isLoading ? <ShimmeringLoader className="py-0 h-[20px] w-96" /> : pageSubtitle}
            </PageHeaderDescription>
          </PageHeaderSummary>
          {secondaryActions.length > 0 && <PageHeaderAside>{secondaryActions}</PageHeaderAside>}
        </PageHeaderMeta>
      </PageHeader>

      <PreviousRunsTab />

      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent size="lg">
          {job && (
            <CreateCronJobSheet
              selectedCronJob={{
                jobname: job.jobname,
                schedule: job.schedule,
                active: job.active,
                command: job.command,
              }}
              supportsSeconds={true}
              onDirty={setIsDirty}
              onClose={() => setIsEditSheetOpen(false)}
              onCloseWithConfirmation={confirmOnClose}
            />
          )}
        </SheetContent>
      </Sheet>
      <CloseConfirmationModal {...closeConfirmationModalProps} />
    </>
  )
}

const CloseConfirmationModal = ({ visible, onClose, onCancel }: ConfirmOnCloseModalProps) => (
  <ConfirmationModal
    visible={visible}
    title="Discard changes"
    confirmLabel="Discard"
    onCancel={onCancel}
    onConfirm={onClose}
  >
    <p className="text-sm text-foreground-light">
      There are unsaved changes. Are you sure you want to close the panel? Your changes will be
      lost.
    </p>
  </ConfirmationModal>
)
