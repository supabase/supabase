import { useState } from 'react'

import { CreateCronJobSheet } from 'components/interfaces/Integrations/CronJobs/CreateCronJobSheet'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { CronJob, useCronJobsQuery } from 'data/database-cron-jobs/database-cron-jobs-query'
import { Search } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { Button, Input, Sheet, SheetContent } from 'ui'
import { CronJobCard } from '../CronJobs/CronJobCard'
import DeleteCronJob from '../CronJobs/DeleteCronJob'

export const CronjobsTab = () => {
  const { project } = useProjectContext()

  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''))

  // used for confirmation prompt in the Create Cron Job Sheet
  const [isClosingCreateCronJobSheet, setIsClosingCreateCronJobSheet] = useState(false)
  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useState<
    Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'> | undefined
  >()
  const [cronJobForDeletion, setCronJobForDeletion] = useState<CronJob | undefined>()

  const { data: cronJobs, isLoading } = useCronJobsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  if (isLoading)
    return (
      <div className="p-10">
        <GenericSkeletonLoader />
      </div>
    )

  const filteredCronJobs = (cronJobs ?? []).filter((cj) => cj.jobname.includes(searchQuery))

  return (
    <>
      <div className="w-full space-y-4 p-10">
        {(cronJobs ?? []).length == 0 ? (
          <div
            className={
              'border rounded border-default px-20 py-16 flex flex-col items-center justify-center space-y-4 border-dashed'
            }
          >
            <p className="text-sm text-foreground">No cron jobs created yet</p>
            <Button
              onClick={() =>
                setCreateCronJobSheetShown({
                  jobname: '',
                  schedule: '',
                  command: '',
                  active: true,
                })
              }
            >
              Add a new cron job
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between flex-wrap">
              <Input
                placeholder="Search for a job"
                size="small"
                icon={<Search size={14} />}
                value={searchQuery || ''}
                className="w-64"
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <Button
                onClick={() =>
                  setCreateCronJobSheetShown({
                    jobname: '',
                    schedule: '',
                    command: '',
                    active: true,
                  })
                }
              >
                Create a queue
              </Button>
            </div>
            {filteredCronJobs.length === 0 ? (
              <div
                className={
                  'border rounded border-default px-20 py-16 flex flex-col items-center justify-center space-y-4 border-dashed'
                }
              >
                <p className="text-sm text-foreground">No results found</p>
                <p className="text-sm text-foreground-light">
                  Your search for "{searchQuery}" did not return any results
                </p>
              </div>
            ) : (
              filteredCronJobs.map((job) => (
                <CronJobCard
                  job={job}
                  onEditCronJob={(job) => setCreateCronJobSheetShown(job)}
                  onDeleteCronJob={(job) => setCronJobForDeletion(job)}
                />
              ))
            )}
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
            selectedCronJob={createCronJobSheetShown}
            onClose={() => {
              setIsClosingCreateCronJobSheet(false)
              setCreateCronJobSheetShown(undefined)
            }}
            isClosing={isClosingCreateCronJobSheet}
            setIsClosing={setIsClosingCreateCronJobSheet}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
