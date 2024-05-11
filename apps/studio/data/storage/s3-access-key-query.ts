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

  // Generated types by openapi are wrong so we need to cast it.
  return res.data as any as {
    data: {
      id: string
      created_at: string
      access_key: string
      description: string
    }[]
  }
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
