import { DatabaseUpgradeProgress } from '@supabase/shared-types/out/events'

export const DATABASE_UPGRADE_STEPS = [
  {
    key: DatabaseUpgradeProgress.Started,
    title: 'Prepare new server',
    activeTitle: 'Preparing new server',
  },
  {
    key: DatabaseUpgradeProgress.LaunchedUpgradedInstance,
    title: 'Get new server ready for migration',
    activeTitle: 'Getting new server ready for migration',
  },
  {
    key: DatabaseUpgradeProgress.DetachedVolumeFromUpgradedInstance,
    title: 'Execute pre-upgrade checks',
    activeTitle: 'Executing pre-upgrade checks',
  },
  {
    key: DatabaseUpgradeProgress.AttachedVolumeToOriginalInstance,
    title: 'Shut down API services',
    activeTitle: 'Shutting down API services',
    offline: true,
  },
  {
    key: DatabaseUpgradeProgress.InitiatedDataUpgrade,
    title: 'Set up destination database',
    activeTitle: 'Setting up destination database',
    offline: true,
  },
  {
    key: DatabaseUpgradeProgress.CompletedDataUpgrade,
    title: 'Execute database migration',
    activeTitle: 'Executing database migration',
    offline: true,
  },
  {
    key: DatabaseUpgradeProgress.DetachedVolumeFromOriginalInstance,
    title: 'Update database extensions',
    activeTitle: 'Updating database extensions',
  },
  {
    key: DatabaseUpgradeProgress.AttachedVolumeToUpgradedInstance,
    title: 'Optimize database',
    activeTitle: 'Optimizing database',
  },
]

/**
 * Special step shown when performing post-upgrade backup.
 * This step is appended to the upgrade steps table in the backingUp state.
 */
export const BACKUP_STEP = {
  key: 'backup',
  title: 'Perform full backup',
  activeTitle: 'Performing full backup',
} as const
