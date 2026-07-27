import { useMutation, UseMutationOptions, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { restorePointKeys } from './keys'
import {
  getMockPlatformProtectionSummary,
  getMockRestorePointCoverage,
  mockDelay,
  type PlatformProtectionSummary,
  type RestorePointCoverage,
} from './restore-points-mocks'

export type RestorePointCoverageVariables = {
  projectRef?: string
  /** Backup timestamps, newest first — coverage is keyed by timestamp. */
  backupTimestamps: string[]
}

/** Coverage across Database / Storage / Config for each backup timestamp. */
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
