import { DatabaseUpgradeProgress } from '@supabase/shared-types/out/events'

export const DATABASE_UPGRADE_STEPS = [
  {
    key: DatabaseUpgradeProgress.Started,
    staticTitle: 'Prepare new server',
    activeTitle: 'Preparing new server',
  },
  {
    key: DatabaseUpgradeProgress.LaunchedUpgradedInstance,
    staticTitle: 'Get new server ready for migration',
    activeTitle: 'Getting new server ready for migration',
  },
  {
    key: DatabaseUpgradeProgress.DetachedVolumeFromUpgradedInstance,
    staticTitle: 'Execute pre-upgrade checks',
    activeTitle: 'Executing pre-upgrade checks',
  },
  {
    key: DatabaseUpgradeProgress.AttachedVolumeToOriginalInstance,
    staticTitle: 'Shut down API services',
    activeTitle: 'Shutting down API services',
    offline: true,
  },
  {
    key: DatabaseUpgradeProgress.InitiatedDataUpgrade,
    staticTitle: 'Set up destination database',
    activeTitle: 'Setting up destination database',
    offline: true,
  },
  {
    key: DatabaseUpgradeProgress.CompletedDataUpgrade,
    staticTitle: 'Execute database migration',
    activeTitle: 'Executing database migration',
    offline: true,
  },
  {
    key: DatabaseUpgradeProgress.DetachedVolumeFromOriginalInstance,
    staticTitle: 'Update database extensions',
    activeTitle: 'Updating database extensions',
  },
  {
    key: DatabaseUpgradeProgress.AttachedVolumeToUpgradedInstance,
    staticTitle: 'Optimize database',
    activeTitle: 'Optimizing database',
  },
]

/**
 * Special step shown when performing post-upgrade backup.
 * This step is appended to the upgrade steps table in the backingUp state.
 */
export const BACKUP_STEP = {
  key: 'backup',
  staticTitle: 'Perform full backup',
  activeTitle: 'Performing full backup',
} as const
