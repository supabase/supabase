import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { BASE_PATH } from 'lib/constants'
import OpenAI from 'openai'
import { aiKeys } from './keys'
import { ResponseError } from 'types'

export type RlsSuggestVariables = {
  thread_id: string
  run_id: string
}

export type RlsSuggestResponse = {
  id: string
  status: 'completed' | 'loading'
  messages: OpenAI.Beta.Threads.Messages.ThreadMessage[]
}

export async function rlsSuggest({ thread_id, run_id }: RlsSuggestVariables, signal?: AbortSignal) {
  const response = await get(`${BASE_PATH}/api/ai/sql/suggest/${thread_id}/${run_id}`, { signal })
  if (response.error) throw response.error

  return response as RlsSuggestResponse
}

export type RlsSuggestData = Awaited<ReturnType<typeof rlsSuggest>>
export type RlsSuggestDataError = ResponseError

export const useRlsSuggestQuery = <TData = RlsSuggestData>(
  { thread_id, run_id }: RlsSuggestVariables,
  options: UseQueryOptions<RlsSuggestData, RlsSuggestDataError, TData> = {}
) =>
  useQuery<RlsSuggestData, RlsSuggestDataError, TData>(
    aiKeys.rlsSuggest(thread_id, run_id),
    ({ signal }) => rlsSuggest({ thread_id, run_id }, signal),
    options
  )
