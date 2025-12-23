import { DatabaseUpgradeProgress } from '@supabase/shared-types/out/events'

export const DATABASE_UPGRADE_STEPS = [
  {
    key: DatabaseUpgradeProgress.Started,
    title: 'Prepare new server',
  },
  {
    key: DatabaseUpgradeProgress.LaunchedUpgradedInstance,
    title: 'Get new server ready for migration',
  },
  {
    key: DatabaseUpgradeProgress.DetachedVolumeFromUpgradedInstance,
    title: 'Execute pre-upgrade checks',
  },
  {
    key: DatabaseUpgradeProgress.AttachedVolumeToOriginalInstance,
    title: 'Shut down API services',
    offline: true,
  },
  {
    key: DatabaseUpgradeProgress.InitiatedDataUpgrade,
    title: 'Set up destination database',
    offline: true,
  },
  {
    key: DatabaseUpgradeProgress.CompletedDataUpgrade,
    title: 'Execute database migration',
    offline: true,
  },
  {
    key: DatabaseUpgradeProgress.DetachedVolumeFromOriginalInstance,
    title: 'Update database extensions',
  },
  {
    key: DatabaseUpgradeProgress.AttachedVolumeToUpgradedInstance,
    title: 'Optimize database',
  },
]
