import { useQuery } from '@tanstack/react-query'
import { storageCredentialsKeys } from './s3-access-key-keys'
import { get } from 'data/fetchers'

type FetchStorageCredentials = {
  projectRef?: string
}
async function fetchStorageCredentials({ projectRef }: FetchStorageCredentials) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const res = await get('/platform/storage/{ref}/credentials', {
    params: {
      path: {
        ref: projectRef,
      },
    },
  })

  return res.data
}

type StorageCredentialsQuery = {
  projectRef?: string
}
export function useStorageCredentialsQuery({ projectRef }: StorageCredentialsQuery) {
  const keys = storageCredentialsKeys.credentials(projectRef)

  const query = useQuery({
    queryKey: keys,
    queryFn: () => fetchStorageCredentials({ projectRef }),
    enabled: projectRef !== undefined,
  })

  return query
}
