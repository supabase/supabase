import { useMutation, UseMutationOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import { getMockObjectVersions, mockDelay, type ObjectVersion } from './protection-mocks'

export type ObjectVersionsVariables = {
  projectRef?: string
  bucketId?: string
  objectName?: string
}

export const useObjectVersionsQuery = ({
  projectRef,
  bucketId,
  objectName,
}: ObjectVersionsVariables) =>
  useQuery<ObjectVersion[], Error>({
    queryKey: storageKeys.objectVersions(projectRef, bucketId, objectName),
    queryFn: () => mockDelay(getMockObjectVersions(objectName ?? '')),
    enabled: !!projectRef && !!bucketId && !!objectName,
  })

type ObjectVersionRestoreVariables = {
  projectRef: string
  bucketId: string
  objectName: string
  versionId: string
}

export const useObjectVersionRestoreMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<void, Error, ObjectVersionRestoreVariables> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, ObjectVersionRestoreVariables>({
    mutationFn: () => mockDelay(undefined, 600),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.objectVersions(
          variables.projectRef,
          variables.bucketId,
          variables.objectName
        ),
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

type ObjectVersionDeleteVariables = {
  projectRef: string
  bucketId: string
  objectName: string
  versionId: string
}

export const useObjectVersionDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<void, Error, ObjectVersionDeleteVariables> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, ObjectVersionDeleteVariables>({
    mutationFn: () => mockDelay(undefined, 500),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.objectVersions(
          variables.projectRef,
          variables.bucketId,
          variables.objectName
        ),
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
