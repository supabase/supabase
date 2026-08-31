import { useMutation, UseMutationOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import {
  deleteCurrentTrashVersionPermanently,
  deleteNoncurrentVersionPermanently,
  deleteMockTrashObjectsPermanently,
  getMockTrashObjects,
  mockDelay,
  restoreNoncurrentVersion,
  restoreMockTrashObjects,
  type TrashObject,
} from './protection-mocks'

export type BucketTrashVariables = {
  projectRef?: string
  bucketId?: string
}

export const useBucketTrashQuery = (
  { projectRef, bucketId }: BucketTrashVariables,
  { enabled = true }: { enabled?: boolean } = {}
) =>
  useQuery<TrashObject[], Error>({
    queryKey: storageKeys.trash(projectRef, bucketId),
    queryFn: () => mockDelay(getMockTrashObjects(bucketId ?? '')),
    enabled: enabled && !!projectRef && !!bucketId,
  })

type TrashRestoreVariables = {
  projectRef: string
  bucketId: string
  objectIds: string[]
}

export const useBucketTrashRestoreMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<void, Error, TrashRestoreVariables> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, TrashRestoreVariables>({
    mutationFn: async (variables) => {
      restoreMockTrashObjects(variables.objectIds)
      await mockDelay(undefined, 500)
    },
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.trash(variables.projectRef, variables.bucketId),
      })
      await onSuccess?.(data, variables, context)
    },
    onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to restore objects: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}

type TrashDeleteVariables = {
  projectRef: string
  bucketId: string
  objectIds?: string[]
}

export const useBucketTrashDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<void, Error, TrashDeleteVariables> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, TrashDeleteVariables>({
    mutationFn: async (variables) => {
      deleteMockTrashObjectsPermanently(variables.objectIds)
      await mockDelay(undefined, 600)
    },
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.trash(variables.projectRef, variables.bucketId),
      })
      await onSuccess?.(data, variables, context)
    },
    onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to delete objects: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}

type TrashVersionVariables = {
  projectRef: string
  bucketId: string
  objectId: string
  versionId: string
}

export const useTrashVersionRestoreMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<void, Error, TrashVersionVariables> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, TrashVersionVariables>({
    mutationFn: async (variables) => {
      restoreNoncurrentVersion(variables.objectId, variables.versionId)
      await mockDelay(undefined, 400)
    },
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.trash(variables.projectRef, variables.bucketId),
      })
      await onSuccess?.(data, variables, context)
    },
    onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to restore version: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}

export const useTrashVersionDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<void, Error, TrashVersionVariables> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, TrashVersionVariables>({
    mutationFn: async (variables) => {
      deleteNoncurrentVersionPermanently(variables.objectId, variables.versionId)
      await mockDelay(undefined, 400)
    },
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.trash(variables.projectRef, variables.bucketId),
      })
      await onSuccess?.(data, variables, context)
    },
    onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to delete version: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}

type TrashCurrentVersionVariables = {
  projectRef: string
  bucketId: string
  objectId: string
}

/**
 * Permanently deletes the version that was live at the moment its object was
 * archived — the one row of the merged version list that isn't itself in
 * `TrashObject.noncurrentVersions`. See `deleteCurrentTrashVersionPermanently`
 * for what happens to the rest of the group.
 */
export const useTrashCurrentVersionDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<void, Error, TrashCurrentVersionVariables> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, TrashCurrentVersionVariables>({
    mutationFn: async (variables) => {
      deleteCurrentTrashVersionPermanently(variables.objectId)
      await mockDelay(undefined, 400)
    },
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.trash(variables.projectRef, variables.bucketId),
      })
      await onSuccess?.(data, variables, context)
    },
    onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to delete version: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
