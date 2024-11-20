import ProjectIntegrationsLayout from 'components/layouts/ProjectIntegrationsLayout/ProjectIntegrationsLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { CronJob, useCronJobsQuery } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useEffect, useState } from 'react'
import type { NextPageWithLayout } from 'types'

import { CronJobsDisabledState } from 'components/interfaces/Integrations/CronJobs/CronJobsDisabledState'

import { CreateCronJobSheet } from 'components/interfaces/Integrations/CronJobs/CreateCronJobSheet'
import CronJobRunsDataGrid from 'components/interfaces/Integrations/CronJobs/CronJobRunsDataGrid'
import CronJobsDataGrid from 'components/interfaces/Integrations/CronJobs/CronJobsDataGrid'
import { CronJobsFormHeader } from 'components/interfaces/Integrations/CronJobs/CronJobsFormHeader'
import { useQueryState } from 'nuqs'
import { Sheet, SheetContent } from 'ui'

const CronJobsPage: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const [isClosingCreateCronJobSheet, setIsClosingCreateCronJobSheet] = useState(false)
  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useState<
    Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'> | undefined
  >()
  const [jobState, setJobState] = useState<{ jobId: string; selectedJob: CronJob | null }>({
    jobId: '',
    selectedJob: null,
  })
  const { isError, refetch } = useCronJobsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: extensions, isLoading: isLoadingExtensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgCronExtension = (extensions ?? []).find((ext) => ext.name === 'pg_cron')
  const pgCronExtensionInstalled = pgCronExtension?.installed_version

  useEffect(() => {
    // refetch the cron jobs after the pgcron extension has been installed
    if (pgCronExtensionInstalled && isError) {
      refetch()
    }
  }, [isError, pgCronExtensionInstalled, refetch])

  // store the jobId in the url
  const [urlCronJob, setUrlCronJob] = useQueryState('jobid', { defaultValue: '' })

  // Sync the jobId from useQueryState with the combined state
  useEffect(() => {
    setJobState((prevState) => ({ ...prevState, jobId: urlCronJob }))
  }, [urlCronJob])

  // Update both jobId and selectedJob
  function updateJobState(jobId: string, job: CronJob | null) {
    setJobState({ jobId, selectedJob: job })
    setUrlCronJob(jobId)
  }
  return (
    <>
      {urlCronJob === '' ? (
        <>
          {isLoadingExtensions ? (
            <GenericSkeletonLoader />
          ) : !pgCronExtensionInstalled ? (
            <CronJobsDisabledState />
          ) : (
            <>
              <CronJobsFormHeader />
              <CronJobsDataGrid jobState={jobState} updateJobState={updateJobState} />
            </>
          )}
        </>
      ) : (
        <>
          <CronJobsFormHeader />
          <CronJobRunsDataGrid updateJobState={updateJobState} />
        </>
      )}
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

CronJobsPage.getLayout = (page) => (
  <ProjectIntegrationsLayout title="Cron Jobs">{page}</ProjectIntegrationsLayout>
)

export default CronJobsPage
