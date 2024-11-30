export const databaseCronJobsKeys = {
  create: () => ['cron-jobs', 'create'] as const,
  delete: () => ['cron-jobs', 'delete'] as const,
  alter: () => ['cronjobs', 'alter'] as const,
  list: (projectRef: string | undefined) => ['projects', projectRef, 'cron-jobs'] as const,
  runsInfinite: (projectRef: string | undefined, jobId: number, options?: object) => [
    'projects',
    projectRef,
    'cron-jobs',
    jobId,
    options,
  ],
  timezone: (projectRef: string | undefined) => ['database-cron-timezone', projectRef] as const,
}
