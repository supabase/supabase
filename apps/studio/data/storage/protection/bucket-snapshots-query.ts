import { useMutation, useQuery, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import { type BucketSnapshot, getMockBucketSnapshots, mockDelay } from './protection-mocks'

export type BucketSnapshotsVariables = {
  projectRef?: string
  bucketId?: string
}

export const useBucketSnapshotsQuery = ({ projectRef, bucketId }: BucketSnapshotsVariables) =>
  useQuery<BucketSnapshot[], Error>({
    queryKey: storageKeys.snapshots(projectRef, bucketId),
    queryFn: () => mockDelay(getMockBucketSnapshots(bucketId ?? '')),
    enabled: !!projectRef && !!bucketId,
  })

type SnapshotCreateVariables = {
  projectRef: string
  bucketId: string
  name?: string
  expiryDays: number | null
}

export const useBucketSnapshotCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<void, Error, SnapshotCreateVariables> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, SnapshotCreateVariables>({
    mutationFn: () => mockDelay(undefined, 700),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.snapshots(variables.projectRef, variables.bucketId),
      })
      await onSuccess?.(data, variables, context)
    },
    onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to take snapshot: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}

type SnapshotRestoreVariables = {
  projectRef: string
  bucketId: string
  snapshotId: string
}

export const useBucketSnapshotRestoreMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<void, Error, SnapshotRestoreVariables> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, SnapshotRestoreVariables>({
    mutationFn: () => mockDelay(undefined, 900),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.snapshots(variables.projectRef, variables.bucketId),
      })
      await onSuccess?.(data, variables, context)
    },
    onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to restore snapshot: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
