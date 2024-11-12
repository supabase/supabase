import CronJobRunsDataGrid from 'components/interfaces/Integrations/CronJobs/CronJobRunsDataGrid'
import CronJobsDataGrid from 'components/interfaces/Integrations/CronJobs/CronJobsDataGrid'
import { CronJobsListing } from 'components/interfaces/Integrations/CronJobs/CronJobsListing'
import ProjectIntegrationsLayout from 'components/layouts/ProjectIntegrationsLayout/ProjectIntegrationsLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'
import { useQueryState } from 'nuqs'
import { useState, useEffect } from 'react'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-query'
import { ChevronRight } from 'lucide-react'

const CronJobsPage: NextPageWithLayout = () => {
  const [jobState, setJobState] = useState<{ jobId: string; selectedJob: CronJob | null }>({
    jobId: '',
    selectedJob: null,
  })

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
        <CronJobsDataGrid jobState={jobState} updateJobState={updateJobState} />
      ) : (
        <CronJobRunsDataGrid
          jobId={Number(urlCronJob)}
          jobState={jobState}
          updateJobState={updateJobState}
        />
      )}
    </>

    // <ScaffoldContainer className="h-full">
    //   <ScaffoldSection className="h-full">
    //     <div className="col-span-12 h-full pb-8">
    //       <CronJobsDataGrid />
    //     </div>
    //   </ScaffoldSection>
    // </ScaffoldContainer>
  )
}

CronJobsPage.getLayout = (page) => (
  <ProjectIntegrationsLayout title="Cron Jobs">{page}</ProjectIntegrationsLayout>
)

export default CronJobsPage
