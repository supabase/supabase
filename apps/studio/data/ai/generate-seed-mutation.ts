import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler } from '@/data/fetchers'
import { BASE_PATH } from '@/lib/constants'
import { ResponseError, UseCustomMutationOptions } from '@/types'

export type GenerateSeedVariables = {
  schema: string
  users: Array<{ id: string; email: string }>
  prompt?: string
}

export type GenerateSeedResponse = {
  sql: string
}

export async function generateSeed({ schema, users, prompt }: GenerateSeedVariables) {
  const url = `${BASE_PATH}/api/ai/sql/generate-seed`
  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const response = await fetchHandler(url, {
    headers,
    method: 'POST',
    body: JSON.stringify({ schema, users, prompt }),
  })
  let body: any
  try {
    body = await response.json()
  } catch {}
  if (!response.ok) throw new ResponseError(body?.error ?? body?.message, response.status)
  return body as GenerateSeedResponse
}

type GenerateSeedData = Awaited<ReturnType<typeof generateSeed>>

export const useGenerateSeedMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<GenerateSeedData, ResponseError, GenerateSeedVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<GenerateSeedData, ResponseError, GenerateSeedVariables>({
    mutationFn: (vars) => generateSeed(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to generate seed data: ${data.message}`)
      } else {
        await onError(data, variables, context)
      }
    },
    ...options,
  })
}
