import { useQuery } from '@tanstack/react-query'

import { storageKeys } from '../keys'
import { getMockRetentionUsage, mockDelay, type StorageRetentionUsage } from './protection-mocks'

export type StorageRetentionUsageVariables = {
  projectRef?: string
}

export const useStorageRetentionUsageQuery = ({
  projectRef,
}: StorageRetentionUsageVariables = {}) =>
  useQuery<StorageRetentionUsage, Error>({
    queryKey: storageKeys.retentionUsage(projectRef),
    queryFn: () => mockDelay(getMockRetentionUsage()),
  })
