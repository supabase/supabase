import { DatabaseUpgradeProgress, DatabaseUpgradeStatus } from '@supabase/shared-types/out/events'

/**
 * Target version for upgrade - matches API response structure
 */
export interface UpgradeTargetVersion {
  app_version: string
  postgres_version: string
  release_channel: string
}

/**
 * Discriminated union for upgrade panel states
 */
export type UpgradeState =
  | { status: 'waiting' }
  | { status: 'upgrading'; progress: string | undefined }
  | { status: 'backingUp' }
  | { status: 'completed'; targetVersion: string }
  | {
      status: 'failed'
      error: string | undefined
      initiatedAt: string | undefined
      targetVersion: string | undefined
    }

/**
 * Content configuration for each upgrade state
 */
export const UPGRADE_STATE_CONTENT = {
  waiting: {
    label: 'Upgrade',
    headline: 'New Postgres version available',
    stepsHeading: 'Steps we’ll take',
  },
  upgrading: {
    label: 'Upgrading',
    headline: 'We’re upgrading your project',
    stepsHeading: 'Steps we’re taking',
  },
  backingUp: {
    label: 'Backing up',
    headline: 'We’re backing up your project',
    stepsHeading: 'Steps we’re taking',
  },
  completed: {
    label: 'Done',
    headline: 'Upgrade complete',
    stepsHeading: 'Steps taken',
  },
  failed: {
    label: 'Failed',
    headline: 'We ran into an issue while upgrading your project',
    stepsHeading: 'Steps taken',
  },
} as const

/**
 * Helper to derive UpgradeState from raw data
 */
export function deriveUpgradeState(params: {
  isUpgradeInProgress: boolean
  status: DatabaseUpgradeStatus | undefined
  progress: string | undefined
  targetVersion: number | undefined
  error: string | undefined
  initiatedAt: string | undefined
}): UpgradeState {
  const { isUpgradeInProgress, status, progress, targetVersion, error, initiatedAt } = params

  if (status === DatabaseUpgradeStatus.Upgraded) {
    return { status: 'completed', targetVersion: String(targetVersion ?? '') }
  }

  if (status === DatabaseUpgradeStatus.Failed) {
    return {
      status: 'failed',
      error,
      initiatedAt,
      targetVersion: targetVersion !== undefined ? String(targetVersion) : undefined,
    }
  }

  if (isUpgradeInProgress) {
    // After upgrade completes, we may enter a backup phase
    // This happens when progress is either:
    // - 9_completed_upgrade (backup in progress)
    // - 10_completed_post_physical_backup (backup done, waiting for final status)
    const isInBackupPhase =
      status === DatabaseUpgradeStatus.Upgrading &&
      (progress === DatabaseUpgradeProgress.CompletedUpgrade ||
        progress === DatabaseUpgradeProgress.CompletedPostPhysicalBackup)

    if (isInBackupPhase) {
      return { status: 'backingUp' }
    }

    return {
      status: 'upgrading',
      progress: progress as DatabaseUpgradeProgress | undefined,
    }
  }

  return { status: 'waiting' }
}

/**
 * Shared props passed to all state components
 */
export interface SharedUpgradeProps {
  projectRef: string
  projectName: string
  displayTargetVersion: string | number
}

/**
 * Props for the waiting state component
 */
export interface WaitingStateProps extends SharedUpgradeProps {
  eligibilityData:
    | {
        target_upgrade_versions?: UpgradeTargetVersion[]
        duration_estimate_hours?: number
        legacy_auth_custom_roles?: string[]
        potential_breaking_changes?: string[]
      }
    | undefined
  diskAttributes:
    | {
        attributes: {
          size_gb: number
          type: string
        }
      }
    | undefined
  isDiskSizeUpdated: boolean
  /** The currently selected version value (format: "postgres_version|release_channel") */
  selectedVersionValue: string
  /** Callback when the version selection changes */
  onVersionChange: (value: string) => void
  onCancel: () => void
}

/**
 * Props for the upgrading state component
 */
export interface UpgradingStateProps extends SharedUpgradeProps {
  progress: string | undefined
  initiatedAt: string | undefined
}

/**
 * Props for the backing up state component
 */
export interface BackingUpStateProps extends SharedUpgradeProps {
  initiatedAt: string | undefined
}

/**
 * Props for the completed state component
 */
export interface CompletedStateProps extends SharedUpgradeProps {
  targetVersion: string
  onReturnToProject: () => Promise<void>
  isLoading: boolean
}

/**
 * Props for the failed state component
 */
export interface FailedStateProps extends SharedUpgradeProps {
  error: string | undefined
  initiatedAt: string | undefined
  targetVersion: string | undefined
  onReturnToProject: () => Promise<void>
  isLoading: boolean
}
