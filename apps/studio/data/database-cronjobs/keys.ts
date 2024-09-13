export const databaseCronjobsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'cronjobs'] as const,
}
