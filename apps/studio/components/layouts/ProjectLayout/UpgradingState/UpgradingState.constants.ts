import { DatabaseUpgradeProgress } from '@supabase/shared-types/out/events'

export const DATABASE_UPGRADE_MESSAGES = [
  {
    key: DatabaseUpgradeProgress.Started,
    initial: 'Prepare new server',
    progress: 'Preparing new server',
    completed: 'Prepared new server',
  },
  {
    key: DatabaseUpgradeProgress.LaunchedUpgradedInstance,
    initial: 'Prepare new server for migration',
    progress: 'Preparing new server for migration',
    completed: 'New server ready for migration',
  },
  {
    key: DatabaseUpgradeProgress.DetachedVolumeFromUpgradedInstance,
    initial: 'Execute pre-upgrade checks',
    progress: 'Executing pre-upgrade checks',
    completed: 'Completed pre-upgrade checks',
  },
  {
    key: DatabaseUpgradeProgress.AttachedVolumeToOriginalInstance,
    initial: 'Shut down API services',
    progress: 'Shutting down API services',
    completed: 'Completed shutting down API services',
  },
  {
    key: DatabaseUpgradeProgress.InitiatedDataUpgrade,
    initial: 'Migrate to new database',
    progress: 'Migrating to new database',
    completed: 'Completed migration to new database',
  },
  {
    key: DatabaseUpgradeProgress.CompletedDataUpgrade,
    initial: 'Execute database migration',
    progress: 'Executing database migration',
    completed: 'Completed database migration',
  },
  {
    key: DatabaseUpgradeProgress.DetachedVolumeFromOriginalInstance,
    initial: 'Update database extensions',
    progress: 'Updating database extensions',
    completed: 'Updated database extensions',
  },
  {
    key: DatabaseUpgradeProgress.AttachedVolumeToUpgradedInstance,
    initial: 'Optimize database',
    progress: 'Optimizing database',
    completed: 'Completed optimization of database',
  },
]
