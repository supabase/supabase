import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { getPublicUrlForBucketObject } from 'data/storage/bucket-object-get-public-url-mutation'
import { signBucketObject } from 'data/storage/bucket-object-sign-mutation'
import { Bucket } from 'data/storage/buckets-query'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { ResponseError } from 'types'
import { StorageItem } from '../Storage.types'

const DEFAULT_EXPIRY = 7 * 24 * 60 * 60 // in seconds, default to 1 week

export const fetchFileUrl = async (
  pathToFile: string,
  projectRef: string,
  bucketId: string,
  isBucketPublic: boolean,
  expiresIn?: number
) => {
  if (isBucketPublic) {
    const data = await getPublicUrlForBucketObject({
      projectRef: projectRef,
      bucketId: bucketId,
      path: pathToFile,
    })
    return data.publicUrl
  } else {
    const data = await signBucketObject({
      projectRef: projectRef,
      bucketId: bucketId,
      path: pathToFile,
      expiresIn: expiresIn ?? DEFAULT_EXPIRY,
    })
    return data.signedUrl
  }
}

type UseFileUrlQueryVariables = {
  file: StorageItem
  projectRef: string
  bucket: Bucket
}

export const useFetchFileUrlQuery = (
  { file, projectRef, bucket }: UseFileUrlQueryVariables,
  { ...options }: UseQueryOptions<string, ResponseError> = {}
) => {
  const { getPathAlongOpenedFolders } = useStorageStore()
  const pathToFile = getPathAlongOpenedFolders(false)
  const formattedPathToFile = [pathToFile, file?.name].join('/')

  return useQuery({
    queryKey: [projectRef, 'buckets', bucket.public, bucket.id, 'file', pathToFile],
    queryFn: () =>
      fetchFileUrl(formattedPathToFile, projectRef, bucket.id, bucket.public, DEFAULT_EXPIRY),
    staleTime: DEFAULT_EXPIRY * 1000,
    ...options,
  })
}
