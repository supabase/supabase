export const databaseCronJobsKeys = {
  create: () => ['cron-jobs', 'create'] as const,
  delete: () => ['cron-jobs', 'delete'] as const,
  alter: () => ['cronjobs', 'alter'] as const,
  list: (projectRef: string | undefined) => ['projects', projectRef, 'cron-jobs'] as const,
  runs: (projectRef: string | undefined, jobId: number) =>
    ['projects', projectRef, 'cron-jobs', jobId] as const,
}
