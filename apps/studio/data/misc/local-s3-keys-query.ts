import { useQuery } from '@tanstack/react-query'

import { miscKeys } from './keys'
import { fetchHandler } from '@/data/fetchers'
import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export async function getLocalS3Keys() {
  try {
    const data = await fetchHandler(`${BASE_PATH}/api/get-s3-keys`).then((res) => res.json())
    return data as { accessKey?: string; secretKey?: string }
  } catch (error) {
    throw error
  }
}

export type LocalS3KeysData = Awaited<ReturnType<typeof getLocalS3Keys>>
export type LocalS3KeysError = ResponseError

/**
 * Specifically only for local CLI - to use the S3 keys as defined in the env file
 */
export const useLocalS3KeysQuery = <TData = LocalS3KeysData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<LocalS3KeysData, LocalS3KeysError, TData> = {}) =>
  useQuery<LocalS3KeysData, LocalS3KeysError, TData>({
    queryKey: miscKeys.localS3Keys(),
    queryFn: () => getLocalS3Keys(),
    enabled: enabled && !IS_PLATFORM,
    ...options,
  })
