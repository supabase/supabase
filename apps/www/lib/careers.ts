export interface JobItemProps {
  id: string
  title: string
  location: any
  department: string
  team: string
  employment: string
  descriptionHtml: string
  jobUrl: string
}

export const PLACEHOLDER_JOB_ID = '64d76968-1fe1-458c-8c6d-8859168c3fb7'
export const filterGenericJob = (job: JobItemProps) => job.id === PLACEHOLDER_JOB_ID
export const groupJobsByDepartment = (jobs: JobItemProps[]) => {
  return jobs.reduce(
    (acc, job) => {
      const department = job.department || 'Other'
      if (!acc[department]) {
        acc[department] = []
      }
      acc[department].push(job)
      return acc
    },
    {} as Record<string, JobItemProps[]>
  )
}
