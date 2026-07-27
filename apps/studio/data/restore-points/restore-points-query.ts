import { useMutation, UseMutationOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { restorePointKeys } from './keys'
import {
  getMockPlatformProtectionSummary,
  getMockRestorePointCoverage,
  getMockStorageBackupSyncSettings,
  mockDelay,
  type PlatformProtectionSummary,
  type RestorePointCoverage,
  type StorageBackupSyncSettings,
} from './restore-points-mocks'

export type RestorePointCoverageVariables = {
  projectRef?: string
  /** Backup timestamps, newest first — coverage is keyed by timestamp. */
  backupTimestamps: string[]
}

/** Coverage across Database / Auth / Storage / Config for each backup timestamp. */
export const useRestorePointCoverageQuery = ({
  projectRef,
  backupTimestamps,
}: RestorePointCoverageVariables) =>
  useQuery<Record<string, RestorePointCoverage>, Error>({
    queryKey: [...restorePointKeys.coverage(projectRef), backupTimestamps.length],
    queryFn: () =>
      mockDelay(
        Object.fromEntries(
          backupTimestamps.map((timestamp, index) => [
            timestamp,
            getMockRestorePointCoverage(timestamp, index),
          ])
        )
      ),
    enabled: !!projectRef && backupTimestamps.length > 0,
  })

export const usePlatformProtectionSummaryQuery = ({ projectRef }: { projectRef?: string }) =>
  useQuery<PlatformProtectionSummary, Error>({
    queryKey: restorePointKeys.protectionSummary(projectRef),
    queryFn: () => mockDelay(getMockPlatformProtectionSummary()),
    enabled: !!projectRef,
  })

export const useStorageBackupSyncQuery = ({ projectRef }: { projectRef?: string }) =>
  useQuery<StorageBackupSyncSettings, Error>({
    queryKey: restorePointKeys.storageBackupSync(projectRef),
    queryFn: () => mockDelay(getMockStorageBackupSyncSettings()),
    enabled: !!projectRef,
  })

type StorageBackupSyncUpdateVariables = {
  projectRef: string
  settings: StorageBackupSyncSettings
}

/**
 * Prototype: persist the project-level sync settings. Writes optimistically into
 * the query cache so the coverage banner reflects the change immediately.
 */
export const useStorageBackupSyncUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<StorageBackupSyncSettings, Error, StorageBackupSyncUpdateVariables> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<StorageBackupSyncSettings, Error, StorageBackupSyncUpdateVariables>({
    mutationFn: ({ settings }) => mockDelay(settings, 500),
    async onSuccess(data, variables, context) {
      queryClient.setQueryData(restorePointKeys.storageBackupSync(variables.projectRef), data)
      const bucketsProtected = data.buckets.filter((bucket) => bucket.isIncluded).length
      queryClient.setQueryData<PlatformProtectionSummary>(
        restorePointKeys.protectionSummary(variables.projectRef),
        (previous) =>
          previous === undefined
            ? previous
            : { ...previous, bucketsProtected, bucketsTotal: data.buckets.length }
      )
      await onSuccess?.(data, variables, context)
    },
    onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to update settings: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}

export type RestoreMode = 'branch' | 'in-place'

type RestorePointRestoreVariables = {
  projectRef: string
  backupTimestamp: string
  mode: RestoreMode
  /** Whether to also restore the matching storage snapshot. */
  includeStorage: boolean
}

/**
 * Prototype: restoring a point either into a fresh preview branch
 * (non-destructive) or in place over production (destructive).
 */
export const useRestorePointRestoreMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<void, Error, RestorePointRestoreVariables> = {}) =>
  useMutation<void, Error, RestorePointRestoreVariables>({
    mutationFn: () => mockDelay(undefined, 800),
    onSuccess,
    onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to start restore: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
