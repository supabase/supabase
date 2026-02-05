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
