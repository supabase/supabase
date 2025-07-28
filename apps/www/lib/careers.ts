export interface JobItemProps {
  id: string
  title: string
  location: any
  team: string
  employment: string
  descriptionHtml: string
  jobUrl: string
}

export const PLACEHOLDER_JOB_ID = '64d76968-1fe1-458c-8c6d-8859168c3fb7'
export const filterGenericJob = (job: JobItemProps) => job.id === PLACEHOLDER_JOB_ID
export const groupJobsByTeam = (jobs: JobItemProps[]) => {
  return jobs.reduce(
    (acc, job) => {
      if (!acc[job.team]) {
        acc[job.team] = []
      }
      acc[job.team].push(job)
      return acc
    },
    {} as Record<string, JobItemProps[]>
  )
}
