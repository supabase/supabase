import { Loader2, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useMemo, useRef, useState } from 'react'
import DataGrid, { DataGridHandle, Row } from 'react-data-grid'

import { useParams } from 'common'
import { CreateCronJobSheet } from 'components/interfaces/Integrations/CronJobs/CreateCronJobSheet'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCronJobsCountQuery } from 'data/database-cron-jobs/database-cron-jobs-count-query'
import { CronJob, useCronJobsQuery } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button, cn, Input, Sheet, SheetContent } from 'ui'
import { formatCronJobColumns } from './CronJobs.utils'
import { DeleteCronJob } from './DeleteCronJob'

const EMPTY_CRON_JOB = {
  jobname: '',
  schedule: '',
  active: true,
  command: '',
}

export const CronjobsTab = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { project } = useProjectContext()
  const { data: org } = useSelectedOrganizationQuery()
  const gridRef = useRef<DataGridHandle>(null)

  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''))
  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useQueryState(
    'dialog-shown',
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  )

  // used for confirmation prompt in the Create Cron Job Sheet
  const [isClosingCreateCronJobSheet, setIsClosingCreateCronJobSheet] = useState(false)
  const [cronJobForEditing, setCronJobForEditing] = useState<
    Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'> | undefined
  >()
  const [cronJobForDeletion, setCronJobForDeletion] = useState<CronJob | undefined>()

  const { data: cronJobs = [], isLoading } = useCronJobsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: count, isLoading: isLoadingCount } = useCronJobsCountQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: extensions = [] } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: sendEvent } = useSendEventMutation()

  const columns = useMemo(() => {
    return formatCronJobColumns({
      onSelectEdit: (job: any) => {
        sendEvent({
          action: 'cron_job_update_clicked',
          groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
        })
        setCreateCronJobSheetShown(true)
        setCronJobForEditing(job)
      },
      onSelectDelete: (job: CronJob) => {
        sendEvent({
          action: 'cron_job_delete_clicked',
          groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
        })
        setCronJobForDeletion(job)
      },
    })
  }, [org?.slug, ref, sendEvent, setCreateCronJobSheetShown])

  // check pg_cron version to see if it supports seconds
  const pgCronExtension = extensions.find((ext) => ext.name === 'pg_cron')
  const installedVersion = pgCronExtension?.installed_version
  const supportsSeconds = installedVersion ? parseFloat(installedVersion) >= 1.5 : false

  const filteredCronJobs =
    searchQuery.length > 0
      ? cronJobs.filter((cj) => cj?.jobname?.includes(searchQuery || ''))
      : cronJobs

  const onOpenCreateJobSheet = () => {
    sendEvent({
      action: 'cron_job_create_clicked',
      groups: { project: project?.ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
    setCreateCronJobSheetShown(true)
  }

  if (isLoading)
    return (
      <div className="p-10">
        <GenericSkeletonLoader />
      </div>
    )

  return (
    <>
      <div className="h-full w-full space-y-4">
        {cronJobs.length == 0 ? (
          <div className="m-4 md:m-10 border rounded border-default px-20 py-16 flex flex-col items-center justify-center space-y-4 border-dashed">
            <p className="text-sm text-foreground">No cron jobs created yet</p>
            <Button onClick={onOpenCreateJobSheet}>Create job</Button>
          </div>
        ) : (
          <div className="h-full w-full flex flex-col">
            <div className="bg-surface-200 py-3 px-10 flex items-center justify-between flex-wrap border-b">
              <Input
                placeholder="Search for a job"
                size="tiny"
                icon={<Search size={14} />}
                value={searchQuery || ''}
                className="w-52"
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <Button onClick={onOpenCreateJobSheet}>Create job</Button>
            </div>

            <DataGrid
              ref={gridRef}
              className="flex-grow border-t-0"
              rowHeight={44}
              headerRowHeight={36}
              columns={columns}
              rows={cronJobs}
              rowKeyGetter={(row) => row.id}
              rowClass={() => {
                return cn(
                  'cursor-pointer',
                  '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
                  '[&>.rdg-cell:first-child>div]:ml-8'
                )
              }}
              renderers={{
                renderRow(_, props) {
                  return (
                    <Row
                      {...props}
                      onClick={(e) => {
                        const { jobid, jobname } = props.row
                        const url = `/project/${ref}/integrations/cron/jobs/${jobid}?child-label=${encodeURIComponent(jobname || `Job #${jobid}`)}`

                        sendEvent({
                          action: 'cron_job_history_clicked',
                          groups: {
                            project: ref ?? 'Unknown',
                            organization: org?.slug ?? 'Unknown',
                          },
                        })

                        if (e.metaKey) {
                          window.open(url, '_blank')
                        } else {
                          router.push(url)
                        }
                      }}
                    />
                  )
                },
              }}
            />

            <div className="flex justify-between min-h-9 h-9 overflow-hidden items-center px-6 w-full border-t text-xs text-foreground-light">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Loading...
                </span>
              ) : (
                `Total: ${count} jobs`
              )}
            </div>
          </div>
        )}
      </div>

      <DeleteCronJob
        visible={!!cronJobForDeletion}
        onClose={() => setCronJobForDeletion(undefined)}
        cronJob={cronJobForDeletion!}
      />

      <Sheet
        open={!!createCronJobSheetShown}
        onOpenChange={() => setIsClosingCreateCronJobSheet(true)}
      >
        <SheetContent size="default" tabIndex={undefined}>
          <CreateCronJobSheet
            selectedCronJob={cronJobForEditing ?? EMPTY_CRON_JOB}
            supportsSeconds={supportsSeconds}
            onClose={() => {
              setIsClosingCreateCronJobSheet(false)
              setCronJobForEditing(undefined)
              setCreateCronJobSheetShown(false)
            }}
            isClosing={isClosingCreateCronJobSheet}
            setIsClosing={setIsClosingCreateCronJobSheet}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
