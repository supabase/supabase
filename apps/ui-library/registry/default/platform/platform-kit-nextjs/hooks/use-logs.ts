'use client'

import { useQuery } from '@tanstack/react-query'

import { client } from '@/registry/default/platform/platform-kit-nextjs/lib/management-api'

// GET Logs
const getLogs = async ({
  projectRef,
  iso_timestamp_start,
  iso_timestamp_end,
  sql,
}: {
  projectRef: string
  iso_timestamp_start?: string
  iso_timestamp_end?: string
  sql?: string
}) => {
  const { data, error } = await client.GET('/v1/projects/{ref}/analytics/endpoints/logs.all', {
    params: {
      path: {
        ref: projectRef,
      },
      query: {
        iso_timestamp_start,
        iso_timestamp_end,
        sql,
      },
    },
  })
  if (error) {
    throw error
  }

  return data
}

export const useGetLogs = (
  projectRef: string,
  params: {
    iso_timestamp_start?: string
    iso_timestamp_end?: string
    sql?: string
  } = {}
) => {
  const queryKey = ['logs', projectRef, params.sql]

  return useQuery({
    queryKey: queryKey,
    queryFn: () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      const queryParams = {
        sql: params.sql,
        iso_timestamp_start: params.iso_timestamp_start ?? oneHourAgo.toISOString(),
        iso_timestamp_end: params.iso_timestamp_end ?? now.toISOString(),
      }
      return getLogs({ projectRef, ...queryParams })
    },
    enabled: !!projectRef,
    retry: false,
  })
}
