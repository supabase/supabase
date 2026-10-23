'use client'

import { useQuery } from '@tanstack/react-query'

import { client } from '@/registry/default/platform/platform-kit-nextjs/lib/management-api'

// GET Buckets
const getBuckets = async (projectRef: string) => {
  const { data, error } = await client.GET('/v1/projects/{ref}/storage/buckets', {
    params: {
      path: {
        ref: projectRef,
      },
    },
  })
  if (error) {
    throw error
  }

  return data
}

export const useGetBuckets = (projectRef: string) => {
  return useQuery({
    queryKey: ['buckets', projectRef],
    queryFn: () => getBuckets(projectRef),
    enabled: !!projectRef,
    retry: false,
  })
}

// LIST Objects
const listObjects = async ({ projectRef, bucketId }: { projectRef: string; bucketId: string }) => {
  const { data, error } = await client.POST(
    // TODO
    // @ts-expect-error this endpoint is not yet implemented
    '/v1/projects/{ref}/storage/buckets/{bucketId}/objects/list',
    {
      params: {
        path: {
          ref: projectRef,
          bucketId,
        },
      },
      body: {
        path: '',
        options: { limit: 100, offset: 0 },
      },
    }
  )
  if (error) {
    throw error
  }

  return data as any
}

export const useListObjects = (projectRef: string, bucketId: string) => {
  return useQuery({
    queryKey: ['objects', projectRef, bucketId],
    queryFn: () => listObjects({ projectRef, bucketId }),
    enabled: !!projectRef && !!bucketId,
  })
}
