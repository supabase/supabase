'use client'

import { useMutation } from '@tanstack/react-query'
import { type AxiosError } from 'axios'
import { toast } from 'sonner'

import { client } from '@/registry/default/platform/platform-kit-nextjs/lib/management-api'

// RUN SQL Query
export const runQuery = async ({
  projectRef,
  query,
  readOnly,
}: {
  projectRef: string
  query: string
  readOnly?: boolean
}) => {
  const { data, error } = await client.POST('/v1/projects/{ref}/database/query', {
    params: {
      path: {
        ref: projectRef,
      },
    },
    body: {
      query,
      read_only: readOnly,
    },
  })

  if (error) {
    throw error
  }

  return data as any
}

export const useRunQuery = () => {
  return useMutation({
    mutationFn: runQuery,
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'There was a problem with your query.')
    },
  })
}
