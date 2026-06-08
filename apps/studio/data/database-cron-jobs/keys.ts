import { sqlKeys } from '@/data/sql/keys'

export const databaseCronJobsKeys = {
  create: () => ['cron-jobs', 'create'] as const,
  delete: () => ['cron-jobs', 'delete'] as const,
  alter: () => ['cronjobs', 'alter'] as const,
  job: (projectRef: string | undefined, identifier: number | string | undefined) =>
    ['projects', projectRef, 'cron-jobs', identifier] as const,
  listInfinite: (projectRef: string | undefined, searchTerm: string | undefined) =>
    ['projects', projectRef, 'cron-jobs', { searchTerm }] as const,
  listInfiniteMinimal: (projectRef: string | undefined, searchTerm: string | undefined) =>
    ['projects', projectRef, 'cron-jobs-mininal', { searchTerm }] as const,
  count: (projectRef: string | undefined) =>
    ['projects', projectRef, 'cron-jobs', 'count'] as const,
  run: (projectRef: string | undefined, jobId: number) => [
    'projects',
    projectRef,
    'cron-jobs',
    jobId,
    'run',
  ],
  runsInfinite: (projectRef: string | undefined, jobId: number, options?: object) => [
    'projects',
    projectRef,
    'cron-jobs',
    jobId,
    options,
  ],
  timezone: (projectRef: string | undefined) => ['database-cron-timezone', projectRef] as const,
}

export const getJobRunDetailsPageCountKey = (projectRef: string | undefined) =>
  sqlKeys.query(projectRef, ['cron-job-run-details', 'page-count'])

export const getDeleteOldCronJobRunDetailsByCtidKey = (
  projectRef: string | undefined,
  interval: string,
  startPage: number
) => sqlKeys.query(projectRef, ['cron-job-run-details', 'delete-batch', interval, startPage])

export const getScheduleDeleteCronJobRunDetailsKey = (
  projectRef: string | undefined,
  interval: string
) => sqlKeys.query(projectRef, ['cron-job-run-details', 'schedule', interval])
